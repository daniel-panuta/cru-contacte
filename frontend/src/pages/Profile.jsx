import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import api from '../lib/api'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me')
        if (active) {
          setProfile(response.data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.detail || 'Profilul nu a putut fi incarcat')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="crm-card space-y-6">
      <div>
        <p className="crm-label">Profile</p>
        <h1 className="crm-page-title text-2xl">Datele contului tau</h1>
        <p className="crm-page-subtitle">Aici vezi informatiile de baza si cate contacte ai adaugat.</p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Se incarca profilul...</p> : null}
      {error ? <p className="crm-alert-error">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="crm-label">Nume</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile?.name || '-'}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="crm-label">Email</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile?.email || '-'}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="crm-label">Rol</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile?.role || '-'}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="crm-label">Contacte adaugate</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile?.contacts_count ?? 0}</p>
        </div>
      </div>
    </section>
  )
}