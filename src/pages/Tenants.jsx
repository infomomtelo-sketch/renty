import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Tenants({ session }) {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => { fetchTenants() }, []) 

  async function fetchTenants() {
    const { data } = await supabase.from('tenants').select('*').eq('landlord_id', session.user.id)
    setTenants(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    if (editId) {
      await supabase.from('tenants').update(form).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('tenants').insert({ ...form, landlord_id: session.user.id })
    }
    setForm({ full_name: '', email: '', phone: '' })
    setShowForm(false)
    fetchTenants()
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tenant? This cannot be undone.')) return
    await supabase.from('tenants').delete().eq('id', id)
    fetchTenants()
  }

  function handleEdit(t) {
    setForm({ full_name: t.full_name, email: t.email || '', phone: t.phone || '' })
    setEditId(t.id)
    setShowForm(true)
  }

  const inputStyle = { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Tenants</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ full_name: '', email: '', phone: '' }) }} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            + Add Tenant
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={{ ...inputStyle, gridColumn: '1 / -1' }} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
          <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : editId ? 'Update Tenant' : 'Save Tenant'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ gridColumn: '1 / -1', padding: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tenants.length === 0 && <p style={{ color: '#666' }}>No tenants yet. Add your first one.</p>}
        {tenants.map(t => (
          <div key={t.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{t.full_name}</div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>{t.email} · {t.phone}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/leases/new')} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                New Lease
              </button>
              <button onClick={() => handleEdit(t)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                ✏️ Edit
              </button>
