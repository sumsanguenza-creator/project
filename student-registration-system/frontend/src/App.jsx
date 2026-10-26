import { useCallback, useEffect, useState } from 'react'
import {
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'




import {
  adminLogin,
  clearAdminToken,
  createStudent,
  deleteStudent,
  getAdminToken,
  getStudents,
  updateStudent,
  studentLogin,
  studentRegister,
  getStudentToken,
  clearStudentToken,
  getStudentProfile,
  getStudentGrades,
  getStudentSchedule,
  getAdminGrades,
  createAdminGrade,
  deleteAdminGrade,
  getAdminSchedules,
  createAdminSchedule,
  deleteAdminSchedule,
  sendStudentChatMessage,
} from './api'
import ReactMarkdown from 'react-markdown'



function Layout({ children, onLogout, apiError }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            Campus<span className="brand-light">Desk</span>
          </span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          <span>▦</span> Dashboard
        </NavLink>

        <NavLink
          to="/students"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          <span>♙</span> Students
        </NavLink>

          
<NavLink
  to="/admin/grades"
  className={({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`
  }
>
  <span>▤</span> Grades Management
</NavLink>

<NavLink
  to="/admin/schedules"
  className={({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`
  }
>
  <span>▦</span> Class Schedule
</NavLink>


        <div className="sidebar-bottom">
          <div className="avatar">AD</div>
          <div>
            <strong>Administrator</strong>
            <small>Student services</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">STUDENT SERVICES</span>
            <h1>Student Registration</h1>
          </div>

          <div className="topbar-actions">
            <span
              className="status-pill"
              style={
                apiError
                  ? {
                      color: '#b8455a',
                      background: '#fff4f6',
                      borderColor: '#f4d5db',
                    }
                  : {}
              }
            >
              <i
                style={
                  apiError
                    ? { background: '#d95d70' }
                    : {}
                }
              />
              {apiError ? 'API unavailable' : 'System online'}
            </span>

            <button
              type="button"
              className="secondary-btn"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <div className="content">{children}</div>

        <footer>
          CampusDesk <span>·</span> Student records workspace
        </footer>
      </main>
    </div>
  )
}

function StudentsTable({ students, onDelete, onEdit, deletingId }) {
  if (!students.length) {
    return (
      <div className="empty">
        <div className="empty-icon">♙</div>
        <h3>No students found</h3>
        <p>Try another search or register your first student.</p>
        <NavLink
          to="/students/new"
          className="primary-btn"
          style={{ marginTop: 18 }}
        >
          ＋ Register student
        </NavLink>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>STUDENT</th>
            <th>STUDENT ID</th>
            <th>COURSE</th>
            <th>YEAR</th>
            <th>EMAIL</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student, index) => {
            const initials = (student.full_name || 'Student')
              .trim()
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <tr key={student.id}>
                <td>
                  <div className="student-cell">
                    <span
                      className={`student-avatar tone-${index % 5}`}
                    >
                      {initials}
                    </span>
                    <strong>{student.full_name}</strong>
                  </div>
                </td>

                <td>
                  <span className="id-tag">
                    {student.student_id}
                  </span>
                </td>

                <td>{student.course}</td>

                <td>
                  <span className="year-tag">
                    {({
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year',
})[Number(student.year_level)] || 'Year level not set'}
                  </span>
                </td>

                <td className="email-cell">{student.email}</td>

                <td>
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onEdit(student)}
                      title="Edit student"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      disabled={deletingId === student.id}
                      onClick={() => onDelete(student)}
                      title="Delete student"
                    >
                      ⌫ <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StudentList({
  students,
  loading,
  error,
  search,
  setSearch,
  refresh,
  onDelete,
  onEdit,
  deletingId,
}) {
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">DIRECTORY</div>
          <h2>All students</h2>
          <p>Manage and find student records in one place.</p>
        </div>

        <NavLink to="/students/new" className="primary-btn">
          ＋ <span>Add student</span>
        </NavLink>
      </div>

      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h3>Student directory</h3>
            <p>
              {loading
                ? 'Loading records…'
                : `${students.length} ${
                    students.length === 1 ? 'record' : 'records'
                  } shown`}
            </p>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, or email…"
              aria-label="Search students"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
            <button type="button" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading student records…</div>
        ) : (
          <StudentsTable
            students={students}
            onDelete={onDelete}
            onEdit={onEdit}
            deletingId={deletingId}
          />
        )}
      </section>

      <p className="hint">
        Tip: Search supports partial names, student IDs, and email addresses.
      </p>
    </>
  )
}

function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true)
    setAnalyticsError('')
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseUrl}/analytics`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Unable to load analytics')
      setAnalytics(body)
    } catch (err) {
      setAnalyticsError(err.message || 'Unable to load analytics')
      setAnalytics(null)
    } finally {
      setLoadingAnalytics(false)
    }
  }, [])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const courseData = analytics?.students_by_course || []
  const yearData = analytics?.students_by_year || []
  const monthlyData = analytics?.monthly_registrations || []
  const maxCourse = Math.max(1, ...courseData.map((item) => item.count))
  const maxMonth = Math.max(1, ...monthlyData.map((item) => item.count))
  const maxYear = Math.max(1, ...yearData.map((item) => item.count))

  return (
    <div className="analytics-dashboard">
      <section className="dashboard-heading">
        <div>
          <div className="eyebrow">CAMPUSDESK ANALYTICS</div>
          <h2>Dashboard overview</h2>
          <p>Real-time summary of student records in your database.</p>
        </div>
        <button className="secondary-btn" type="button" onClick={loadAnalytics} disabled={loadingAnalytics}>
          ↻ {loadingAnalytics ? 'Refreshing…' : 'Refresh data'}
        </button>
      </section>

      {analyticsError && <div className="alert error" role="alert">{analyticsError} <button type="button" onClick={loadAnalytics}>Try again</button></div>}

      <section className="analytics-stats">
        <article className="analytics-stat-card">
          <div className="analytics-stat-icon students-icon">♙</div>
          <div><span>Total students</span><strong>{loadingAnalytics ? '—' : analytics?.total_students ?? 0}</strong><small>All registered records</small></div>
        </article>
        <article className="analytics-stat-card">
          <div className="analytics-stat-icon course-icon">▤</div>
          <div><span>Courses / programs</span><strong>{loadingAnalytics ? '—' : courseData.length}</strong><small>Distinct courses in records</small></div>
        </article>
        <article className="analytics-stat-card">
          <div className="analytics-stat-icon year-icon">▦</div>
          <div><span>Year levels</span><strong>{loadingAnalytics ? '—' : yearData.filter((item) => item.count > 0).length}</strong><small>Year levels represented</small></div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel course-panel">
          <div className="analytics-panel-heading"><div><h3>Students by course</h3><p>Number of student records per course</p></div><span className="chart-mark">▥</span></div>
          {loadingAnalytics ? <div className="analytics-empty">Loading course data…</div> : courseData.length === 0 ? <div className="analytics-empty">No student records to analyze yet.</div> : <div className="course-chart">{courseData.map((item) => <div className="course-bar-row" key={item.course}><div className="course-bar-label"><span title={item.course}>{item.course}</span><strong>{item.count}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.count / maxCourse) * 100}%` }} /></div></div>)}</div>}
        </article>

        <article className="analytics-panel year-panel">
          <div className="analytics-panel-heading"><div><h3>Year-level distribution</h3><p>Students grouped by year level</p></div><span className="chart-mark green-mark">◉</span></div>
          {loadingAnalytics ? <div className="analytics-empty">Loading year levels…</div> : yearData.length === 0 ? <div className="analytics-empty">No student records to analyze yet.</div> : <div className="year-chart">{yearData.map((item) => <div className="year-row" key={item.year_level}><div className="year-row-top"><span>Year {item.year_level}</span><strong>{item.count}</strong></div><div className="bar-track"><div className="bar-fill year-fill" style={{ width: `${(item.count / maxYear) * 100}%` }} /></div></div>)}</div>}
        </article>

        <article className="analytics-panel trend-panel">
          <div className="analytics-panel-heading"><div><h3>Registration trends</h3><p>New registrations over the last 6 months</p></div><span className="chart-mark purple-mark">↗</span></div>
          {loadingAnalytics ? <div className="analytics-empty">Loading registration history…</div> : monthlyData.length === 0 ? <div className="analytics-empty">Registration history will appear when date data is available.</div> : <div className="trend-chart">{monthlyData.map((item) => <div className="trend-column" key={item.month}><strong>{item.count}</strong><div className="trend-bar-wrap"><div className="trend-bar" style={{ height: `${Math.max(4, (item.count / maxMonth) * 100)}%` }} /></div><span>{item.label}</span></div>)}</div>}
          <p className="chart-footnote">Based on registration dates saved in the database.</p>
        </article>
      </section>

      <section className="dashboard-footer-card">
        <div className="dashboard-footer-icon">✓</div>
        <div><h3>Student records are connected</h3><p>Analytics are calculated from the database, not manually entered sample numbers.</p></div>
        <NavLink to="/students" className="secondary-btn">Open Students →</NavLink>
      </section>
    </div>
  )
}

function AddStudent({ onCreate }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    student_id: '',
    full_name: '',
    email: '',
    phone: '',
    course: '',
    year_level: '1',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (
      !form.student_id.trim() ||
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.course.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    setSaving(true)

    try {
      await onCreate({
        ...form,
        student_id: form.student_id.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        course: form.course.trim(),
        year_level: Number(form.year_level),
      })

      navigate('/students', {
        state: { notice: 'Student registered successfully.' },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">REGISTRATION</div>
          <h2>Add a student</h2>
          <p>Enter the student's information to create a new record.</p>
        </div>

        <NavLink to="/students" className="secondary-btn">
          ← Back to students
        </NavLink>
      </div>

      <section className="form-panel">
        <div className="form-heading">
          <div className="form-icon">＋</div>
          <div>
            <h3>Student information</h3>
            <p>Fields marked with * are required.</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Student ID <b>*</b>
              <input
                name="student_id"
                value={form.student_id}
                onChange={update}
                placeholder="e.g. BSIT-2026-001"
                maxLength={30}
                required
              />
            </label>

            <label>
              Full name <b>*</b>
              <input
                name="full_name"
                value={form.full_name}
                onChange={update}
                placeholder="Enter full name"
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label>
              Email address <b>*</b>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="student@example.com"
                required
              />
            </label>

            <label>
              Phone number <span className="optional">(optional)</span>
              <input
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="e.g. 09XX XXX XXXX"
                maxLength={30}
              />
            </label>

            

<label>
  Course / Program <b>*</b>
  <select
    name="course"
    value={form.course}
    onChange={update}
    required
  >
    <option value="">Select Course / Program</option>
    <option value="BSIT">BSIT - Information Technology</option>
    <option value="BSN">BSN - Nursing</option>
    <option value="Political Science">Political Science</option>
    <option value="BSA">BSA - Accountancy</option>
    <option value="BSBA">BSBA - Business Administration</option>
  </select>
</label>



<label>
  Year Level <b>*</b>
  <select
    name="year_level"
    value={form.year_level}
    onChange={update}
    required
  >
    <option value="1">1st Year</option>
    <option value="2">2nd Year</option>
    <option value="3">3rd Year</option>
    <option value="4">4th Year</option>
  </select>
</label>


          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/students')}
            >
              Cancel
            </button>

            <button
              disabled={saving}
              type="submit"
              className="primary-btn"
            >
              {saving ? 'Saving…' : '✓ Register student'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function EditStudent({ students, onUpdate }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const student = students.find((item) => item.id === Number(id))

  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (student) {
      setForm({
        student_id: student.student_id,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone || '',
        course: student.course,
        year_level: String(student.year_level),
      })
    }
  }, [student])

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onUpdate(Number(id), {
        ...form,
        student_id: form.student_id.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        course: form.course.trim(),
        year_level: Number(form.year_level),
      })

      navigate('/students')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!student) {
    return (
      <div className="empty">
        <div className="empty-icon">?</div>
        <h2>Student not found</h2>
        <p>The record may not be loaded or may no longer exist.</p>
        <button
          type="button"
          className="secondary-btn"
          style={{ marginTop: 18 }}
          onClick={() => navigate('/students')}
        >
          Back to students
        </button>
      </div>
    )
  }

  if (!form) {
    return <div className="loading">Loading student information…</div>
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">STUDENT RECORD</div>
          <h2>Edit student</h2>
          <p>Update the student's information.</p>
        </div>

        <NavLink to="/students" className="secondary-btn">
          ← Back to students
        </NavLink>
      </div>

      <section className="form-panel">
        <div className="form-heading">
          <div className="form-icon">✎</div>
          <div>
            <h3>Edit student information</h3>
            <p>Update the fields you want to change.</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Student ID <b>*</b>
              <input
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </label>

            <label>
              Full name <b>*</b>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={120}
              />
            </label>

            <label>
              Email address <b>*</b>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Phone number <span className="optional">(optional)</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={30}
              />
            </label>

            
<label>
  Course / program <b>*</b>
  <select
    name="course"
    value={form.course}
    onChange={handleChange}
    required
  >
    <option value="">Select Course / Program</option>
    <option value="BSIT">BSIT - Information Technology</option>
    <option value="BSN">BSN - Nursing</option>
    <option value="Political Science">Political Science</option>
    <option value="BSA">BSA - Accountancy</option>
    <option value="BSBA">BSBA - Business Administration</option>
  </select>
</label>


           
<label>
  Year level <b>*</b>
  <select
    name="year_level"
    value={form.year_level}
    onChange={handleChange}
    required
  >
    <option value="1">1st Year</option>
    <option value="2">2nd Year</option>
    <option value="3">3rd Year</option>
    <option value="4">4th Year</option>
  </select>
</label>

          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/students')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              {saving ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="form-panel login-panel" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo">S</div>
          <h1>
            Campus<span>Desk</span>
          </h1>
          <p>Student Registration Management System</p>
        </div>

        <div className="form-heading">
          <div className="form-icon">♙</div>
          <div>
            <h2>Welcome back!</h2>
            <p>Sign in to access your admin dashboard.</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <label
          className={`floating-field ${username ? 'filled' : ''}`}
        >
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Enter your username"
            maxLength={120}
            required
          />
        </label>

        <label
          className={`floating-field ${password ? 'filled' : ''}`}
        >
          <span>Password</span>

          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button
          className="primary-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in to Dashboard →'}
        </button>

        <div className="login-footer">
          <span>●</span> Secure administrator access
          <br />
          CampusDesk · Student Services
        </div>
      </form>
    </div>
  )
}



function StudentLogin({ onLogin, onGoRegister, onGoAdmin }) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onLogin(studentId, password)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="form-panel login-panel" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo">S</div>
          <h1>Campus<span>Desk</span></h1>
          <p>Student Portal</p>
        </div>

        <div className="form-heading">
          <div className="form-icon">♙</div>
          <div>
            <h2>Student sign in</h2>
            <p>Enter your Student ID and password.</p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <label className={`floating-field ${studentId ? 'filled' : ''}`}>
          <span>Student ID</span>
          <input
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="Student ID"
            autoComplete="username"
            required
          />
        </label>

        <label className={`floating-field ${password ? 'filled' : ''}`}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-footer">
          <p>
            No student account yet?{' '}
            <button
              type="button"
              className="text-btn"
              onClick={onGoRegister}
            >
              Create account
            </button>
          </p>

          <p>
            <button
              type="button"
              className="text-btn"
              onClick={onGoAdmin}
            >
              Administrator sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}



function StudentRegister({ onRegister, onGoLogin }) {
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await onRegister(studentId, email, password)
      setMessage('Account created successfully. You can now sign in.')
      setStudentId('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="form-panel login-panel register-panel" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo">S</div>
          <h1>Campus<span>Desk</span></h1>
          <p>Student Portal</p>
        </div>

        <div className="form-heading">
          <div className="form-icon">＋</div>
          <div>
            <h2>Create account</h2>
            <p>Register using the details recorded by your school.</p>
          </div>
        </div>

        {error && <div className="alert error" role="alert">{error}</div>}
        {message && <div className="alert success" role="status">{message}</div>}

        <label className={`floating-field ${studentId ? 'filled' : ''}`}>
          <span>Student ID</span>
          <input
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="Enter your Student ID"
            autoComplete="username"
            required
          />
        </label>

        <label className={`floating-field ${email ? 'filled' : ''}`}>
          <span>School email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your registered email"
            autoComplete="email"
            required
          />
        </label>

        <label className={`floating-field ${password ? 'filled' : ''}`}>
          <span>Password (8+ characters)</span>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className={`floating-field ${confirmPassword ? 'filled' : ''}`}>
          <span>Confirm password</span>
          <div className="password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account →'}
        </button>

        <div className="login-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="text-btn" onClick={onGoLogin}>
              Sign in
            </button>
          </p>
          <p>CampusDesk · Student Services</p>
        </div>
      </form>
    </div>
  )
}






function StudentDashboard({ onLogout }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState('dashboard')

  const [grades, setGrades] = useState([])
  const [schedule, setSchedule] = useState([])
  const [gradesLoading, setGradesLoading] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [gradesError, setGradesError] = useState('')
  const [scheduleError, setScheduleError] = useState('')


  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I’m CampusDesk AI. Ask me about studying, school topics, or using your Student Portal.',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')


  const yearLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year',
  }

  // Load the logged-in student's profile.
  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const data = await getStudentProfile()
        if (active) setStudent(data)
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your student profile.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  // Load grades and schedule from the API.
  useEffect(() => {
    let active = true

    async function loadGrades() {
      setGradesLoading(true)
      setGradesError('')

      try {
        const data = await getStudentGrades()
        if (active) {
          setGrades(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
          setGradesError(err.message || 'Unable to load your grades.')
        }
      } finally {
        if (active) setGradesLoading(false)
      }
    }

    async function loadSchedule() {
      setScheduleLoading(true)
      setScheduleError('')

      try {
        const data = await getStudentSchedule()
        if (active) {
          setSchedule(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
          setScheduleError(
            err.message || 'Unable to load your class schedule.'
          )
        }
      } finally {
        if (active) setScheduleLoading(false)
      }
    }

    loadGrades()
    loadSchedule()

    return () => {
      active = false
    }
  }, [])

  const initials = (student?.full_name || 'Student')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  function formatGrade(value) {
    if (value === null || value === undefined || value === '') {
      return '—'
    }

    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(2) : value
  }

  function formatTime(value) {
    if (!value) return 'Time not set'

    const match = String(value).match(/^(\d{2}):(\d{2})/)
    if (!match) return value

    let hours = Number(match[1])
    const minutes = match[2]
    const period = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12 || 12

    return `${hours}:${minutes} ${period}`
  }

  
  async function handleSendChat(event) {
    event.preventDefault()

    const message = chatInput.trim()

    if (!message || chatLoading) return

    setChatError('')
    setChatMessages((previous) => [
      ...previous,
      { role: 'user', content: message },
    ])
    setChatInput('')
    setChatLoading(true)

    try {
      const result = await sendStudentChatMessage(message)

      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: result.reply || 'I received an empty response.',
        },
      ])
    } catch (err) {
      setChatError(
        err.message || 'Unable to contact the AI assistant. Please try again.'
      )
    } finally {
      setChatLoading(false)
    }
  }


  return (
    <div className="student-portal">
      <aside className="student-sidebar">
        <div className="student-brand">
          <div className="student-brand-mark">S</div>
          <div>
            <strong>
              Campus<span>Desk</span>
            </strong>
            <small>STUDENT PORTAL</small>
          </div>
        </div>

        <div className="student-nav-label">MY WORKSPACE</div>

        <button
          type="button"
          className={`student-nav-link ${
            activePage === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setActivePage('dashboard')}
        >
          <span>▦</span> Dashboard
        </button>

        <button
          type="button"
          className={`student-nav-link ${
            activePage === 'grades' ? 'active' : ''
          }`}
          onClick={() => setActivePage('grades')}
        >
          <span>▤</span> My Grades
        </button>

        <button
          type="button"
          className={`student-nav-link ${
            activePage === 'schedule' ? 'active' : ''
          }`}
          onClick={() => setActivePage('schedule')}
        >
          <span>▦</span> Class Schedule
        </button>

          <button
  type="button"
  className={`student-nav-link ${
    activePage === 'chat' ? 'active' : ''
  }`}
  onClick={() => setActivePage('chat')}
>
  <span>✦</span> CampusDesk AI
</button>

        <div className="student-sidebar-bottom">
          <div className="student-sidebar-avatar">{initials}</div>

          <div className="student-sidebar-user">
            <strong>
              {loading ? 'Loading...' : student?.full_name || 'Student'}
            </strong>
            <small>{student?.student_id || 'Student account'}</small>
          </div>

          <button
            type="button"
            className="student-logout-icon"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
          >
            ↗
          </button>
        </div>
      </aside>

      <main className="student-main">
        <header className="student-topbar">
          <div>
            <span className="student-eyebrow">STUDENT SERVICES</span>
            <h1>
              {{
  dashboard: 'My Dashboard',
  grades: 'My Grades',
  schedule: 'Class Schedule',
  chat: 'AI Assistant',
}[activePage]}
            </h1>
          </div>

          <button
            type="button"
            className="student-logout-btn"
            onClick={onLogout}
          >
            ↗ <span>Log out</span>
          </button>
        </header>

        <div className="student-content">
          {loading && (
            <div className="student-message">
              Loading your student information...
            </div>
          )}

          {error && (
            <div className="alert error" role="alert">
              {error}
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && student && (
            <>
              {activePage === 'dashboard' && (
                <>
                  <section className="student-welcome">
                    <div className="student-welcome-text">
                      <span>YOUR STUDENT SPACE</span>
                      <h2>
                        Welcome back, {student.full_name.split(' ')[0]}!
                      </h2>
                      <p>
                        Welcome to your CampusDesk portal. View your registered
                        information and academic records.
                      </p>
                    </div>

                    <div
                      className="student-welcome-art"
                      aria-hidden="true"
                    >
                      <div className="welcome-circle">✦</div>
                      <div className="welcome-book">▤</div>
                    </div>
                  </section>

                  <section className="student-summary-grid">
                    <article className="student-summary-card">
                      <div className="student-summary-icon blue">♙</div>
                      <div>
                        <span>Student ID</span>
                        <strong>{student.student_id}</strong>
                        <small>Your registered identification</small>
                      </div>
                    </article>

                    <article className="student-summary-card">
                      <div className="student-summary-icon green">▤</div>
                      <div>
                        <span>Course / Program</span>
                        <strong>{student.course}</strong>
                        <small>Your registered program</small>
                      </div>
                    </article>

                    <article className="student-summary-card">
                      <div className="student-summary-icon purple">▦</div>
                      <div>
                        <span>Year Level</span>
                        <strong>
                          {yearLabels[Number(student.year_level)] || 'Not set'}
                        </strong>
                        <small>Your registered year level</small>
                      </div>
                    </article>
                  </section>

                  <section className="student-profile-panel">
                    <div className="student-panel-heading">
                      <div>
                        <span className="student-eyebrow">
                          ACCOUNT INFORMATION
                        </span>
                        <h2>My Student Profile</h2>
                        <p>
                          Your registered information from the student
                          database.
                        </p>
                      </div>
                      <div className="student-profile-badge">♙</div>
                    </div>

                    <div className="student-profile-hero">
                      <div className="student-profile-avatar">{initials}</div>
                      <div>
                        <h3>{student.full_name}</h3>
                        <p>{student.student_id}</p>
                        <span className="student-account-status">
                          <i /> Student account
                        </span>
                      </div>
                    </div>

                    <div className="student-detail-grid">
                      <div className="student-detail-item">
                        <span>FULL NAME</span>
                        <strong>{student.full_name}</strong>
                      </div>

                      <div className="student-detail-item">
                        <span>STUDENT ID</span>
                        <strong>{student.student_id}</strong>
                      </div>

                      <div className="student-detail-item">
                        <span>EMAIL ADDRESS</span>
                        <strong>{student.email}</strong>
                      </div>

                      <div className="student-detail-item">
                        <span>PHONE NUMBER</span>
                        <strong>{student.phone || 'Not provided'}</strong>
                      </div>

                      <div className="student-detail-item">
                        <span>COURSE / PROGRAM</span>
                        <strong>{student.course}</strong>
                      </div>

                      <div className="student-detail-item">
                        <span>YEAR LEVEL</span>
                        <strong>
                          {yearLabels[Number(student.year_level)] || 'Not set'}
                        </strong>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activePage === 'grades' && (
                <section className="student-profile-panel">
                  <div className="student-panel-heading">
                    <div>
                      <span className="student-eyebrow">
                        ACADEMIC RECORDS
                      </span>
                      <h2>My Grades</h2>
                      <p>Your recorded academic grades by subject.</p>
                    </div>
                    <div className="student-profile-badge">▤</div>
                  </div>

                  {gradesError && (
                    <div className="alert error" role="alert">
                      {gradesError}
                    </div>
                  )}

                  <div className="student-table-scroll">
                    <table className="student-academic-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Units</th>
                          <th>Prelim</th>
                          <th>Midterm</th>
                          <th>Final</th>
                        </tr>
                      </thead>

                      <tbody>
                        {gradesLoading ? (
                          <tr>
                            <td colSpan={5}>Loading grades...</td>
                          </tr>
                        ) : gradesError ? (
                          <tr>
                            <td colSpan={5}>Unable to display grades.</td>
                          </tr>
                        ) : grades.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              No grades available yet.
                            </td>
                          </tr>
                        ) : (
                          grades.map((item, index) => (
                            <tr key={item.id ?? index}>
                              <td>
                                <strong>
                                  {item.subject_code || item.code || '—'}
                                </strong>
                                <small>
                                  {item.subject_name || item.subject || ''}
                                </small>
                              </td>
                              <td>{item.units ?? '—'}</td>
                              <td>{formatGrade(item.prelim)}</td>
                              <td>{formatGrade(item.midterm)}</td>
                              <td>{formatGrade(item.final_grade)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}


{activePage === 'schedule' && (
  <section className="schedule-section">
    <div className="section-header">
      <h2>My Class Schedule</h2>
      <p>View your subjects, class times, rooms, and instructors.</p>
    </div>

    {scheduleLoading ? (
      <p>Loading class schedule...</p>
    ) : scheduleError ? (
      <p role="alert">{scheduleError}</p>
    ) : schedule.length === 0 ? (
      <p>No class schedule has been assigned to your account yet.</p>
    ) : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Subject Code</th>
              <th>Subject</th>
              <th>Time</th>
              <th>Room</th>
              <th>Instructor</th>
            </tr>
          </thead>

          <tbody>
            {schedule.map((item) => (
              <tr key={item.id}>
                <td>{item.day}</td>
                <td>{item.subject_code}</td>
                <td>{item.subject_name}</td>
                <td>
                  {item.start_time} - {item.end_time}
                </td>
                <td>{item.room}</td>
                <td>{item.instructor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
)}


              
              {activePage === 'chat' && (
                <section className="student-profile-panel ai-chat-panel">
                  <div className="student-panel-heading">
                    <div>
                      <span className="student-eyebrow">
                        CAMPUSDESK AI
                      </span>
                      <h2>Student AI Assistant</h2>
                      <p>
                        Ask questions and get help with studying or using
                        your student portal.
                      </p>
                    </div>
                    <div className="student-profile-badge">✦</div>
                  </div>

                  
<div
  className="ai-chat-messages"
  aria-live="polite"
  aria-label="Chat messages"
>
  {chatMessages.map((message, index) => (
    <div
      key={index}
      className={`ai-chat-message ${
        message.role === 'assistant'
          ? 'assistant-message'
          : 'user-message'
      }`}
    >
      {message.role === 'assistant' && (
        <strong>CampusDesk AI</strong>
      )}

      <div className="ai-chat-content">
        {message.role === 'assistant' ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  ))}

  {chatLoading && (
    <div className="ai-chat-message assistant-message">
      <strong>CampusDesk AI</strong>
      <p>Thinking...</p>
    </div>
  )}
</div>


                  <form
                    className="ai-chat-form"
                    onSubmit={handleSendChat}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask the AI assistant..."
                      aria-label="Your message"
                      maxLength={2000}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      {chatLoading ? 'Sending...' : 'Send'}
                    </button>
                  </form>

                  <p className="hint">
                    AI responses may occasionally be inaccurate. Verify
                    important school information with your instructor.
                  </p>
                </section>
              )}

            </>
          )}

          <footer className="student-footer">
            CampusDesk <span>·</span> Student Portal
          </footer>
        </div>
      </main>
    </div>
  )
}



function AdminSchedules() {
  const [schedules, setSchedules] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    student_pk: '',
    subject_code: '',
    subject_name: '',
    day: 'Monday',
    start_time: '',
    end_time: '',
    room: '',
    instructor: '',
  }

  const [form, setForm] = useState(emptyForm)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminSchedules()
      setSchedules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load schedules.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)

    try {
      const data = await getStudents()
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load students.')
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchedules()
    loadStudents()
  }, [loadSchedules, loadStudents])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.student_pk) {
      setError('Please select a student.')
      return
    }

    setSaving(true)

    try {
      await createAdminSchedule({
        ...form,
        student_pk: Number(form.student_pk),
      })

      setSuccess('Schedule added successfully!')
      setForm({ ...emptyForm })
      await loadSchedules()
    } catch (err) {
      setError(err.message || 'Unable to add schedule.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this class schedule?')) return

    setError('')
    setSuccess('')

    try {
      await deleteAdminSchedule(id)
      setSuccess('Schedule deleted successfully!')
      await loadSchedules()
    } catch (err) {
      setError(err.message || 'Unable to delete schedule.')
    }
  }

  function getStudentName(studentPk) {
    const student = students.find(
      (item) => Number(item.id) === Number(studentPk)
    )

    return student
      ? `${student.full_name} (${student.student_id})`
      : `Student ID: ${studentPk ?? 'Unknown'}`
  }

  return (
    <div className="page class-schedule-management">
      <div className="page-intro">
        <h1>Class Schedule</h1>
        <p>Add, view, and manage class schedules.</p>
      </div>

      {error && (
        <div className="alert error" role="alert">{error}</div>
      )}

      {success && (
        <div className="alert success" role="status">{success}</div>
      )}

      <section className="panel">
        <h2>Add Class Schedule</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Select Student
              <select
                name="student_pk"
                value={form.student_pk}
                onChange={handleChange}
                required
                disabled={studentsLoading || students.length === 0}
              >
                <option value="">
                  {studentsLoading
                    ? 'Loading students...'
                    : students.length === 0
                      ? 'No students available'
                      : '-- Select Student --'}
                </option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.student_id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject Code
              <input
                name="subject_code"
                value={form.subject_code}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Subject Name
              <input
                name="subject_name"
                value={form.subject_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Day
              <select
                name="day"
                value={form.day}
                onChange={handleChange}
                required
              >
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Start Time
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Room
              <input
                name="room"
                value={form.room}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Instructor
              <input
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              className="primary-btn"
              type="submit"
              disabled={saving || studentsLoading || students.length === 0}
            >
              {saving ? 'Saving...' : 'Add Schedule'}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={loadSchedules}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Saved Schedules</h2>

        {loading ? (
          <p>Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <p>No schedules found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Room</th>
                  <th>Instructor</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td>{getStudentName(item.student_pk)}</td>
                    <td>{item.day}</td>
                    <td>
                      {item.start_time} – {item.end_time}
                    </td>
                    <td>
                      <strong>{item.subject_code}</strong>
                      <br />
                      {item.subject_name}
                    </td>
                    <td>{item.room}</td>
                    <td>{item.instructor}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}



function AdminGrades() {
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

const [form, setForm] = useState({
  student_id: '',
  subject_code: '',
  subject_name: '',
  units: '3',
  prelim: '',
  midterm: '',
  final: '',
})

  const loadGrades = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [gradeData, studentData] = await Promise.all([
        getAdminGrades(),
        getStudents(''),
      ])

      setGrades(Array.isArray(gradeData) ? gradeData : [])
      setStudents(Array.isArray(studentData) ? studentData : [])
    } catch (err) {
      setError(err.message || 'Unable to load grades.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.student_id ||
      !form.subject_code.trim() ||
      !form.subject_name.trim() ||
      form.prelim === '' ||
      form.midterm === '' ||
      form.final === ''
    ) {
      setError('Please complete all fields.')
      return
    }

    const scores = [
      Number(form.prelim),
      Number(form.midterm),
      Number(form.final),
    ]

    if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 100)) {
      setError('Grades must be numbers between 0 and 100.')
      return
    }

    setSaving(true)

    try {
      await createAdminGrade({
  student_pk: Number(form.student_id),
  subject_code: form.subject_code,
  subject_name: form.subject_name,
  units: Number(form.units),
  prelim: Number(form.prelim),
  midterm: Number(form.midterm),
  final_grade: Number(form.final),
})

      setSuccess('Grade added successfully!')
      setForm({
  student_id: '',
  subject_code: '',
  subject_name: '',
  units: '3',
  prelim: '',
  midterm: '',
  final: '',
})

      await loadGrades()
    } catch (err) {
      setError(err.message || 'Unable to save grade.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this grade?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteAdminGrade(id)
      setSuccess('Grade deleted successfully!')
      await loadGrades()
    } catch (err) {
      setError(err.message || 'Unable to delete grade.')
    }
  }

    return (
  <div className="page grades-management">
      <div className="page-intro">
        <h1>Grades Management</h1>
        <p>Add, view, and manage student grades.</p>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {success && <div className="alert success" role="status">{success}</div>}

      <section className="panel">
        <h2>Add Student Grade</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Student
              <select
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_id} — {student.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject Code
              <input
                name="subject_code"
                value={form.subject_code}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Subject Name
              <input
                name="subject_name"
                value={form.subject_name}
                onChange={handleChange}
                required
              />
            </label>
              
            <label>
  Units
  <input
    type="number"
    name="units"
    min="1"
    max="10"
    step="1"
    value={form.units}
    onChange={handleChange}
    required
  />
</label>

            <label>
              Prelim (0–100)
              <input
                type="number"
                name="prelim"
                min="0"
                max="100"
                step="any"
                value={form.prelim}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Midterm (0–100)
              <input
                type="number"
                name="midterm"
                min="0"
                max="100"
                step="any"
                value={form.midterm}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Final (0–100)
              <input
                type="number"
                name="final"
                min="0"
                max="100"
                step="any"
                value={form.final}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Grade'}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={loadGrades}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Saved Grades</h2>

        {loading ? (
          <p>Loading grades...</p>
        ) : grades.length === 0 ? (
          <p>No grades found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Prelim</th>
                  <th>Midterm</th>
                  <th>Final</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>
                      {grade.student_name ||
                        grade.full_name ||
                        grade.student_id}
                    </td>
                    <td>
                      <strong>{grade.subject_code}</strong>
                      <br />
                      {grade.subject_name}
                    </td>
                    <td>{grade.prelim ?? '—'}</td>
                    <td>{grade.midterm ?? '—'}</td>
                    <td>{grade.final ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(grade.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(getAdminToken())
  )

  const [studentLoggedIn, setStudentLoggedIn] = useState(
    () => Boolean(getStudentToken())
  )

  const [studentPage, setStudentPage] = useState('login')

  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState('')

  const navigate = useNavigate()

  const refresh = useCallback(async (query = search) => {
    setLoading(true)
    setError('')

    try {
      const records = await getStudents(query)
      setStudents(Array.isArray(records) ? records : [])
    } catch (err) {
      setError(
        `${err.message}. Check that FastAPI and PostgreSQL are running.`
      )
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (isLoggedIn) {
      refresh(search)
    }
  }, [isLoggedIn, search, refresh])

  useEffect(() => {
    if (!notice) return

    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  async function onCreate(student) {
    await createStudent(student)
    setSearch('')
    await refresh('')
  }

  async function onUpdate(id, student) {
    await updateStudent(id, student)
    setSearch('')
    await refresh('')
  }

  async function onDelete(student) {
    const confirmed = window.confirm(
      `Delete ${student.full_name} (${student.student_id})? This cannot be undone.`
    )

    if (!confirmed) return

    setDeletingId(student.id)
    setNotice('')
    setError('')

    try {
      await deleteStudent(student.id)
      await refresh(search)
      setNotice('Student deleted successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleLogin(username, password) {
    await adminLogin(username, password)
    setIsLoggedIn(true)
    await refresh('')
  }

  
async function handleStudentLogin(studentId, password) {
  await studentLogin(studentId, password)
  setStudentLoggedIn(true)
}

async function handleStudentRegister(studentId, email, password) {
  await studentRegister(studentId, email, password)
}

function handleStudentLogout() {
  clearStudentToken()
  setStudentLoggedIn(false)
  setStudentPage('login')
  navigate('/')
}


  function handleLogout() {
    clearAdminToken()
    setIsLoggedIn(false)
    setStudents([])
    setSearch('')
    setError('')
    setNotice('')
    navigate('/')
  }

  

if (studentLoggedIn) {
  return <StudentDashboard onLogout={handleStudentLogout} />
}

if (!isLoggedIn) {
  if (studentPage === 'register') {
    return (
      <StudentRegister
        onRegister={handleStudentRegister}
        onGoLogin={() => setStudentPage('login')}
      />
    )
  }

  if (studentPage === 'admin') {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <StudentLogin
      onLogin={handleStudentLogin}
      onGoRegister={() => setStudentPage('register')}
      onGoAdmin={() => setStudentPage('admin')}
    />
  )
}




  const sharedProps = {
    students,
    loading,
    error,
    search,
    setSearch,
    refresh,
    onDelete,
    onEdit: (student) => navigate(`/students/${student.id}/edit`),
    deletingId,
  }

  return (
    <Layout onLogout={handleLogout} apiError={Boolean(error)}>
      {notice && (
        <div className="alert success" role="status">
          {notice}
        </div>
      )}

      <Routes>
  <Route
    path="/"
    element={<Dashboard />}
  />

  <Route
    path="/admin/grades"
    element={<AdminGrades />}
  />

  <Route
    path="/admin/schedules"
    element={<AdminSchedules />}
  />

  <Route
    path="/students"
    element={<StudentList {...sharedProps} />}
  />

  <Route
    path="/students/new"
    element={<AddStudent onCreate={onCreate} />}
  />

  <Route
    path="/students/:id/edit"
    element={
      <EditStudent
        students={students}
        onUpdate={onUpdate}
      />
    }
  />

  <Route
    path="*"
    element={
      <div className="empty">
        <h2>Page not found</h2>
        <NavLink to="/">Return to dashboard</NavLink>
      </div>
    }
  />
</Routes>
    </Layout>
  )
}