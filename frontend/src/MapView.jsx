import React, { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'

function FitBounds({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (geojson?.features?.length) {
      const layer = window.L.geoJSON(geojson)
      const bounds = layer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15))
    }
  }, [geojson, map])
  return null
}

function styleFeature(feature, isResult) {
  const p = feature.properties || {}
  if (p.kind === 'road') {
    if (p.closed || p.affected) return { color: '#e34d59', weight: 7, opacity: 0.95 }
    const score = p.risk_score ?? 0
    const color = score >= .75 ? '#b91c1c' : score >= .5 ? '#ea8b32' : score >= .25 ? '#d8bd55' : '#258b83'
    return { color: isResult ? color : '#64748b', weight: isResult ? 6 : 4, opacity: .9 }
  }
  const score = p.risk_score ?? 0
  return {
    color: score >= .75 ? '#b91c1c' : score >= .5 ? '#ea8b32' : '#258b83',
    fillColor: score >= .75 ? '#ef4444' : score >= .5 ? '#f59e0b' : '#34a399',
    weight: 1.5, fillOpacity: isResult ? .48 : .25,
  }
}

export default function MapView({ baseGeojson, resultGeojson, facilities }) {
  const center = [12.9716, 77.5946]
  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {baseGeojson && <GeoJSON data={baseGeojson} style={(f) => styleFeature(f, false)}
          onEachFeature={(f, layer) => layer.bindPopup(`<b>${f.properties?.name || f.properties?.id}</b><br/>${f.properties?.kind || ''}`)} />}
        {resultGeojson && <GeoJSON data={resultGeojson} style={(f) => styleFeature(f, true)}
          onEachFeature={(f, layer) => layer.bindPopup(`<b>${f.properties?.name || f.properties?.id}</b><br/>Risk: ${f.properties?.risk_score ?? (f.properties?.closed ? 'Closed' : '—')}`)} />}
        {(facilities || []).map((f) => (
          <CircleMarker key={f.id} center={[f.coordinates[1], f.coordinates[0]]}
            radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: f.reachable === false ? '#e34d59' : '#3167c8', fillOpacity: 1 }}>
            <Popup><b>{f.name}</b><br/>{f.kind}<br/>{f.reachable === false ? 'Unreachable in scenario' : 'Facility'}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
