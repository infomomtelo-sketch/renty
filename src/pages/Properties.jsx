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
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    const uid = session.user.id
    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', uid)

    if (!props) return

    const enriched = await Promise.all(props.map(async p => {
      const { data: leases } = await supabase
        .from('leases')
        .select(`*, tenants(full_name, email, phone)`)
        .eq('property_id', p.id)
        .order('created_at', { ascending: false })

      return { ...p, leases: leases || [] }
    }))

    setProperties(enriched)
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
    if (!confirm('Delete this property? All associated leases will also be deleted.')) return
    await supabase.from('leases').delete().eq('property_id', id)
    await supabase.from('properties').delete().eq('id', id)
    fetchProperties()
  }

  async function handleDeleteLease(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this lease?')) return
    await supabase.from('leases').delete().eq('id', id)
    fetchProperties()
  }

  function handleEdit(p) {
    setForm({ address: p.address, city: p.city || '', zip: p.zip || '', bedrooms: p.bedrooms || '', bathrooms: p.bathrooms || '', rent_amount: p.rent_amount || '' })
    setEditId(p.id)
    setShowForm(true)
    setSelectedMap(null)
  }

  const totalMonthly = properties.reduce((sum, p) => sum + (Number(p.rent_amount) || 0), 0)

  const inputStyle = { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem' }}>Properties</h2>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {properties.length} properties · <strong style={{ color: '#000' }}>${totalMonthly.toLocaleString()}/mo total</strong> · ${(totalMonthly * 12).toLocaleString()}/yr
          </div>
        </div>
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

            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', cursor: 'pointer', background: expanded === p.id ? '#fafafa' : '#fff' }} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div>
                <div style={{ fontWeight: '500' }}>{p.address}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>{p.city}, CA {p.zip} · {p.bedrooms}bd/{p.bathrooms}ba</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>${p.rent_amount}/mo</div>
                <span style={{ fontSize: '0.8rem', color: p.leases?.length > 0 ? '#2e7d32' : '#666' }}>
                  {p.leases?.length > 0 ? `${p.leases.length} lease${p.leases.length > 1 ? 's' : ''}` : 'No leases'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{expanded === p.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === p.id && (
              <div style={{ borderTop: '1px solid #eee', padding: '1rem', background: '#fafafa' }}>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button onClick={() => setSelectedMap(selectedMap === p.id ? null : p.id)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    📍 {selectedMap === p.id ? 'Hide Map' : 'Show Map'}
                  </button>
                  <button onClick={() => handleEdit(p)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    ✏️ Edit Property
                  </button>
                  <button onClick={() => navigate('/leases/new')} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    + New Lease
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem 0.8rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#c62828' }}>
                    🗑️ Delete Property
                  </button>
                </div>

                {selectedMap === p.id && (
                  <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                      title={p.address}
                      width="100%"
                      height="220"
                      style={{ border: 'none', display: 'block' }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.address}, ${p.city}, CA ${p.zip}`)}&output=embed`}
                    />
                  </div>
                )}

                {p.leases?.length === 0 && (
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0' }}>No leases for this property yet.</p>
                )}

                {p.leases?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#333' }}>Leases & Tenants</div>
                    {p.leases.map(l => (
                      <div key={l.id} style={{ padding: '0.75rem 1rem', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{l.tenants?.full_name || 'Unknown tenant'}</div>
                            <div style={{ color: '#666', fontSize: '0.8rem' }}>{l.tenants?.email} · {l.tenants?.phone}</div>
                            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                              {l.start_date} → {l.end_date}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>${l.rent_amount}/mo</div>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: l.status === 'signed' ? '#e8f5e9' : '#fff8e1',
                              color: l.status === 'signed' ? '#2e7d32' : '#f57f17'
                            }}>
                              {l.status || 'draft'}
                            </span>
                            {l.pdf_url && (
                              <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.3rem 0.6rem', background: '#000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem' }}>
                                PDF
                              </a>
                            )}
                            <button onClick={e => handleDeleteLease(e, l.id)} style={{ padding: '0.3rem 0.6rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#c62828' }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
