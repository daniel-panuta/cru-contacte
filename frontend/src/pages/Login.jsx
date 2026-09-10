import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

export default function Login({ isAuthenticated, loading, error, onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await onLogin(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch {
      // Error is already managed in hook state.
    }
  }

  return (
    <section className="crm-auth-shell">
      <div className="crm-auth-grid">
        <aside className="crm-auth-visual">
          <div>
            <span className="crm-badge border-white/20 bg-white/10 text-white">CRM Contacte</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Autentificare</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
              Conecteaza-te ca sa accesezi dashboard-ul si rutele private ale aplicatiei.
            </p>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">EPIC 2 · CRM-202</p>
        </aside>

        <div className="crm-auth-card">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <div>
              <p className="crm-label">Sign in</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Login in cont</h2>
            </div>

            <label className="block space-y-2">
              <span className="crm-label">Email</span>
              <input
                type="email"
                className="crm-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@crmcontacte.local"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="crm-label">Parola</span>
              <input
                type="password"
                className="crm-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <p className="crm-alert-error">{error}</p> : null}

            <button type="submit" className="crm-button-primary w-full" disabled={loading}>
              {loading ? 'Se autentifica...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
