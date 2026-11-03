
import React, { useEffect } from 'react'

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'

function FitBounds({ geojson }) {
  const map = useMap()

  useEffect(() => {
    if (geojson?.features?.length) {
      const layer = window.L.geoJSON(geojson)
      const bounds = layer.getBounds()

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15))
      }
    }
  }, [geojson, map])

  return null
}

function styleFeature(feature, isResult) {
  const properties = feature.properties || {}

  if (properties.kind === 'road') {
    if (properties.closed || properties.affected) {
      return {
        color: '#e34d59',
        weight: 7,
        opacity: 0.95,
      }
    }

    const score = properties.risk_score ?? 0

    const color =
      score >= 0.75
        ? '#b91c1c'
        : score >= 0.5
          ? '#ea8b32'
          : score >= 0.25
            ? '#d8bd55'
            : '#258b83'

    return {
      color: isResult ? color : '#64748b',
      weight: isResult ? 6 : 4,
      opacity: 0.9,
    }
  }

  const score = properties.risk_score ?? 0

  return {
    color: score >= 0.75
      ? '#b91c1c'
      : score >= 0.5
        ? '#ea8b32'
        : '#258b83',

    fillColor: score >= 0.75
      ? '#ef4444'
      : score >= 0.5
        ? '#f59e0b'
        : '#34a399',

    weight: 1.5,
    fillOpacity: isResult ? 0.48 : 0.25,
  }
}

export default function MapView({
  baseGeojson,
  resultGeojson,
  facilities,
  routeResults = [],
  selectedRouteIndex = 0,
}) {
  const center = [12.9716, 77.5946]

  const routeColors = [
    '#e34d59',
    '#2878c7',
    '#8b5cf6',
  ]

  return (
    <div className="map-wrap">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {baseGeojson && (
          <GeoJSON
            key="base-map"
            data={baseGeojson}
            style={feature => styleFeature(feature, false)}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties || {}

              layer.bindPopup(
                `<b>${properties.name || properties.id}</b><br/>` +
                `${properties.kind || ''}`
              )
            }}
          />
        )}

        {resultGeojson && (
          <GeoJSON
            key="simulation-result"
            data={resultGeojson}
            style={feature => styleFeature(feature, true)}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties || {}

              layer.bindPopup(
                `<b>${properties.name || properties.id}</b><br/>` +
                `Risk: ${properties.risk_score ?? (
                  properties.closed ? 'Closed' : '—'
                )}`
              )
            }}
          />
        )}

        {routeResults.map((route, index) => (
          <GeoJSON
            key={`route-${index}-${selectedRouteIndex}`}
            data={route.geojson}
            style={() => ({
              color: routeColors[index % routeColors.length],
              weight: index === selectedRouteIndex ? 8 : 5,
              opacity: index === selectedRouteIndex ? 1 : 0.65,
              dashArray: index === selectedRouteIndex ? null : '8 8',
            })}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties || {}

              layer.bindPopup(
                `<b>${properties.name || properties.road_id}</b><br/>` +
                `Road risk: ${properties.risk ?? '—'}`
              )
            }}
          />
        ))}

        {(facilities || []).map(facility => (
          <CircleMarker
            key={facility.id}
            center={[
              facility.coordinates[1],
              facility.coordinates[0],
            ]}
            radius={8}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor:
                facility.reachable === false
                  ? '#e34d59'
                  : '#3167c8',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <b>{facility.name}</b>
              <br />
              {facility.kind}
              <br />
              {facility.reachable === false
                ? 'Unreachable in scenario'
                : 'Facility'}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
