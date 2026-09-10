function renderValue(value) {
  return value || '-'
}

function renderHistory(history) {
  if (!history.length) {
    return <p className="text-sm text-slate-600">Nu exista readaugari pentru acest contact.</p>
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-900">Readaugat de {entry.added_by_name || entry.added_by}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(entry.added_at).toLocaleString('ro-RO')}</p>
        </article>
      ))}
    </div>
  )
}

export default function ContactCard({ contact, loading, error, onClose }) {
  if (!contact && !loading && !error) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="crm-label">Detalii contact</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {contact ? [contact.name, contact.firstname].filter(Boolean).join(' ').trim() || 'Contact fara nume' : 'Se incarca...'}
            </h2>
          </div>

          <button type="button" onClick={onClose} className="crm-button-secondary">
            Inchide
          </button>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-600">Se incarca detaliile...</p> : null}
        {error ? <p className="crm-alert-error mt-6">{error}</p> : null}

        {contact ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="crm-label">Date principale</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Email:</span> {renderValue(contact.email)}</p>
                  <p><span className="font-medium text-slate-900">Biserica:</span> {renderValue(contact.biserica)}</p>
                  <p><span className="font-medium text-slate-900">Recomandat de:</span> {renderValue(contact.recomandat_de)}</p>
                </div>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="crm-label">Contact</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Telefon 1:</span> {renderValue(contact.tel1)}</p>
                  <p><span className="font-medium text-slate-900">Telefon 2:</span> {renderValue(contact.tel2)}</p>
                  <p><span className="font-medium text-slate-900">Telefon 3:</span> {renderValue(contact.tel3)}</p>
                  <p><span className="font-medium text-slate-900">Social:</span> {[contact.social1, contact.social2, contact.social3].filter(Boolean).join(', ') || '-'}</p>
                </div>
              </article>
            </div>

            <article className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="crm-label">Istoric adaugari</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <p><span className="font-medium text-slate-900">Adaugat initial de:</span> {contact.created_by_name || contact.created_by || '-'}</p>
                <p><span className="font-medium text-slate-900">Creat la:</span> {new Date(contact.created_at).toLocaleString('ro-RO')}</p>
                <p><span className="font-medium text-slate-900">Ultima actualizare:</span> {new Date(contact.updated_at).toLocaleString('ro-RO')}</p>
              </div>
              <div className="mt-4">{renderHistory(contact.history || [])}</div>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  )
}