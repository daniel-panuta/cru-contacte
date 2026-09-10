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
      const response = await api.post(`/admin/users/${user.id}/role`, { role: nextRole })
      setUsers((currentUsers) => currentUsers.map((entry) => (entry.id === user.id ? response.data : entry)))
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut actualiza rolul.')
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Stergi utilizatorul ${user.email}?`)
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers((currentUsers) => currentUsers.filter((entry) => entry.id !== user.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut sterge utilizatorul.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="crm-hero">
        <span className="crm-badge">Admin</span>
        <h1 className="crm-page-title mt-5">Control panel utilizatori</h1>
        <p className="crm-page-subtitle">Gestioneaza utilizatorii dintr-un singur loc: listare, creare, schimbare rol si stergere.</p>
      </section>

      <AdminAddUser formData={formData} loading={submitLoading} error={submitError} onChange={handleFormChange} onSubmit={handleSubmit} />

      {error ? (
        <section className="crm-card">
          <p className="crm-alert-error">{error}</p>
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
                      <button type="button" onClick={() => handleRoleToggle(user)} className="crm-button-secondary">
                        Schimba la {user.role === 'admin' ? 'user' : 'admin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Sterge
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