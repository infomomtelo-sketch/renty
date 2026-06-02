import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Properties({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', rent_amount: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    const { data } = await supabase.from('properties').select('*').eq('landlord_id', session.user.id)
    setProperties(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('properties').insert({ ...form, landlord_id: session.user.id })
    setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', rent_amount: '' })
    setShowForm(false)
    fetchProperties()
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Properties</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Add Property</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '2rem' }}>
          <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input placeholder="Rent amount" type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input placeholder="Bedrooms" type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input placeholder="Bathrooms" type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Property'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {properties.length === 0 && <p style={{ color: '#666' }}>No properties yet. Add your first one.</p>}
        {properties.map(p => (
          <div key={p.id} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{p.address}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{p.city}, CA {p.zip} · {p.bedrooms}bd/{p.bathrooms}ba</div>
            </div>
            <div style={{ fontWeight: 'bold' }}>${p.rent_amount}/mo</div>
          </div>
        ))}
      </div>
    </div>
  )
}
