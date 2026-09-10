import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ContactForm from '../components/ContactForm'
import api from '../lib/api'
import { EMPTY_CONTACT_FORM, buildContactPayload, validateContactForm } from '../lib/contactForm'

function mapContactToFormData(contact) {
  return {
    name: contact.name || '',
    firstname: contact.firstname || '',
    email: contact.email || '',
    biserica: contact.biserica || '',
    recomandat_de: contact.recomandat_de || '',
    tel1: contact.tel1 || '',
    tel2: contact.tel2 || '',
    tel3: contact.tel3 || '',
    social1: contact.social1 || '',
    social2: contact.social2 || '',
    social3: contact.social3 || '',
  }
}

export default function EditContact() {
  const navigate = useNavigate()
  const { contactId } = useParams()
  const [formData, setFormData] = useState(EMPTY_CONTACT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadContact() {
      setLoading(true)
      setSubmitError(null)

      try {
        const response = await api.get(`/contacts/${contactId}`)
        if (!ignore) {
          setFormData(mapContactToFormData(response.data))
        }
      } catch (err) {
        if (!ignore) {
          if (err.response?.status === 404) {
            setNotFound(true)
          } else {
            setSubmitError(err.response?.data?.detail || 'Nu am putut incarca datele contactului.')
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadContact()

    return () => {
      ignore = true
    }
  }, [contactId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }))
    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateContactForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setSubmitError(null)

    try {
      await api.patch(`/contacts/${contactId}`, buildContactPayload(formData))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Nu am putut actualiza contactul.')
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading && formData === EMPTY_CONTACT_FORM) {
    return (
      <section className="crm-card">
        <p className="text-sm text-slate-600">Se incarca datele contactului...</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {submitError ? (
        <section className="crm-card">
          <p className="crm-alert-error">{submitError}</p>
        </section>
      ) : null}

      <ContactForm
        title="Editeaza contactul"
        subtitle="Datele sunt preincarcate din backend. Poti modifica orice camp, dar contactul trebuie sa ramana valid."
        formData={formData}
        errors={errors}
        loading={loading}
        submitLabel="Salveaza modificarile"
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
      />
    </div>
  )
}