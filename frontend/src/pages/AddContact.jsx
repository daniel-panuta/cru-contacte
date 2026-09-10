import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContactForm from '../components/ContactForm'
import api from '../lib/api'
import { EMPTY_CONTACT_FORM, buildContactPayload, validateContactForm } from '../lib/contactForm'

export default function AddContact() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(EMPTY_CONTACT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)

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
      await api.post('/contacts', buildContactPayload(formData))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Nu am putut salva contactul.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {submitError ? (
        <section className="crm-card">
          <p className="crm-alert-error">{submitError}</p>
        </section>
      ) : null}

      <ContactForm
        title="Adauga un contact"
        subtitle="Completeaza datele esentiale. Sunt necesare cel putin nume sau prenume si minimum un telefon."
        formData={formData}
        errors={errors}
        loading={loading}
        submitLabel="Salveaza contactul"
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
      />
    </div>
  )
}