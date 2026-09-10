function formatFullName(contact) {
  return [contact.name, contact.firstname].filter(Boolean).join(' ').trim() || 'Contact fara nume'
}

function formatList(values) {
  const entries = values.filter(Boolean)
  return entries.length ? entries.join(', ') : '-'
}

export default function ContactsDirectory({ contacts, loading, onOpen, onEdit, onDelete }) {
  if (loading) {
    return (
      <section className="crm-card">
        <p className="text-sm text-slate-600">Se incarca lista de contacte...</p>
      </section>
    )
  }

  if (!contacts.length) {
    return (
      <section className="crm-card">
        <h2 className="text-lg font-semibold text-slate-900">Niciun contact gasit</h2>
        <p className="mt-2 text-sm text-slate-600">Incearca un alt termen de cautare.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="crm-table-wrap hidden lg:block">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Nume / Prenume</th>
              <th>Telefoane</th>
              <th>Email / Social</th>
              <th>Biserica / Recomandat</th>
              <th>Istoric</th>
              <th>Actiuni</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <p className="font-semibold text-slate-900">{formatFullName(contact)}</p>
                  <p className="mt-1 text-xs text-slate-500">Actualizat: {new Date(contact.updated_at).toLocaleDateString('ro-RO')}</p>
                </td>
                <td>{formatList([contact.tel1, contact.tel2, contact.tel3])}</td>
                <td>
                  <p>{contact.email || '-'}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatList([contact.social1, contact.social2, contact.social3])}</p>
                </td>
                <td>
                  <p>{contact.biserica || '-'}</p>
                  <p className="mt-1 text-xs text-slate-500">{contact.recomandat_de || '-'}</p>
                </td>
                <td>
                  <p className="text-sm text-slate-700">Detalii complete in panoul extins</p>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onEdit(contact)} className="crm-button-secondary">
                      Edit
                    </button>
                    <button type="button" onClick={() => onOpen(contact)} className="crm-button-secondary">
                      Detalii
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(contact)}
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
      </div>

      <div className="grid gap-4 lg:hidden">
        {contacts.map((contact) => (
          <article key={contact.id} className="crm-card space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{formatFullName(contact)}</h3>
              <p className="mt-1 text-sm text-slate-600">{contact.email || 'Fara email'}</p>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-medium text-slate-900">Telefoane:</span> {formatList([contact.tel1, contact.tel2, contact.tel3])}</p>
              <p><span className="font-medium text-slate-900">Social:</span> {formatList([contact.social1, contact.social2, contact.social3])}</p>
              <p><span className="font-medium text-slate-900">Biserica:</span> {contact.biserica || '-'}</p>
              <p><span className="font-medium text-slate-900">Recomandat:</span> {contact.recomandat_de || '-'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onEdit(contact)} className="crm-button-secondary">
                Edit
              </button>
              <button type="button" onClick={() => onOpen(contact)} className="crm-button-secondary">
                Detalii
              </button>
              <button
                type="button"
                onClick={() => onDelete(contact)}
                className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                Sterge
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}