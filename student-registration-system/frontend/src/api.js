
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const TOKEN_KEY = 'campusdesk_admin_token'

export const saveAdminToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getAdminToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const clearAdminToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export async function adminLogin(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.detail || `Login failed (${response.status})`)
  }

  saveAdminToken(body.access_token)
  return body
}

async function request(path, options = {}) {
  const token = getAdminToken()

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const body = await response.json()
      message = body.detail || message
    } catch {
      // Response had no JSON body
    }

    if (response.status === 401) {
      clearAdminToken()
    }

    throw new Error(message)
  }

  if (response.status === 204) return null

  return response.json()
}

export const getStudents = (search = '') =>
  request(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`)

export const createStudent = (student) =>
  request('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  })

export const deleteStudent = (id) =>
  request(`/students/${id}`, { method: 'DELETE' })

export const updateStudent = (id, student) =>
  request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(student),
  })

  
const STUDENT_TOKEN_KEY = 'campusdesk_student_token'

export const saveStudentToken = (token) => {
  localStorage.setItem(STUDENT_TOKEN_KEY, token)
}

export const getStudentToken = () => {
  return localStorage.getItem(STUDENT_TOKEN_KEY)
}

export const clearStudentToken = () => {
  localStorage.removeItem(STUDENT_TOKEN_KEY)
}

export async function studentRegister(student_id, email, password) {
  const response = await fetch(`${API_BASE}/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, email, password }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.detail || `Registration failed (${response.status})`)
  }

  return body
}

export async function studentLogin(student_id, password) {
  const response = await fetch(`${API_BASE}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, password }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.detail || `Login failed (${response.status})`)
  }

  saveStudentToken(body.access_token)
  return body
}


export async function getStudentProfile() {
  const token = getStudentToken()

  const response = await fetch(`${API_BASE}/auth/student/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      clearStudentToken()
    }

    const detail = body?.detail

    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
          : detail
            ? JSON.stringify(detail)
            : `Request failed (${response.status})`

    throw new Error(message)
  }

  return body
}



export async function getStudentGrades() {
  const token = getStudentToken()

  const response = await fetch(`${API_BASE}/student/grades`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load grades.')
  }

  return data
}

export async function getStudentSchedule() {
  const token = getStudentToken()

  if (!token) {
    throw new Error('Please log in to your student account first.')
  }

  const response = await fetch(`${API_BASE}/student/schedule`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStudentToken()
    }

    throw new Error(
      data.detail || `Failed to load class schedule (${response.status}).`
    )
  }

  return data
}



/* ==============================
   ADMIN GRADES MANAGEMENT
============================== */

export const getAdminGrades = () =>
  request('/admin/grades')

export const createAdminGrade = (grade) =>
  request('/admin/grades', {
    method: 'POST',
    body: JSON.stringify(grade),
  })

export const deleteAdminGrade = (gradeId) =>
  request(`/admin/grades/${gradeId}`, {
    method: 'DELETE',
  })


/* ==============================
   ADMIN CLASS SCHEDULE
============================== */

export const getAdminSchedules = () =>
  request('/admin/schedules')

export const createAdminSchedule = (schedule) =>
  request('/admin/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  })

export const deleteAdminSchedule = (scheduleId) =>
  request(`/admin/schedules/${scheduleId}`, {
    method: 'DELETE',
  })


/* ==============================
   STUDENT AI CHAT
============================== */

export async function sendStudentChatMessage(message) {
  const token = getStudentToken()

  if (!token) {
    throw new Error('Please log in to use the AI assistant.')
  }

  const response = await fetch(`${API_BASE}/student/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      clearStudentToken()
    }

    throw new Error(
      body.detail || `AI chat request failed (${response.status})`
    )
  }

  return body
}
