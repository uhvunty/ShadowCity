import networkx as nx
from . import demo_data as data

def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, float(value)))

def classify(score):
    if score < 0.25: return "low"
    if score < 0.50: return "moderate"
    if score < 0.75: return "high"
    return "very_high"

def build_graph(closed_ids=None, affected_ids=None):
    closed_ids = set(closed_ids or [])
    affected_ids = set(affected_ids or [])
    graph = nx.Graph()
    for node, coords in data.NODES.items():
        graph.add_node(node, coordinates=coords)
    for road in data.ROADS:
        if road["id"] in closed_ids or road["id"] in affected_ids:
            continue
        graph.add_edge(road["a"], road["b"], weight=road["length"], road_id=road["id"])
    return graph

def run_flood(params):
    rainfall = clamp(params.get("rainfall", 70) / 150.0)
    blockage = clamp(params.get("drainage_blockage", 40) / 100.0)
    risk_features = []
    affected_roads = []
    threshold = clamp(params.get("risk_threshold", 0.58))
    for road in data.ROADS:
        low_elevation = 1.0 - road["elevation"]
        slope_factor = clamp(road["risk"])
        historical = clamp(road["risk"] * 0.8)
        score = clamp(
            0.30 * low_elevation +
            0.25 * blockage +
            0.20 * rainfall +
            0.15 * slope_factor +
            0.10 * historical
        )
        feature = {
            "type": "Feature",
            "geometry": road["geometry"],
            "properties": {
                "id": road["id"], "name": road["name"], "kind": "road",
                "risk_score": round(score, 3), "risk_level": classify(score),
                "affected": score >= threshold
            }
        }
        risk_features.append(feature)
        if score >= threshold:
            affected_roads.append(road["id"])

    building_features = []
    for building in data.BUILDINGS:
        score = clamp(
            0.55 * building["risk_base"] +
            0.25 * blockage +
            0.20 * rainfall
        )
        building_features.append({
            "type": "Feature",
            "geometry": building["geometry"],
            "properties": {
                "id": building["id"], "name": building["name"],
                "kind": building["kind"], "risk_score": round(score, 3),
                "risk_level": classify(score)
            }
        })

    graph = build_graph(affected_ids=affected_roads)
    facility_results = []
    for facility in data.FACILITIES:
        reachable = nx.has_path(graph, "A", facility["node"]) if "A" in graph and facility["node"] in graph else False
        facility_results.append({
            "id": facility["id"], "name": facility["name"],
            "kind": facility["kind"], "reachable": reachable,
            "node": facility["node"], "coordinates": facility["coordinates"]
        })

    recommendations = []
    if affected_roads:
        recommendations.append("Inspect the road segments with the highest relative susceptibility scores.")
    if any(not f["reachable"] for f in facility_results):
        recommendations.append("At least one facility is disconnected in this scenario; review alternative access routes.")
    if blockage >= 0.5:
        recommendations.append("Prioritise inspection and maintenance of drainage assets in the selected scenario.")
    if not recommendations:
        recommendations.append("No major network disruption was identified by this demonstration model.")

    return {
        "event_type": "flood",
        "metrics": {
            "road_segments": len(data.ROADS),
            "affected_roads": len(affected_roads),
            "buildings": len(data.BUILDINGS),
            "high_risk_buildings": sum(1 for f in building_features if f["properties"]["risk_score"] >= 0.6),
            "reachable_hospitals": sum(1 for f in facility_results if f["kind"] == "hospital" and f["reachable"]),
            "total_hospitals": sum(1 for f in facility_results if f["kind"] == "hospital"),
        },
        "risk_geojson": {"type":"FeatureCollection","features":risk_features + building_features},
        "facilities": facility_results,
        "affected_road_ids": affected_roads,
        "recommendations": recommendations,
        "model_note": "Illustrative relative susceptibility heuristic; not a calibrated flood or hydraulic forecast."
    }

def run_road_closure(params):
    closed_ids = params.get("closed_road_ids") or ["R2"]
    graph = build_graph(closed_ids=closed_ids)
    facilities = []
    for facility in data.FACILITIES:
        reachable = nx.has_path(graph, "A", facility["node"]) if facility["node"] in graph else False
        route = None
        distance = None
        if reachable:
            route = nx.shortest_path(graph, "A", facility["node"], weight="weight")
            distance = nx.shortest_path_length(graph, "A", facility["node"], weight="weight")
        facilities.append({
            "id": facility["id"], "name": facility["name"], "kind": facility["kind"],
            "reachable": reachable, "route_nodes": route, "route_distance_m": distance,
            "coordinates": facility["coordinates"]
        })
    closed_features = []
    for road in data.ROADS:
        closed = road["id"] in closed_ids
        closed_features.append({
            "type":"Feature","geometry":road["geometry"],
            "properties":{"id":road["id"],"name":road["name"],"kind":"road",
                          "closed":closed,"risk_level":"high" if closed else "low"}
        })
    return {
        "event_type":"road_closure",
        "metrics":{
            "road_segments":len(data.ROADS),
            "closed_roads":len([r for r in data.ROADS if r["id"] in closed_ids]),
            "reachable_facilities":sum(1 for f in facilities if f["reachable"]),
            "total_facilities":len(facilities),
        },
        "risk_geojson":{"type":"FeatureCollection","features":closed_features},
        "facilities":facilities,
        "affected_road_ids":closed_ids,
        "recommendations":[
            "Review the alternate routes shown for each reachable facility.",
            "Check whether disconnected facilities need a separate access corridor."
        ],
        "model_note":"Road closure scenario uses the synthetic demo road graph."
    }

def run_scenario(params):
    event_type = params.get("event_type", "flood")
    if event_type == "road_closure":
        return run_road_closure(params)
    if event_type == "flood":
        return run_flood(params)
    raise ValueError("Unsupported event_type. Choose 'flood' or 'road_closure'.")
