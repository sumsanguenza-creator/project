const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch { /* response had no JSON body */ }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export const getStudents = (search = '') =>
  request(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const createStudent = (student) =>
  request('/students', { method: 'POST', body: JSON.stringify(student) })
export const deleteStudent = (id) =>
  request(`/students/${id}`, { method: 'DELETE' })
