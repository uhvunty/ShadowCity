
import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Building2,
  CloudRain,
  GitCompareArrows,
  MapPinned,
  Route,
  ShieldCheck,
  Waves,
  Navigation,
  ArrowRight,
} from 'lucide-react'

import MapView from './MapView'
import {
  getNeighbourhood,
  runSimulation,
  explainResults,
  planRoute,
} from './api'

const initial = {
  event_type: 'flood',
  rainfall: 100,
  drainage_blockage: 50,
  risk_threshold: 0.58,
  closed_road_ids: ['R2'],
  scenario_name: 'Flood scenario — 50% drainage blockage',
}

const locations = [
  { value: 'A', label: 'A — North-west intersection' },
  { value: 'B', label: 'B — Northside Hospital' },
  { value: 'C', label: 'C — North-east intersection' },
  { value: 'D', label: 'D — Market intersection' },
  { value: 'E', label: 'E — Lake intersection' },
  { value: 'F', label: 'F — South-west intersection' },
  { value: 'G', label: 'G — Community Clinic' },
  { value: 'H', label: 'H — Demo Public School' },
]

const roadIds = [
  'R1', 'R2', 'R3', 'R4', 'R5',
  'R6', 'R7', 'R8', 'R9', 'R10',
]

function Metric({ label, value, icon: Icon, tone = 'blue' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value ?? '—'}</strong>
    </div>
  )
}

export default function App() {
  const [neighbourhood, setNeighbourhood] = useState(null)
  const [params, setParams] = useState(initial)

  const [result, setResult] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [routeParams, setRouteParams] = useState({
    start: 'A',
    destination: 'B',
    preference: 'shortest',
    avoid_flooded: false,
    use_closed_roads: false,
  })

  const [routeResult, setRouteResult] = useState(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    getNeighbourhood()
      .then(setNeighbourhood)
      .catch(e => setError(e.message))
  }, [])

  const set = (key, value) => {
    setParams(previous => ({
      ...previous,
      [key]: value,
    }))
  }

  const setRoute = (key, value) => {
    setRouteParams(previous => ({
      ...previous,
      [key]: value,
    }))
  }

  const run = async () => {
    setLoading(true)
    setError('')
    setExplanation('')

    try {
      const next = await runSimulation(params)
      setResult(next)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const explain = async () => {
    if (!result) return

    try {
      const data = await explainResults(result)
      setExplanation(data.explanation)
    } catch (e) {
      setExplanation(e.message)
    }
  }

  const changeType = type => {
    setParams(previous => ({
      ...previous,
      event_type: type,
      scenario_name:
        type === 'flood'
          ? 'Flood scenario'
          : 'Road closure scenario',
    }))

    setResult(null)
  }

  const findRoute = async () => {
    setRouteLoading(true)
    setError('')
    setRouteResult(null)
    setSelectedRouteIndex(0)

    try {
      const payload = {
        start: routeParams.start,
        destination: routeParams.destination,
        preference: routeParams.preference,

        closed_road_ids: routeParams.use_closed_roads
          ? params.closed_road_ids
          : [],

        avoid_flooded: routeParams.avoid_flooded,

        rainfall: params.rainfall,
        drainage_blockage: params.drainage_blockage,
        risk_threshold: params.risk_threshold,
      }

      const data = await planRoute(payload)
      setRouteResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setRouteLoading(false)
    }
  }

  const selectedRoute =
    routeResult?.routes?.[selectedRouteIndex]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Waves size={21} />
          </div>

          <div>
            <b>SHADOWCITY</b>
            <small>URBAN INTELLIGENCE PLATFORM</small>
          </div>
        </div>

        <div className="top-status">
          <span className="status-dot" />
          DEMO ENVIRONMENT
          <span className="divider-v" />
          <span>Neighbourhood: Demo Area</span>
        </div>
      </header>

      <main className="content">
        <section className="intro">
          <div>
            <div className="eyebrow">
              DIGITAL TWIN / SCENARIO LAB
            </div>

            <h1>
              Understand the impact <em>before it happens.</em>
            </h1>

            <p>
              Explore a neighbourhood, simulate infrastructure
              disruptions, plan routes and analyse how connected
              urban systems respond.
            </p>
          </div>

          <div className="intro-chip">
            <ShieldCheck size={17} />
            Scenario-based prototype
          </div>
        </section>

        {error && (
          <div className="error">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <section className="workspace">
          <div className="map-panel panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">LIVE DIGITAL TWIN</span>
                <h2>
                  {neighbourhood?.name || 'Loading neighbourhood…'}
                </h2>
              </div>

              <span className="map-tag">
                <MapPinned size={14} />
                SYNTHETIC DEMO DATA
              </span>
            </div>

            <MapView
              baseGeojson={neighbourhood?.geojson}
              resultGeojson={result?.risk_geojson}
              facilities={result?.facilities}
              routeResults={routeResult?.routes || []}
              selectedRouteIndex={selectedRouteIndex}
            />

            <div className="map-legend">
              <span><i className="legend-road" />Road network</span>
              <span><i className="legend-risk" />Affected / high risk</span>
              <span><i className="legend-facility" />Facilities</span>
              <span><i className="legend-route" />Selected route</span>
            </div>

            <div className="map-footnote">
              Map tiles © OpenStreetMap contributors.
              Demo roads and locations are synthetic and shown
              near Bengaluru for interface demonstration.
            </div>
          </div>

          <aside className="control-panel panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SCENARIO CONTROLS</span>
                <h2>Simulation studio</h2>
              </div>
              <Activity size={19} />
            </div>

            <label className="field-label">EVENT TYPE</label>

            <div className="scenario-tabs">
              <button
                className={
                  params.event_type === 'flood' ? 'active' : ''
                }
                onClick={() => changeType('flood')}
              >
                <CloudRain size={16} />
                Flood
              </button>

              <button
                className={
                  params.event_type === 'road_closure' ? 'active' : ''
                }
                onClick={() => changeType('road_closure')}
              >
                <Route size={16} />
                Road closure
              </button>
            </div>

            {params.event_type === 'flood' ? (
              <>
                <div className="range-field">
                  <div>
                    <label>Rainfall intensity</label>
                    <b>{params.rainfall} mm</b>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={params.rainfall}
                    onChange={e =>
                      set('rainfall', Number(e.target.value))
                    }
                  />

                  <small>
                    Scenario input, not a weather forecast
                  </small>
                </div>

                <div className="range-field">
                  <div>
                    <label>Drainage blockage</label>
                    <b>{params.drainage_blockage}%</b>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.drainage_blockage}
                    onChange={e =>
                      set(
                        'drainage_blockage',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="range-field">
                  <div>
                    <label>Risk threshold</label>
                    <b>{params.risk_threshold.toFixed(2)}</b>
                  </div>

                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.01"
                    value={params.risk_threshold}
                    onChange={e =>
                      set(
                        'risk_threshold',
                        Number(e.target.value)
                      )
                    }
                  />

                  <small>
                    Controls which road scores are flagged
                  </small>
                </div>
              </>
            ) : (
              <>
                <label className="field-label">
                  SELECT ROADS TO CLOSE
                </label>

                <div className="road-checks">
                  {roadIds.map(id => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={params.closed_road_ids.includes(id)}
                        onChange={e =>
                          set(
                            'closed_road_ids',
                            e.target.checked
                              ? [...params.closed_road_ids, id]
                              : params.closed_road_ids.filter(
                                  road => road !== id
                                )
                          )
                        }
                      />
                      {id}
                    </label>
                  ))}
                </div>

                <small className="hint">
                  Select roads that should be unavailable.
                </small>
              </>
            )}

            <label className="field-label">SCENARIO NAME</label>

            <input
              className="text-input"
              value={params.scenario_name}
              onChange={e =>
                set('scenario_name', e.target.value)
              }
            />

            <button
              className="run-button"
              onClick={run}
              disabled={loading}
            >
              {loading ? 'Running simulation…' : '▶ Run simulation'}
            </button>

            <p className="control-note">
              Outputs are illustrative model results.
              They are not operational emergency guidance.
            </p>
          </aside>
        </section>

        <section className="route-section panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">NETWORK ANALYSIS</span>
              <h2>Interactive Route Planner</h2>
            </div>
            <Navigation size={20} />
          </div>

          <p className="route-description">
            Choose two locations and let the road-network
            algorithm calculate possible routes between them.
          </p>

          <div className="route-form">
            <div>
              <label className="field-label">START LOCATION</label>

              <select
                className="text-input"
                value={routeParams.start}
                onChange={e => setRoute('start', e.target.value)}
              >
                {locations.map(location => (
                  <option
                    key={location.value}
                    value={location.value}
                  >
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="route-arrow">
              <ArrowRight size={20} />
            </div>

            <div>
              <label className="field-label">DESTINATION</label>

              <select
                className="text-input"
                value={routeParams.destination}
                onChange={e =>
                  setRoute('destination', e.target.value)
                }
              >
                {locations.map(location => (
                  <option
                    key={location.value}
                    value={location.value}
                  >
                    {location.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="field-label">ROUTE PREFERENCE</label>

          <div className="preference-options">
            {[
              ['shortest', 'Shortest', 'Minimum distance'],
              ['safest', 'Safest', 'Lower road-risk score'],
              ['balanced', 'Balanced', 'Distance and risk'],
            ].map(([value, title, description]) => (
              <button
                key={value}
                className={
                  routeParams.preference === value
                    ? 'preference-card active'
                    : 'preference-card'
                }
                onClick={() => setRoute('preference', value)}
              >
                <b>{title}</b>
                <small>{description}</small>
              </button>
            ))}
          </div>

          <div className="route-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={routeParams.use_closed_roads}
                onChange={e =>
                  setRoute('use_closed_roads', e.target.checked)
                }
              />
              Avoid roads selected as closed in the simulation
            </label>

            <label>
              <input
                type="checkbox"
                checked={routeParams.avoid_flooded}
                onChange={e =>
                  setRoute('avoid_flooded', e.target.checked)
                }
              />
              Avoid roads above the flood-risk threshold
            </label>
          </div>

          <button
            className="run-button route-run-button"
            onClick={findRoute}
            disabled={routeLoading}
          >
            {routeLoading
              ? 'Calculating routes…'
              : 'Find best routes'}
          </button>

          {routeResult && (
            <div className="route-results">
              <div className="route-results-heading">
                <div>
                  <span className="eyebrow">CALCULATED ROUTES</span>
                  <h3>
                    {routeResult.routes.length} route option(s) found
                  </h3>
                </div>
                <span className="route-preference-label">
                  {routeResult.preference}
                </span>
              </div>

              {routeResult.routes.map((route, index) => (
                <button
                  key={index}
                  className={
                    selectedRouteIndex === index
                      ? 'route-result-card selected'
                      : 'route-result-card'
                  }
                  onClick={() => setSelectedRouteIndex(index)}
                >
                  <div className="route-result-top">
                    <b>
                      {index === 0
                        ? 'Recommended route'
                        : `Alternative route ${index}`}
                    </b>

                    <span>
                      {route.distance_m} m
                    </span>
                  </div>

                  <div className="route-node-list">
                    {route.nodes.join(' → ')}
                  </div>

                  <div className="route-result-bottom">
                    <span>
                      Roads: {route.road_ids.join(', ')}
                    </span>
                    <span>
                      Average risk: {route.average_risk}
                      {' · '}
                      {route.risk_level}
                    </span>
                  </div>
                </button>
              ))}

              {selectedRoute && (
                <div className="selected-route-info">
                  <b>Selected route details</b>
                  <p>
                    Distance: {selectedRoute.distance_m} metres
                  </p>
                  <p>
                    Intersections: {selectedRoute.nodes.join(' → ')}
                  </p>
                  <p>
                    Roads used: {selectedRoute.road_ids.join(', ')}
                  </p>
                </div>
              )}

              <p className="control-note">
                {routeResult.message}
              </p>
            </div>
          )}
        </section>

        <section className="results-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">MODEL OUTPUT</span>
              <h2>Impact intelligence</h2>
            </div>

            {result && (
              <span className="run-id">
                RUN #{result.simulation_id}
              </span>
            )}
          </div>

          {!result ? (
            <div className="empty-state">
              <div className="empty-icon">
                <GitCompareArrows size={24} />
              </div>
              <b>No simulation run yet</b>
              <span>
                Choose a scenario and run the model to see impact analysis.
              </span>
            </div>
          ) : (
            <>
              <div className="metrics-grid">
                {result.event_type === 'flood' ? (
                  <>
                    <Metric
                      label="Affected road segments"
                      value={result.metrics.affected_roads}
                      icon={Route}
                      tone="red"
                    />

                    <Metric
                      label="High-risk buildings"
                      value={result.metrics.high_risk_buildings}
                      icon={Building2}
                      tone="amber"
                    />

                    <Metric
                      label="Reachable hospitals"
                      value={`${result.metrics.reachable_hospitals}/${result.metrics.total_hospitals}`}
                      icon={ShieldCheck}
                      tone="green"
                    />

                    <Metric
                      label="Total road segments"
                      value={result.metrics.road_segments}
                      icon={MapPinned}
                    />
                  </>
                ) : (
                  <>
                    <Metric
                      label="Closed roads"
                      value={result.metrics.closed_roads}
                      icon={Route}
                      tone="red"
                    />

                    <Metric
                      label="Reachable facilities"
                      value={`${result.metrics.reachable_facilities}/${result.metrics.total_facilities}`}
                      icon={ShieldCheck}
                      tone="green"
                    />

                    <Metric
                      label="Total road segments"
                      value={result.metrics.road_segments}
                      icon={MapPinned}
                    />
                  </>
                )}
              </div>

              <div className="analysis-grid">
                <div className="panel recommendations">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">DECISION SUPPORT</span>
                      <h2>What needs attention?</h2>
                    </div>
                  </div>

                  {result.recommendations.map((item, index) => (
                    <div className="recommendation" key={index}>
                      <span>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p>{item}</p>
                    </div>
                  ))}

                  <button
                    className="secondary-button"
                    onClick={explain}
                  >
                    Generate AI explanation
                  </button>

                  {explanation && (
                    <div className="explanation">
                      {explanation}
                    </div>
                  )}
                </div>

                <div className="panel comparison-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">MODEL TRANSPARENCY</span>
                      <h2>Assumptions and limitations</h2>
                    </div>
                  </div>

                  <p>{result.model_note}</p>

                  <p>
                    Scenario inputs are user-selected. The risk
                    score is a weighted heuristic and has not been
                    calibrated against local observations.
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        <footer>
          SHADOWCITY · HACKATHON MVP
          <span>
            Built for scenario exploration, not operational forecasting.
          </span>
        </footer>
      </main>
    </div>
  )
}
