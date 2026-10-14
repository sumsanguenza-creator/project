import { useCallback, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { createStudent, deleteStudent, getStudents } from './api'

function Layout({ children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>Campus<span className="brand-light">Desk</span></span></div>
      <div className="nav-label">WORKSPACE</div>
      <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span>▦</span> Dashboard</NavLink>
      <NavLink to="/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span>♙</span> Students</NavLink>
      <NavLink to="/students/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span>＋</span> Add student</NavLink>
      <div className="sidebar-bottom"><div className="avatar">AD</div><div><strong>Administrator</strong><small>Student services</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="eyebrow">STUDENT SERVICES</span><h1>Student Registration</h1></div><span className="status-pill"><i /> System online</span></header>
      <div className="content">{children}</div>
      <footer>CampusDesk <span>·</span> Student records workspace</footer>
    </main>
  </div>
}

function StudentsTable({ students, onDelete, deletingId }) {
  if (!students.length) return <div className="empty"><div className="empty-icon">♙</div><h3>No students found</h3><p>Try another search or register your first student.</p></div>
  return <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>COURSE</th><th>YEAR</th><th>EMAIL</th><th className="actions-col">ACTION</th></tr></thead>
    <tbody>{students.map((s, index) => <tr key={s.id}>
      <td><div className="student-cell"><span className={`student-avatar tone-${index % 5}`}>{s.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span><strong>{s.full_name}</strong></div></td>
      <td><span className="id-tag">{s.student_id}</span></td><td>{s.course}</td><td><span className="year-tag">Year {s.year_level}</span></td><td className="email-cell">{s.email}</td>
      <td><button className="delete-btn" disabled={deletingId === s.id} onClick={() => onDelete(s)} title="Delete student">⌫ <span>Delete</span></button></td>
    </tr>)}</tbody></table></div>
}

function StudentList({ students, loading, error, search, setSearch, refresh, onDelete, deletingId }) {
  return <>
    <div className="page-intro"><div><div className="eyebrow">DIRECTORY</div><h2>All students</h2><p>Manage and find student records in one place.</p></div><NavLink to="/students/new" className="primary-btn">＋ <span>Add student</span></NavLink></div>
    <section className="panel">
      <div className="panel-toolbar"><div><h3>Student directory</h3><p>{loading ? 'Loading records…' : `${students.length} ${students.length === 1 ? 'record' : 'records'} shown`}</p></div>
        <div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, or email…" aria-label="Search students"/>{search && <button onClick={() => setSearch('')} aria-label="Clear search">×</button>}</div>
      </div>
      {error && <div className="alert error">{error} <button onClick={refresh}>Retry</button></div>}
      {loading ? <div className="loading">Loading student records…</div> : <StudentsTable students={students} onDelete={onDelete} deletingId={deletingId}/>}
    </section>
    <p className="hint">Tip: Search works with partial names, student IDs, and email addresses.</p>
  </>
}

function Dashboard({ students, loading, error, search, setSearch, refresh, onDelete, deletingId }) {
  return <>
    <div className="welcome"><div><div className="eyebrow light">OVERVIEW</div><h2>Good day, Administrator <span>✦</span></h2><p>Here’s your student registration overview.</p></div><div className="welcome-art">✧</div></div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon blue">♙</div><div><span>Total students</span><strong>{loading ? '—' : students.length}</strong><small>Matching current search</small></div></div>
      <div className="stat-card"><div className="stat-icon green">✓</div><div><span>API status</span><strong className="api-status">{error ? 'Offline' : loading ? 'Checking' : 'Connected'}</strong><small>{error ? 'Could not load records' : 'Student service available'}</small></div></div>
      <div className="stat-card"><div className="stat-icon purple">⌕</div><div><span>Quick search</span><strong>Find a record</strong><small>Search by name, ID, or email</small></div></div>
    </div>
    <StudentList students={students} loading={loading} error={error} search={search} setSearch={setSearch} refresh={refresh} onDelete={onDelete} deletingId={deletingId}/>
  </>
}

function AddStudent({ onCreate }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ student_id: '', full_name: '', email: '', phone: '', course: '', year_level: '1' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = e => setForm({ ...form, [e.target.name]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.student_id.trim() || !form.full_name.trim() || !form.email.trim() || !form.course.trim()) {
      setError('Please complete all required fields.')
      return
    }
    setSaving(true)
    try {
      await onCreate({ ...form, student_id: form.student_id.trim(), full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, course: form.course.trim(), year_level: Number(form.year_level) })
      navigate('/students', { state: { notice: 'Student registered successfully.' } })
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <>
    <div className="page-intro"><div><div className="eyebrow">REGISTRATION</div><h2>Add a student</h2><p>Enter the student's information to create a new record.</p></div><NavLink to="/students" className="secondary-btn">← Back to students</NavLink></div>
    <section className="form-panel">
      <div className="form-heading"><div className="form-icon">＋</div><div><h3>Student information</h3><p>Fields marked with <b>*</b> are required.</p></div></div>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Student ID <b>*</b><input name="student_id" value={form.student_id} onChange={update} placeholder="e.g. 2026-001" maxLength="30" required /></label>
          <label>Full name <b>*</b><input name="full_name" value={form.full_name} onChange={update} placeholder="Enter full name" minLength="2" maxLength="120" required /></label>
          <label>Email address <b>*</b><input type="email" name="email" value={form.email} onChange={update} placeholder="student@example.com" required /></label>
          <label>Phone number <span className="optional">(optional)</span><input name="phone" value={form.phone} onChange={update} placeholder="e.g. 09XX XXX XXXX" maxLength="30" /></label>
          <label>Course / program <b>*</b><input name="course" value={form.course} onChange={update} placeholder="e.g. BS Information Technology" maxLength="120" required /></label>
          <label>Year level <b>*</b><select name="year_level" value={form.year_level} onChange={update}>{[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}</select></label>
        </div>
        <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => navigate('/students')}>Cancel</button><button disabled={saving} type="submit" className="primary-btn">{saving ? 'Saving…' : '✓ Register student'}</button></div>
      </form>
    </section>
  </>
}

export default function App() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async (query = search) => {
    setLoading(true); setError('')
    try { setStudents(await getStudents(query)) }
    catch (err) { setError(`${err.message}. Check that FastAPI and PostgreSQL are running.`); setStudents([]) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { refresh(search) }, [search]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  async function onCreate(student) {
    await createStudent(student)
    setSearch('')
    await refresh('')
  }
  async function onDelete(student) {
    if (!window.confirm(`Delete ${student.full_name} (${student.student_id})? This cannot be undone.`)) return
    setDeletingId(student.id); setNotice('')
    try {
      await deleteStudent(student.id)
      await refresh(search)
      setNotice('Student deleted successfully.')
    } catch (err) { setError(err.message) } finally { setDeletingId(null) }
  }

  return <Layout>
    {notice && <div className="alert success">{notice}</div>}
    <Routes>
      <Route path="/" element={<Dashboard students={students} loading={loading} error={error} search={search} setSearch={setSearch} refresh={refresh} onDelete={onDelete} deletingId={deletingId}/>}/>
      <Route path="/students" element={<StudentList students={students} loading={loading} error={error} search={search} setSearch={setSearch} refresh={refresh} onDelete={onDelete} deletingId={deletingId}/>}/>
      <Route path="/students/new" element={<AddStudent onCreate={onCreate}/>}/>
      <Route path="*" element={<div className="empty"><h2>Page not found</h2><NavLink to="/">Return to dashboard</NavLink></div>}/>
    </Routes>
  </Layout>
}
