import os
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from . import demo_data
from .models import SimulationRun
from .serializers import SimulationRequestSerializer
from .engine import run_scenario

@require_GET
def health(request):
    return JsonResponse({"status":"ok","service":"ShadowCity API"})

@api_view(["GET"])
def neighbourhood(request):
    features = []
    for road in demo_data.ROADS:
        features.append({"type":"Feature","geometry":road["geometry"],"properties":{
            "id":road["id"],"name":road["name"],"kind":"road"
        }})
    for building in demo_data.BUILDINGS:
        features.append({"type":"Feature","geometry":building["geometry"],"properties":{
            "id":building["id"],"name":building["name"],"kind":building["kind"]
        }})
    for facility in demo_data.FACILITIES:
        lon, lat = facility["coordinates"]
        features.append({"type":"Feature","geometry":{"type":"Point","coordinates":[lon,lat]},
                         "properties":{"id":facility["id"],"name":facility["name"],"kind":facility["kind"]}})
    for drain in demo_data.DRAINAGE:
        lon, lat = drain["coordinates"]
        features.append({"type":"Feature","geometry":{"type":"Point","coordinates":[lon,lat]},
                         "properties":{"id":drain["id"],"name":drain["name"],"kind":"drainage"}})
    return Response({
        "name":demo_data.NEIGHBOURHOOD_NAME,
        "center":demo_data.CENTER,
        "summary":{"roads":len(demo_data.ROADS),"buildings":len(demo_data.BUILDINGS),
                   "facilities":len(demo_data.FACILITIES),"drainage_points":len(demo_data.DRAINAGE)},
        "geojson":{"type":"FeatureCollection","features":features}
    })

@api_view(["POST"])
def run_simulation(request):
    serializer = SimulationRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    params = serializer.validated_data
    try:
        result = run_scenario(params)
    except ValueError as exc:
        return Response({"error":str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    run = SimulationRun.objects.create(
        scenario_name=params.get("scenario_name","Untitled scenario"),
        event_type=params["event_type"],
        parameters=params,
        results=result
    )
    result["simulation_id"] = run.id
    result["created_at"] = run.created_at.isoformat()
    return Response(result)

@api_view(["GET"])
def simulation_list(request):
    rows = SimulationRun.objects.order_by("-created_at")[:30]
    return Response([{
        "id":r.id,"scenario_name":r.scenario_name,"event_type":r.event_type,
        "parameters":r.parameters,"created_at":r.created_at.isoformat()
    } for r in rows])

@api_view(["POST"])
def explain(request):
    result = request.data.get("results", {})
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                "Explain these computed urban scenario results to a non-technical city planner. "
                "Do not invent numbers, causes, certainty, or safety advice. Clearly state that this "
                "is a demonstration model and identify assumptions. Results: " + str(result)
            )
            response = model.generate_content(prompt)
            return Response({"explanation":response.text,"source":"Gemini"})
        except Exception as exc:
            return Response({"explanation":fallback_explanation(result),"source":"fallback",
                             "warning":f"Gemini unavailable: {str(exc)[:180]}"})
    return Response({"explanation":fallback_explanation(result),"source":"fallback"})

def fallback_explanation(result):
    metrics = result.get("metrics", {})
    recs = result.get("recommendations", [])
    lines = ["This scenario summary is based on the prototype's computed results."]
    for key, value in metrics.items():
        lines.append(f"- {key.replace('_',' ').title()}: {value}")
    if recs:
        lines.append("Suggested review points: " + " ".join(recs))
    lines.append("These outputs are illustrative and should not be used as real-world emergency or engineering advice.")
    return "\n".join(lines)
