import { useEffect, useState } from 'react'

export default function SearchBar({ value, onChange }) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      onChange(draft.trim())
    }, 300)

    return () => window.clearTimeout(timerId)
  }, [draft, onChange])

  return (
    <section className="crm-card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="crm-label">Cautare</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Gaseste rapid un contact</h2>
          <p className="mt-2 text-sm text-slate-600">
            Cautarea este globala si filtreaza dupa nume, telefon, email, biserica sau social.
          </p>
        </div>

        <button type="button" onClick={() => setDraft('')} className="crm-button-secondary self-start">
          Reset
        </button>
      </div>

      <label className="block space-y-2">
        <span className="crm-label">Search</span>
        <input
          type="search"
          className="crm-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ex: Popescu, 0721, Emanuel, facebook"
        />
      </label>
    </section>
  )
}