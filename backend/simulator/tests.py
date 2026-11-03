from django.test import TestCase
from .engine import run_scenario

class SimulationEngineTests(TestCase):
    def test_flood_scenario_returns_geojson(self):
        result = run_scenario({"event_type":"flood","rainfall":100,"drainage_blockage":50})
        self.assertEqual(result["risk_geojson"]["type"], "FeatureCollection")
        self.assertIn("affected_roads", result["metrics"])

    def test_road_closure_scenario(self):
        result = run_scenario({"event_type":"road_closure","closed_road_ids":["R2"]})
        self.assertEqual(result["event_type"], "road_closure")
        self.assertIn("facilities", result)
