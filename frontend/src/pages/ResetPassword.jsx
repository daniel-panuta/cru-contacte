import { useState } from 'react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="crm-auth-shell">
      <div className="crm-auth-grid">
        <aside className="crm-auth-visual">
          <div>
            <span className="crm-badge border-white/20 bg-white/10 text-white">CRM Contacte</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Reset parola</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
              Cererea de resetare este pregatita pentru fluxul de recuperare a contului.
            </p>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">EPIC 4 · CRM-402</p>
        </aside>

        <div className="crm-auth-card">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <div>
              <p className="crm-label">Reset password</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Solicita un link nou</h2>
            </div>

            <label className="block space-y-2">
              <span className="crm-label">Email</span>
              <input
                type="email"
                className="crm-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nume@domeniu.ro"
                required
              />
            </label>

            {submitted ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Cererea a fost trimisa pentru {email.trim() || 'adresa introdusa'}.
              </p>
            ) : null}

            <button type="submit" className="crm-button-primary w-full">
              Trimite cererea
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}