
const API = (
  import.meta.env.VITE_API_BASE || '/api'
).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))

    throw new Error(
      body.detail ||
      body.error ||
      `Request failed (${response.status})`
    )
  }

  return response.json()
}

export const getNeighbourhood = () =>
  request('/neighbourhood/')

export const runSimulation = (payload) =>
  request('/simulations/run/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const planRoute = (payload) =>
  request('/routes/plan/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const explainResults = (results) =>
  request('/explain/', {
    method: 'POST',
    body: JSON.stringify({ results }),
  })
