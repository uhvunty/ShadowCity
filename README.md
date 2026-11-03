<<<<<<< HEAD
# ShadowCity — Urban Digital Twin (Hackathon MVP)

A runnable, scenario-based neighbourhood digital twin prototype. It includes:
- React + Leaflet map UI
- Django REST API
- Python scenario engine (transparent, illustrative flood-susceptibility scoring)
- Road-network connectivity and alternative-route analysis with NetworkX
- Synthetic demo neighbourhood data (so the project runs without external GIS downloads)
- Optional instructions for replacing demo data with OpenStreetMap/elevation data

> **Important modelling limitation:** The flood module is a relative susceptibility demonstration, not a calibrated hydrological/hydraulic model. It does not predict water depth, flood arrival time, or certify real-world safety. The included neighbourhood and results are synthetic. Do not use this prototype for emergency response or infrastructure decisions.

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## 1. Run the backend

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Backend: http://127.0.0.1:8000  
API health: http://127.0.0.1:8000/api/health/

## 2. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

The frontend expects the API at `http://127.0.0.1:8000/api`. Set `VITE_API_BASE` in `frontend/.env` if needed.

## 3. Try the demo
1. Open the dashboard.
2. Select **Flood** or **Road closure**.
3. Adjust rainfall and drainage blockage for flood scenarios.
4. Click **Run simulation**.
5. Inspect the map overlays, impact metrics, and recommendations.
6. Change the parameters and run again to compare scenarios.

## Architecture

```text
React + Leaflet
      |
      v
Django REST API
      |
      +--> Demo geographic dataset (GeoJSON)
      |
      +--> Python simulation engine
               |
               +--> susceptibility score (transparent weighted heuristic)
               +--> road graph (NetworkX)
               +--> affected roads / facility reachability
      |
      +--> Optional Gemini explanation endpoint
```

## Project structure

```text
shadowcity/
  backend/
    config/                 Django project
    simulator/              API, demo data, simulation engine
    requirements.txt
    manage.py
  frontend/
    src/                    React app and map components
    package.json
  docs/
    architecture.md
    demo-script.md
```

## API endpoints

- `GET /api/health/` — health check
- `GET /api/neighbourhood/` — demo neighbourhood GeoJSON and summary
- `POST /api/simulations/run/` — run a scenario
- `GET /api/simulations/` — list saved simulation runs
- `POST /api/explain/` — optional Gemini-generated explanation; falls back to deterministic summary if no API key is configured

### Example simulation request

```json
{
  "event_type": "flood",
  "rainfall": 100,
  "drainage_blockage": 50,
  "scenario_name": "Heavy rain — 50% blocked drainage"
}
```

For road closure:

```json
{
  "event_type": "road_closure",
  "closed_road_ids": ["R2", "R5"],
  "scenario_name": "Main road closure"
}
```

## Replacing the synthetic data
The demo data is intentionally small and self-contained. For a real neighbourhood:
1. Choose a small area and obtain road/building/amenity data from OpenStreetMap.
2. Obtain a suitable DEM (e.g. Copernicus DEM or SRTM) and verify its licence/attribution requirements.
3. Validate drainage information with a reliable local source; OSM drainage coverage may be incomplete.
4. Replace `backend/simulator/demo_data.py` with imported, validated features.
5. Calibrate the susceptibility model against local flood observations before making claims about predictive accuracy.

Potential tools for a future GIS ingestion pipeline: OSMnx, GeoPandas, Shapely, Rasterio, PostGIS.

## Optional Gemini integration
Set an environment variable before running Django:

```bash
export GEMINI_API_KEY="your-key"
```

The app uses Gemini only to explain computed results. It does not ask the model to invent numerical simulation outputs. If the key is absent, a deterministic explanation is returned.

## Suggested team split
- Frontend: React, Leaflet, dashboard and map interactions
- Backend: Django APIs, persistence and integration
- GIS/simulation: susceptibility model and GeoJSON processing
- Algorithms/AI: NetworkX routing, impact analysis and explanation integration

## Next development steps
- Add PostGIS and spatial queries
- Add OSMnx ingestion for a chosen real area
- Replace heuristic flood score with calibrated runoff/hydraulic modelling (e.g. EPA SWMM/HEC-RAS workflows)
- Add user-submitted observations with verification and timestamps
- Add scenario versioning, exportable reports and model validation metrics
=======
# ShadowCity
ShadowCity is an AI-powered urban digital twin that simulates floods, rainfall, drainage blockages, and road closures. It identifies vulnerable areas, analyses infrastructure disruptions, and helps users explore safer routes through interactive maps and simulations.
>>>>>>> 118911286bb6b0d5875c490719ae6e656b7c8bbc
