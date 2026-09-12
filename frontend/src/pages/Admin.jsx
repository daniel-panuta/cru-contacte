import { useEffect, useState } from 'react'
import api from '../lib/api'
import AdminAddUser from './AdminAddUser'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'user',
}

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitError, setSubmitError] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [manualPassword, setManualPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [generatedPassword, setGeneratedPassword] = useState(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadUsers() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get('/admin/users')
        if (!ignore) {
          setUsers(response.data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.detail || 'Nu am putut incarca utilizatorii.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      ignore = true
    }
  }, [])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitLoading(true)
    setSubmitError(null)

    try {
      const response = await api.post('/admin/users', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      })

      setUsers((currentUsers) => [...currentUsers, response.data])
      setFormData(EMPTY_FORM)
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Nu am putut crea utilizatorul.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRoleToggle = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'

    try {
      setActionLoading(`role-${user.id}`)
      const response = await api.post(`/admin/users/${user.id}/role`, { role: nextRole })
      setUsers((currentUsers) => currentUsers.map((entry) => (entry.id === user.id ? response.data : entry)))
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut actualiza rolul.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartEdit = (user) => {
    setEditingUser(user)
    setEditForm({ name: user.name, email: user.email })
    setManualPassword('')
  }

  const handleUpdateUser = async (event) => {
    event.preventDefault()
    if (!editingUser) {
      return
    }

    try {
      setActionLoading(`update-${editingUser.id}`)
      const response = await api.patch(`/admin/users/${editingUser.id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      })
      setUsers((currentUsers) => currentUsers.map((user) => (user.id === editingUser.id ? response.data : user)))
      setEditingUser(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut actualiza utilizatorul.')
    } finally {
      setActionLoading(null)
    }
  }

  const resetPasswordForUser = async (user, password) => {
    if (!user) {
      return
    }

    try {
      setActionLoading(`reset-${user.id}`)
      const response = await api.post(`/admin/users/${user.id}/password-reset`, password ? { password } : {})
      setUsers((currentUsers) => currentUsers.map((entry) => (entry.id === user.id ? response.data.user : entry)))
      setManualPassword('')
      setGeneratedPassword(response.data.generated_password)
      setPasswordCopied(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut reseta parola.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualPasswordReset = (event) => {
    event.preventDefault()
    resetPasswordForUser(editingUser, manualPassword)
  }

  const handleAutomaticPasswordReset = (user) => {
    setEditingUser(user)
    setEditForm({ name: user.name, email: user.email })
    resetPasswordForUser(user, '')
  }

  const handleCopyGeneratedPassword = async () => {
    if (!generatedPassword) {
      return
    }

    try {
      await navigator.clipboard.writeText(generatedPassword)
      setPasswordCopied(true)
    } catch {
      setError('Nu am putut copia parola. Copiaza-o manual.')
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Stergi utilizatorul ${user.email}?`)
    if (!confirmed) {
      return
    }

    try {
      setActionLoading(`delete-${user.id}`)
      await api.delete(`/admin/users/${user.id}`)
      setUsers((currentUsers) => currentUsers.filter((entry) => entry.id !== user.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut sterge utilizatorul.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="crm-hero">
        <span className="crm-badge">Admin</span>
        <h1 className="crm-page-title mt-5">Control panel utilizatori</h1>
        <p className="crm-page-subtitle">Gestioneaza utilizatorii dintr-un singur loc: creare, editare, roluri si resetare parola.</p>
      </section>

      <AdminAddUser formData={formData} loading={submitLoading} error={submitError} onChange={handleFormChange} onSubmit={handleSubmit} />

      {error ? (
        <section className="crm-card">
          <p className="crm-alert-error">{error}</p>
        </section>
      ) : null}

      {generatedPassword ? (
        <section className="crm-card space-y-3">
          <p className="crm-label">Parola generata</p>
          <p className="text-sm text-slate-700">Este afisata o singura data.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input className="crm-input font-mono" value={generatedPassword} readOnly aria-label="Parola generata" />
            <button type="button" onClick={handleCopyGeneratedPassword} className="crm-button-secondary">
              {passwordCopied ? 'Copiata' : 'Copiaza'}
            </button>
            <button type="button" onClick={() => setGeneratedPassword(null)} className="crm-button-secondary">
              Gata
            </button>
          </div>
        </section>
      ) : null}

      {editingUser ? (
        <section className="crm-card space-y-6">
          <div>
            <p className="crm-label">Editeaza utilizator</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{editingUser.email}</h2>
          </div>

          <form onSubmit={handleUpdateUser} className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="crm-label">Nume</span>
              <input className="crm-input" value={editForm.name} onChange={(event) => setEditForm((form) => ({ ...form, name: event.target.value }))} required />
            </label>
            <label className="block space-y-2">
              <span className="crm-label">Email</span>
              <input type="email" className="crm-input" value={editForm.email} onChange={(event) => setEditForm((form) => ({ ...form, email: event.target.value }))} required />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="crm-button-primary" disabled={actionLoading === `update-${editingUser.id}`}>
                Salveaza modificarile
              </button>
              <button type="button" className="crm-button-secondary" onClick={() => setEditingUser(null)}>
                Anuleaza
              </button>
            </div>
          </form>

          <form onSubmit={handleManualPasswordReset} className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-end">
            <label className="block flex-1 space-y-2">
              <span className="crm-label">Parola noua</span>
              <input type="password" className="crm-input" value={manualPassword} onChange={(event) => setManualPassword(event.target.value)} minLength="8" required />
            </label>
            <button type="submit" className="crm-button-secondary" disabled={actionLoading === `reset-${editingUser.id}`}>
              Seteaza parola
            </button>
          </form>
        </section>
      ) : null}

      {loading ? (
        <section className="crm-card">
          <p className="text-sm text-slate-600">Se incarca utilizatorii...</p>
        </section>
      ) : (
        <section className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleStartEdit(user)} className="crm-button-secondary">
                        Editeaza
                      </button>
                      <button type="button" onClick={() => handleRoleToggle(user)} className="crm-button-secondary">
                        {actionLoading === `role-${user.id}` ? 'Se salveaza...' : `Schimba la ${user.role === 'admin' ? 'user' : 'admin'}`}
                      </button>
                      <button type="button" onClick={() => handleAutomaticPasswordReset(user)} className="crm-button-secondary">
                        {actionLoading === `reset-${user.id}` ? 'Se reseteaza...' : 'Resetare automata'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={actionLoading === `delete-${user.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        {actionLoading === `delete-${user.id}` ? 'Se sterge...' : 'Sterge'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}