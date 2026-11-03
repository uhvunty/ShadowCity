const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || body.error || `Request failed (${response.status})`)
  }
  return response.json()
}

export const getNeighbourhood = () => request('/neighbourhood/')
export const runSimulation = (payload) => request('/simulations/run/', {
  method: 'POST', body: JSON.stringify(payload),
})
export const explainResults = (results) => request('/explain/', {
  method: 'POST', body: JSON.stringify({ results }),
})
