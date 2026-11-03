
import networkx as nx
from . import demo_data as data


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, float(value)))


def classify(score):
    if score < 0.25:
        return "low"
    if score < 0.50:
        return "moderate"
    if score < 0.75:
        return "high"
    return "very_high"


def road_flood_score(road, rainfall, blockage):
    rainfall_factor = clamp(rainfall / 150.0)
    blockage_factor = clamp(blockage / 100.0)
    low_elevation = 1.0 - road["elevation"]
    slope_factor = clamp(road["risk"])
    historical = clamp(road["risk"] * 0.8)

    return clamp(
        0.30 * low_elevation
        + 0.25 * blockage_factor
        + 0.20 * rainfall_factor
        + 0.15 * slope_factor
        + 0.10 * historical
    )


def build_graph(closed_ids=None, affected_ids=None):
    closed_ids = set(closed_ids or [])
    affected_ids = set(affected_ids or [])

    graph = nx.Graph()

    for node, coords in data.NODES.items():
        graph.add_node(node, coordinates=coords)

    for road in data.ROADS:
        if road["id"] in closed_ids or road["id"] in affected_ids:
            continue

        graph.add_edge(
            road["a"],
            road["b"],
            weight=road["length"],
            length=road["length"],
            risk=road["risk"],
            road_id=road["id"],
            name=road["name"],
            geometry=road["geometry"],
        )

    return graph


def run_flood(params):
    rainfall = clamp(params.get("rainfall", 70) / 150.0)
    blockage = clamp(params.get("drainage_blockage", 40) / 100.0)
    threshold = clamp(params.get("risk_threshold", 0.58))

    rainfall_mm = rainfall * 150
    blockage_percent = blockage * 100

    risk_features = []
    affected_roads = []

    for road in data.ROADS:
        score = road_flood_score(
            road, rainfall_mm, blockage_percent
        )

        feature = {
            "type": "Feature",
            "geometry": road["geometry"],
            "properties": {
                "id": road["id"],
                "name": road["name"],
                "kind": "road",
                "risk_score": round(score, 3),
                "risk_level": classify(score),
                "affected": score >= threshold,
            },
        }

        risk_features.append(feature)

        if score >= threshold:
            affected_roads.append(road["id"])

    building_features = []

    for building in data.BUILDINGS:
        score = clamp(
            0.55 * building["risk_base"]
            + 0.25 * blockage
            + 0.20 * rainfall
        )

        building_features.append({
            "type": "Feature",
            "geometry": building["geometry"],
            "properties": {
                "id": building["id"],
                "name": building["name"],
                "kind": building["kind"],
                "risk_score": round(score, 3),
                "risk_level": classify(score),
            },
        })

    graph = build_graph(affected_ids=affected_roads)
    facility_results = []

    for facility in data.FACILITIES:
        reachable = (
            nx.has_path(graph, "A", facility["node"])
            if facility["node"] in graph
            else False
        )

        facility_results.append({
            "id": facility["id"],
            "name": facility["name"],
            "kind": facility["kind"],
            "reachable": reachable,
            "node": facility["node"],
            "coordinates": facility["coordinates"],
        })

    recommendations = []

    if affected_roads:
        recommendations.append(
            "Inspect road segments with the highest relative susceptibility scores."
        )

    if any(not f["reachable"] for f in facility_results):
        recommendations.append(
            "At least one facility is disconnected in this scenario."
        )

    if blockage >= 0.5:
        recommendations.append(
            "Prioritise inspection of drainage assets."
        )

    if not recommendations:
        recommendations.append(
            "No major network disruption was identified by this demonstration model."
        )

    return {
        "event_type": "flood",
        "metrics": {
            "road_segments": len(data.ROADS),
            "affected_roads": len(affected_roads),
            "buildings": len(data.BUILDINGS),
            "high_risk_buildings": sum(
                1 for f in building_features
                if f["properties"]["risk_score"] >= 0.6
            ),
            "reachable_hospitals": sum(
                1 for f in facility_results
                if f["kind"] == "hospital" and f["reachable"]
            ),
            "total_hospitals": sum(
                1 for f in facility_results
                if f["kind"] == "hospital"
            ),
        },
        "risk_geojson": {
            "type": "FeatureCollection",
            "features": risk_features + building_features,
        },
        "facilities": facility_results,
        "affected_road_ids": affected_roads,
        "recommendations": recommendations,
        "model_note": (
            "Illustrative relative susceptibility heuristic; "
            "not a calibrated flood or hydraulic forecast."
        ),
    }


def run_road_closure(params):
    closed_ids = params.get("closed_road_ids") or ["R2"]
    graph = build_graph(closed_ids=closed_ids)

    facilities = []

    for facility in data.FACILITIES:
        reachable = (
            facility["node"] in graph
            and nx.has_path(graph, "A", facility["node"])
        )

        route = None
        distance = None

        if reachable:
            route = nx.shortest_path(
                graph, "A", facility["node"], weight="weight"
            )
            distance = nx.shortest_path_length(
                graph, "A", facility["node"], weight="weight"
            )

        facilities.append({
            "id": facility["id"],
            "name": facility["name"],
            "kind": facility["kind"],
            "reachable": reachable,
            "route_nodes": route,
            "route_distance_m": distance,
            "coordinates": facility["coordinates"],
        })

    closed_features = []

    for road in data.ROADS:
        closed = road["id"] in closed_ids

        closed_features.append({
            "type": "Feature",
            "geometry": road["geometry"],
            "properties": {
                "id": road["id"],
                "name": road["name"],
                "kind": "road",
                "closed": closed,
                "risk_level": "high" if closed else "low",
            },
        })

    return {
        "event_type": "road_closure",
        "metrics": {
            "road_segments": len(data.ROADS),
            "closed_roads": sum(
                1 for r in data.ROADS if r["id"] in closed_ids
            ),
            "reachable_facilities": sum(
                1 for f in facilities if f["reachable"]
            ),
            "total_facilities": len(facilities),
        },
        "risk_geojson": {
            "type": "FeatureCollection",
            "features": closed_features,
        },
        "facilities": facilities,
        "affected_road_ids": closed_ids,
        "recommendations": [
            "Review alternate routes shown for each reachable facility.",
            "Check whether disconnected facilities need a separate access corridor.",
        ],
        "model_note": "Road closure scenario uses the synthetic demo road graph.",
    }


def calculate_route(params):
    start = params["start"]
    destination = params["destination"]
    preference = params.get("preference", "shortest")

    if start not in data.NODES:
        raise ValueError("Invalid starting location.")

    if destination not in data.NODES:
        raise ValueError("Invalid destination.")

    if start == destination:
        raise ValueError("Starting location and destination must be different.")

    closed_ids = set(params.get("closed_road_ids", []))
    avoid_flooded = params.get("avoid_flooded", False)

    affected_ids = set()

    if avoid_flooded:
        rainfall = params.get("rainfall", 100)
        blockage = params.get("drainage_blockage", 50)
        threshold = params.get("risk_threshold", 0.58)

        for road in data.ROADS:
            score = road_flood_score(road, rainfall, blockage)
            if score >= threshold:
                affected_ids.add(road["id"])

    graph = build_graph(
        closed_ids=closed_ids,
        affected_ids=affected_ids,
    )

    if start not in graph or destination not in graph:
        raise ValueError("The selected locations are unavailable.")

    if not nx.has_path(graph, start, destination):
        raise ValueError(
            "No route is available. The selected roads may disconnect these locations."
        )

    def route_weight(a, b, edge):
        length = edge["length"]
        risk = edge["risk"]

        if preference == "shortest":
            return length

        if preference == "safest":
            return (risk * 1000) + (length * 0.05)

        if preference == "balanced":
            return (length / 100) + (risk * 10)

        raise ValueError("Invalid route preference.")

    for a, b, edge in graph.edges(data=True):
        edge["route_weight"] = route_weight(a, b, edge)

    paths = nx.shortest_simple_paths(
        graph,
        start,
        destination,
        weight="route_weight",
    )

    route_results = []

    for path in paths:
        road_ids = []
        total_distance = 0
        risk_values = []
        route_features = []

        for index in range(len(path) - 1):
            a = path[index]
            b = path[index + 1]
            edge = graph[a][b]

            road_ids.append(edge["road_id"])
            total_distance += edge["length"]
            risk_values.append(edge["risk"])

            route_features.append({
                "type": "Feature",
                "geometry": edge["geometry"],
                "properties": {
                    "road_id": edge["road_id"],
                    "name": edge["name"],
                    "risk": round(edge["risk"], 3),
                },
            })

        average_risk = (
            sum(risk_values) / len(risk_values)
            if risk_values else 0
        )

        route_results.append({
            "nodes": path,
            "road_ids": road_ids,
            "distance_m": round(total_distance, 1),
            "average_risk": round(average_risk, 3),
            "risk_level": classify(average_risk),
            "geojson": {
                "type": "FeatureCollection",
                "features": route_features,
            },
        })

        if len(route_results) == 3:
            break

    return {
        "start": start,
        "destination": destination,
        "preference": preference,
        "routes": route_results,
        "closed_roads": sorted(closed_ids),
        "avoided_flood_roads": sorted(affected_ids),
        "message": (
            "Routes are calculated from the synthetic road network. "
            "Distance and risk values are illustrative."
        ),
    }


def run_scenario(params):
    event_type = params.get("event_type", "flood")

    if event_type == "road_closure":
        return run_road_closure(params)

    if event_type == "flood":
        return run_flood(params)

    raise ValueError(
        "Unsupported event_type. Choose 'flood' or 'road_closure'."
    )
