export const CONTACT_FORM_FIELDS = [
  {
    title: 'Identitate',
    fields: [
      { name: 'name', label: 'Nume', type: 'text', placeholder: 'Popescu' },
      { name: 'firstname', label: 'Prenume', type: 'text', placeholder: 'Andrei' },
    ],
  },
  {
    title: 'Informatii generale',
    fields: [
      { name: 'email', label: 'Email', type: 'email', placeholder: 'andrei.popescu@example.com' },
      { name: 'biserica', label: 'Biserica', type: 'text', placeholder: 'Emanuel' },
      { name: 'recomandat_de', label: 'Recomandat de', type: 'text', placeholder: 'Mihai' },
    ],
  },
  {
    title: 'Telefoane',
    fields: [
      { name: 'tel1', label: 'Telefon 1', type: 'tel', placeholder: '0721 123 456' },
      { name: 'tel2', label: 'Telefon 2', type: 'tel', placeholder: '0733 123 456' },
      { name: 'tel3', label: 'Telefon 3', type: 'tel', placeholder: '0744 123 456' },
    ],
  },
  {
    title: 'Conexiuni sociale',
    fields: [
      { name: 'social1', label: 'Social 1', type: 'text', placeholder: '@andrei' },
      { name: 'social2', label: 'Social 2', type: 'text', placeholder: 'facebook.com/andrei' },
      { name: 'social3', label: 'Social 3', type: 'text', placeholder: 'instagram.com/andrei' },
    ],
  },
]

export const EMPTY_CONTACT_FORM = {
  name: '',
  firstname: '',
  email: '',
  biserica: '',
  recomandat_de: '',
  tel1: '',
  tel2: '',
  tel3: '',
  social1: '',
  social2: '',
  social3: '',
}

export function validateContactForm(formData) {
  const errors = {}
  const hasName = formData.name.trim() || formData.firstname.trim()
  const hasPhone = formData.tel1.trim() || formData.tel2.trim() || formData.tel3.trim()

  if (!hasName) {
    errors.name = 'Completeaza cel putin nume sau prenume.'
    errors.firstname = 'Completeaza cel putin nume sau prenume.'
  }

  if (!hasPhone) {
    errors.tel1 = 'Completeaza cel putin un numar de telefon.'
  }

  if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Email invalid.'
  }

  return errors
}

export function buildContactPayload(formData) {
  return Object.fromEntries(Object.entries(formData).map(([key, value]) => [key, value.trim()]))
}