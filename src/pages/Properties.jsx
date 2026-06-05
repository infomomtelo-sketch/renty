import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Properties({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', property_type: '', sqft: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)

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

      const leasesWithPayments = await Promise.all((leases || []).map(async l => {
        const { data: payments } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('lease_id', l.id)
          .order('due_date', { ascending: false })
          .limit(6)
        return { ...l, payments: payments || [] }
      }))

      return { ...p, leases: leasesWithPayments }
    }))

    setProperties(enriched)
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  try {
    const data = {
      address: form.address,
      city: form.city,
      zip: form.zip,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      property_type: form.property_type || null,
      sqft: form.sqft ? Number(form.sqft) : null,
      landlord_id: session.user.id
    }
    if (editId) {
      await supabase.from('properties').update(data).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('properties').insert(data)
    }
    setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', property_type: '', sqft: '' })
    setShowForm(false)
    fetchProperties()
  } catch (err) {
    alert('Error: ' + err.message)
  }
  setLoading(false)
}

  async function handleDelete(id) {
    if (!confirm('Delete this property? All leases will also be deleted.')) return
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

  async function handleMarkPaid(e, lease) {
    e.stopPropagation()
    setMarkingPaid(lease.id)
    const today = new Date()
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0]

    const existing = lease.payments?.find(p => p.due_date === dueDate)

    if (existing) {
      await supabase.from('rent_payments').delete().eq('id', existing.id)
    } else {
      await supabase.from('rent_payments').insert({
        lease_id: lease.id,
        landlord_id: session.user.id,
        tenant_id: lease.tenant_id,
        property_id: lease.property_id,
        amount: lease.rent_amount,
        due_date: dueDate,
        paid_date: today.toISOString().split('T')[0],
        status: 'paid',
      })
    }
    setMarkingPaid(null)
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
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const currentDueDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

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
    <input placeholder="Street Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required style={{ ...inputStyle, gridColumn: '1 / -1' }} />
    <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
    <input placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} style={inputStyle} />
    <input placeholder="Bedrooms" type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} style={inputStyle} />
    <input placeholder="Bathrooms" type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} style={inputStyle} />
    <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} style={inputStyle}>
      <option value="">Property Type</option>
      <option value="house">House</option>
      <option value="apartment">Apartment</option>
      <option value="condo">Condo</option>
      <option value="duplex">Duplex</option>
      <option value="townhouse">Townhouse</option>
      <option value="mobile">Mobile Home</option>
    </select>
    <input placeholder="Sq Footage (optional)" type="number" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} />
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
                <span style={{ fontSize: '0.8rem', color: p.leases?.length > 0 ? '#2e7d32' : '#999' }}>
                  {p.leases?.length > 0 ? `${p.leases.length} lease${p.leases.length > 1 ? 's' : ''}` : 'Vacant'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{expanded === p.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === p.id && (
              <div style={{ borderTop: '1px solid #eee', padding: '1rem', background: '#fafafa' }}>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button onClick={() => setSelectedMap(selectedMap === p.id ? null : p.id)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    📍 Map
                  </button>
                  <button onClick={() => handleEdit(p)} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => navigate('/leases/new')} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    + Lease
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem 0.8rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#c62828' }}>
                    🗑️
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
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>No leases yet.</p>
                )}

                {p.leases?.map(l => {
                  const currentPaid = l.payments?.find(pay => pay.due_date === currentDueDate && pay.status === 'paid')
                  return (
                    <div key={l.id} style={{ padding: '1rem', background: '#fff', border: '1px solid #eee', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{l.tenants?.full_name || 'Unknown'}</div>
                          <div style={{ color: '#666', fontSize: '0.8rem' }}>{l.tenants?.phone} · {l.tenants?.email}</div>
                          <div style={{ color: '#666', fontSize: '0.8rem' }}>{l.start_date} → {l.end_date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>${l.rent_amount}/mo</span>
                          {l.pdf_url && (
                            <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.3rem 0.6rem', background: '#000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem' }}>PDF</a>
                          )}
                          <button onClick={e => handleDeleteLease(e, l.id)} style={{ padding: '0.3rem 0.6rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#c62828' }}>🗑️</button>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Rent — {currentMonth}</span>
                          <button
                            onClick={e => handleMarkPaid(e, l)}
                            disabled={markingPaid === l.id}
                            style={{
                              padding: '0.4rem 0.8rem',
                              background: currentPaid ? '#e8f5e9' : '#000',
                              color: currentPaid ? '#2e7d32' : '#fff',
                              border: currentPaid ? '1px solid #a5d6a7' : 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            {markingPaid === l.id ? '...' : currentPaid ? '✓ Paid — undo' : 'Mark as Paid'}
                          </button>
                        </div>

                        {l.payments?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {l.payments.map(pay => (
                              <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', padding: '0.25rem 0', borderBottom: '1px solid #f5f5f5' }}>
                                <span>{new Date(pay.due_date + 'T12:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                <span style={{ color: pay.status === 'paid' ? '#2e7d32' : '#c62828', fontWeight: '500' }}>
                                  {pay.status === 'paid' ? `✓ Paid ${pay.paid_date}` : '✗ Unpaid'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
