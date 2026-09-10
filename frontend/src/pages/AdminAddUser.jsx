export default function AdminAddUser({ formData, loading, error, onChange, onSubmit }) {
  return (
    <section className="crm-card space-y-4">
      <div>
        <p className="crm-label">Admin</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Adauga utilizator</h2>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block space-y-2 xl:col-span-1">
          <span className="crm-label">Nume</span>
          <input type="text" name="name" value={formData.name} onChange={onChange} className="crm-input" required />
        </label>

        <label className="block space-y-2 xl:col-span-1">
          <span className="crm-label">Email</span>
          <input type="email" name="email" value={formData.email} onChange={onChange} className="crm-input" required />
        </label>

        <label className="block space-y-2 xl:col-span-1">
          <span className="crm-label">Parola</span>
          <input type="password" name="password" value={formData.password} onChange={onChange} className="crm-input" required />
        </label>

        <label className="block space-y-2 xl:col-span-1">
          <span className="crm-label">Rol</span>
          <select name="role" value={formData.role} onChange={onChange} className="crm-input" required>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <div className="xl:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {error ? <p className="crm-alert-error">{error}</p> : <span />}
          <button type="submit" disabled={loading} className="crm-button-primary self-start">
            {loading ? 'Se creeaza...' : 'Creeaza utilizator'}
          </button>
        </div>
      </form>
    </section>
  )
}