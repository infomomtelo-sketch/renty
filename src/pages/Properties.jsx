import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Properties({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', rent_amount: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    const { data } = await supabase.from('properties').select('*').eq('landlord_id', session.user.id)
    setProperties(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    if (editId) {
      await supabase.from('properties').update(form).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('properties').insert({ ...form, landlord_id: session.user.id })
    }
    setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', rent_amount: '' })
    setShowForm(false)
    fetchProperties()
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this property? This cannot be undone.')) return
    await supabase.from('properties').delete().eq('id', id)
    fetchProperties()
  }

  function handleEdit(p) {
    setForm({ address: p.address, city: p.city || '', zip: p.zip || '', bedrooms: p.bedrooms || '', bathrooms: p.bathrooms || '', rent_amount: p.rent_amount || '' })
    setEditId(p.id)
    setShowForm(true)
    setSelectedMap(null)
  }

  const inputStyle = { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Properties</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', rent_amount: '' }) }} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            + Add Property
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required style={{ ...inputStyle, gridColumn: '1 / -1' }} />
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
          <input placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} style={inputStyle} />
          <input placeholder="Rent amount" type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} style={inputStyle} />
          <input placeholder="Bedrooms" type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} style={inputStyle} />
          <input placeholder="Bathrooms" type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
          <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : editId ? 'Update Property' : 'Save Property'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ gridColumn: '1 / -1', padding: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {properties.length === 0 && <p style={{ color: '#666' }}>No properties yet. Add your first one.</p>}
        {properties.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{p.address}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>{p.city}, CA {p.zip} · {p.bedrooms}bd/{p.bathrooms}ba</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>${p.rent_amount}/mo</div>
                <button onClick={() => setSelectedMap(selectedMap === p.id ? null : p.id)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  📍 Map
                </button>
                <button onClick={() => handleEdit(p)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem 0.8rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#c62828' }}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            {selectedMap === p.id && (
              <div style={{ borderTop: '1px solid #eee' }}>
                <iframe
                  title={p.address}
                  width="100%"
                  height="250"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.address}, ${p.city}, CA ${p.zip}`)}&output=embed`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
