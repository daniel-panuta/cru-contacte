import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import ContactCard from '../components/ContactCard'
import ContactsDirectory from '../components/ContactsDirectory'
import SearchBar from '../components/SearchBar'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadContacts() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get('/contacts', {
          params: {
            search: searchTerm,
            limit: 50,
            offset: 0,
          },
        })

        if (!ignore) {
          setContacts(response.data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.detail || 'Nu am putut incarca lista de contacte.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadContacts()

    return () => {
      ignore = true
    }
  }, [searchTerm])

  const handleOpenDetails = async (contact) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    setSelectedContact(contact)

    try {
      const response = await api.get(`/contacts/${contact.id}`)
      setSelectedContact(response.data)
    } catch (err) {
      setDetailsError(err.response?.data?.detail || 'Nu am putut incarca detaliile contactului.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setDetailsLoading(false)
    setDetailsError(null)
    setSelectedContact(null)
  }

  const handleDelete = async (contact) => {
    const confirmed = window.confirm(`Stergi contactul ${[contact.name, contact.firstname].filter(Boolean).join(' ') || 'selectat'}?`)
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/contacts/${contact.id}`)
      setContacts((currentContacts) => currentContacts.filter((entry) => entry.id !== contact.id))

      if (selectedContact?.id === contact.id) {
        handleCloseDetails()
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Nu am putut sterge contactul.')
    }
  }

  const handleEdit = (contact) => {
    navigate(`/contact/edit/${contact.id}`)
  }

  const myContactsCount = contacts.filter((contact) => contact.created_by === user?.id).length

  return (
    <div className="space-y-6">
      <section className="crm-hero">
        <span className="crm-badge">Directory</span>
        <h1 className="crm-page-title mt-5">Dashboard contacte</h1>
        <p className="crm-page-subtitle">
          Cauta rapid in director, vezi detaliile extinse si gestioneaza contactele fara sa incarcam fluxuri suplimentare.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="crm-kpi">
          <p className="crm-label">Total contacte</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{contacts.length}</p>
        </article>
        <article className="crm-kpi">
          <p className="crm-label">Adaugate de mine</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{myContactsCount}</p>
        </article>
        <article className="crm-kpi">
          <p className="crm-label">Cont curent</p>
          <p className="mt-2 text-sm text-slate-600">{user?.name || user?.email}</p>
        </article>
      </section>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      {error ? (
        <section className="crm-card">
          <p className="crm-alert-error">{error}</p>
        </section>
      ) : null}

      <ContactsDirectory contacts={contacts} loading={loading} onOpen={handleOpenDetails} onEdit={handleEdit} onDelete={handleDelete} />

      {detailsOpen ? (
        <ContactCard contact={selectedContact} loading={detailsLoading} error={detailsError} onClose={handleCloseDetails} />
      ) : null}
    </div>
  )
}