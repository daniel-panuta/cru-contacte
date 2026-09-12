import { CONTACT_FORM_FIELDS } from '../lib/contactForm'

function fieldError(errors, names) {
  return names.map((name) => errors[name]).find(Boolean) || null
}

export default function ContactForm({ title, subtitle, formData, errors, loading, submitLabel, onChange, onSubmit, onCancel }) {
  return (
    <div className="space-y-6">
      <section className="crm-hero">
        <span className="crm-badge">Contact Form</span>
        <h1 className="crm-page-title mt-5">{title}</h1>
        <p className="crm-page-subtitle">{subtitle}</p>
      </section>

      <form onSubmit={onSubmit} className="crm-card space-y-8">
        {CONTACT_FORM_FIELDS.map((section) => (
          <fieldset key={section.title} className="space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
            <legend className="text-lg font-semibold text-slate-900">{section.title}</legend>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.fields.map((field) => (
                <label key={field.name} className="block space-y-2">
                  <span className="crm-label">{field.label}</span>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    className="crm-input"
                  />
                  {errors[field.name] ? <p className="text-sm text-red-600">{errors[field.name]}</p> : null}
                </label>
              ))}
            </div>

            {section.title === 'Identitate' && fieldError(errors, ['name', 'firstname']) ? (
              <p className="text-sm text-red-600">{fieldError(errors, ['name', 'firstname'])}</p>
            ) : null}

            {section.title === 'Telefoane' && fieldError(errors, ['tel1']) ? (
              <p className="text-sm text-red-600">{fieldError(errors, ['tel1'])}</p>
            ) : null}
          </fieldset>
        ))}

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="crm-button-secondary">
            Anuleaza
          </button>
          <button type="submit" disabled={loading} className="crm-button-primary">
            {loading ? 'Se salveaza...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}