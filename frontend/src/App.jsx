import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import useAuth from './hooks/useAuth'
import AddContact from './pages/AddContact'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import EditContact from './pages/EditContact'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'

function ProtectedRoute({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function AdminRoute({ user }) {
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function AppLayout({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar hidden lg:flex">
        <div>
          <span className="crm-badge">CRM Contacte</span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Bine ai venit, {user?.name || user?.email}</p>
        </div>

        <nav className="mt-8 space-y-2">
          <NavLink to="/dashboard" className={({ isActive }) => `crm-nav-link ${isActive ? 'crm-nav-link-active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `crm-nav-link ${isActive ? 'crm-nav-link-active' : ''}`}>
            Add Contact
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `crm-nav-link ${isActive ? 'crm-nav-link-active' : ''}`}>
            Profile
          </NavLink>
          {user?.role === 'admin' ? (
            <NavLink to="/admin" className={({ isActive }) => `crm-nav-link ${isActive ? 'crm-nav-link-active' : ''}`}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <button type="button" onClick={handleLogout} className="crm-button-secondary mt-auto w-full">
          Logout
        </button>
      </aside>

      <main className="crm-main">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  const { user, loading, error, isAuthenticated, login, logout } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login isAuthenticated={isAuthenticated} loading={loading} error={error} onLogin={login} />}
        />
        <Route path="/reset" element={<ResetPassword />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<AppLayout user={user} onLogout={logout} />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/add" element={<AddContact />} />
            <Route path="/contact/edit/:contactId" element={<EditContact />} />
            <Route path="/profile" element={<Profile />} />
            <Route element={<AdminRoute user={user} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
