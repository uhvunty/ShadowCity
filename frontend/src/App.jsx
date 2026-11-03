import React, { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Building2, CloudRain, GitCompareArrows, MapPinned, Route, ShieldCheck, Waves } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import MapView from './MapView'
import { getNeighbourhood, runSimulation, explainResults } from './api'

const initial = { event_type: 'flood', rainfall: 100, drainage_blockage: 50, risk_threshold: 0.58, closed_road_ids: ['R2'], scenario_name: 'Flood scenario — 50% drainage blockage' }

function Metric({ label, value, icon: Icon, tone = 'blue' }) {
  return <div className={`metric metric-${tone}`}><div className="metric-top"><span>{label}</span><Icon size={17}/></div><strong>{value ?? '—'}</strong></div>
}

export default function App() {
  const [neighbourhood, setNeighbourhood] = useState(null)
  const [params, setParams] = useState(initial)
  const [result, setResult] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getNeighbourhood().then(setNeighbourhood).catch(e => setError(e.message))
  }, [])

  const set = (key, value) => setParams(p => ({ ...p, [key]: value }))
  const run = async () => {
    setLoading(true); setError(''); setExplanation('')
    try {
      const next = await runSimulation(params)
      if (result) setPrevious(result)
      setResult(next)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  const explain = async () => {
    if (!result) return
    try {
      const data = await explainResults(result)
      setExplanation(data.explanation)
    } catch (e) { setExplanation(e.message) }
  }

  const chartData = useMemo(() => {
    if (!result?.metrics) return []
    const m = result.metrics
    return [
      { name: 'Roads affected', value: m.affected_roads ?? m.closed_roads ?? 0 },
      { name: 'Buildings at high risk', value: m.high_risk_buildings ?? 0 },
      { name: 'Facilities reachable', value: m.reachable_facilities ?? m.reachable_hospitals ?? 0 },
    ]
  }, [result])

  const changeType = (type) => {
    setParams(p => ({ ...p, event_type: type,
      scenario_name: type === 'flood' ? 'Flood scenario' : 'Road closure scenario' }))
    setResult(null); setPrevious(null)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Waves size={21}/></div><div><b>SHADOWCITY</b><small>URBAN INTELLIGENCE PLATFORM</small></div></div>
        <div className="top-status"><span className="status-dot"/> DEMO ENVIRONMENT <span className="divider-v"/> <span>Neighbourhood: Demo Area</span></div>
      </header>

      <main className="content">
        <section className="intro">
          <div><div className="eyebrow">DIGITAL TWIN / SCENARIO LAB</div><h1>Understand the impact <em>before it happens.</em></h1>
            <p>Explore a neighbourhood, simulate infrastructure disruptions, and analyse how connected urban systems respond.</p></div>
          <div className="intro-chip"><ShieldCheck size={17}/> Scenario-based prototype</div>
        </section>

        {error && <div className="error"><AlertTriangle size={17}/>{error}</div>}

        <section className="workspace">
          <div className="map-panel panel">
            <div className="panel-heading"><div><span className="eyebrow">LIVE DIGITAL TWIN</span><h2>{neighbourhood?.name || 'Loading neighbourhood…'}</h2></div><span className="map-tag"><MapPinned size={14}/> SYNTHETIC DEMO DATA</span></div>
            <MapView baseGeojson={neighbourhood?.geojson} resultGeojson={result?.risk_geojson} facilities={result?.facilities}/>
            <div className="map-legend"><span><i className="legend-road"/>Road network</span><span><i className="legend-risk"/>Affected / high risk</span><span><i className="legend-facility"/>Facilities</span><span><i className="legend-building"/>Buildings</span></div>
            <div className="map-footnote">Map tiles © OpenStreetMap contributors. Demo features are synthetic and shown near Bengaluru for interface demonstration.</div>
          </div>

          <aside className="control-panel panel">
            <div className="panel-heading"><div><span className="eyebrow">SCENARIO CONTROLS</span><h2>Simulation studio</h2></div><Activity size={19}/></div>
            <label className="field-label">EVENT TYPE</label>
            <div className="scenario-tabs">
              <button className={params.event_type === 'flood' ? 'active' : ''} onClick={() => changeType('flood')}><CloudRain size={16}/> Flood</button>
              <button className={params.event_type === 'road_closure' ? 'active' : ''} onClick={() => changeType('road_closure')}><Route size={16}/> Road closure</button>
            </div>

            {params.event_type === 'flood' ? <>
              <div className="range-field"><div><label>Rainfall intensity</label><b>{params.rainfall} mm</b></div><input type="range" min="0" max="150" value={params.rainfall} onChange={e => set('rainfall', Number(e.target.value))}/><small>Scenario input, not a weather forecast</small></div>
              <div className="range-field"><div><label>Drainage blockage</label><b>{params.drainage_blockage}%</b></div><input type="range" min="0" max="100" value={params.drainage_blockage} onChange={e => set('drainage_blockage', Number(e.target.value))}/></div>
              <div className="range-field"><div><label>Risk threshold</label><b>{params.risk_threshold.toFixed(2)}</b></div><input type="range" min="0.2" max="0.9" step="0.01" value={params.risk_threshold} onChange={e => set('risk_threshold', Number(e.target.value))}/><small>Controls which road scores are flagged as affected</small></div>
            </> : <>
              <label className="field-label">SELECT ROADS TO CLOSE</label>
              <div className="road-checks">{['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10'].map(id => <label key={id}><input type="checkbox" checked={params.closed_road_ids.includes(id)} onChange={e => set('closed_road_ids', e.target.checked ? [...params.closed_road_ids,id] : params.closed_road_ids.filter(x => x !== id))}/>{id}</label>)}</div>
              <small className="hint">Try closing R2 and R5 to see how network connectivity changes.</small>
            </>}

            <label className="field-label">SCENARIO NAME</label>
            <input className="text-input" value={params.scenario_name} onChange={e => set('scenario_name', e.target.value)} />
            <button className="run-button" onClick={run} disabled={loading}>{loading ? 'Running simulation…' : '▶  Run simulation'}</button>
            <p className="control-note">Outputs are illustrative model results. They are not operational emergency guidance.</p>
          </aside>
        </section>

        <section className="results-section">
          <div className="section-title"><div><span className="eyebrow">MODEL OUTPUT</span><h2>Impact intelligence</h2></div>{result && <span className="run-id">RUN #{result.simulation_id}</span>}</div>
          {!result ? <div className="empty-state"><div className="empty-icon"><GitCompareArrows size={24}/></div><b>No simulation run yet</b><span>Choose a scenario and run the model to see impact analysis.</span></div> : <>
            <div className="metrics-grid">
              {result.event_type === 'flood' ? <>
                <Metric label="Affected road segments" value={result.metrics.affected_roads} icon={Route} tone="red"/>
                <Metric label="High-risk buildings" value={result.metrics.high_risk_buildings} icon={Building2} tone="amber"/>
                <Metric label="Reachable hospitals" value={`${result.metrics.reachable_hospitals}/${result.metrics.total_hospitals}`} icon={ShieldCheck} tone="green"/>
                <Metric label="Total road segments" value={result.metrics.road_segments} icon={MapPinned}/>
              </> : <>
                <Metric label="Closed roads" value={result.metrics.closed_roads} icon={Route} tone="red"/>
                <Metric label="Reachable facilities" value={`${result.metrics.reachable_facilities}/${result.metrics.total_facilities}`} icon={ShieldCheck} tone="green"/>
                <Metric label="Total road segments" value={result.metrics.road_segments} icon={MapPinned}/>
              </>}
            </div>
            <div className="analysis-grid">
              <div className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">SCENARIO METRICS</span><h2>Impact snapshot</h2></div></div>
                <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#367e78" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
              </div>
              <div className="panel recommendations"><div className="panel-heading"><div><span className="eyebrow">DECISION SUPPORT</span><h2>What needs attention?</h2></div></div>
                {result.recommendations.map((r,i)=><div className="recommendation" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{r}</p></div>)}
                <button className="secondary-button" onClick={explain}>Generate AI explanation</button>
                {explanation && <div className="explanation">{explanation}</div>}
              </div>
            </div>
            <div className="panel comparison-panel"><div className="panel-heading"><div><span className="eyebrow">MODEL TRANSPARENCY</span><h2>Assumptions and limitations</h2></div></div><p>{result.model_note}</p><p>Scenario inputs are user-selected. The risk score is a weighted heuristic and has not been calibrated against local observations. Validate data and model outputs before any real-world use.</p></div>
          </>}
        </section>

        <footer>SHADOWCITY · HACKATHON MVP <span>Built for scenario exploration, not operational forecasting.</span></footer>
      </main>
    </div>
  )
}
