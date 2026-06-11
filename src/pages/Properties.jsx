import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PROPERTY_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

export default function Properties({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', property_type: '', sqft: '', rent_amount: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    const uid = session.user.id
    const { data: props } = await supabase.from('properties').select('*').eq('landlord_id', uid)
    if (!props) return

    const enriched = await Promise.all(props.map(async p => {
      const { data: leases } = await supabase
        .from('leases')
        .select(`*, tenants(full_name, email, phone)`)
        .eq('property_id', p.id)
        .order('created_at', { ascending: false })

      const leasesWithPayments = await Promise.all((leases || []).map(async l => {
        const { data: payments } = await supabase
          .from('rent_payments').select('*').eq('lease_id', l.id)
          .order('due_date', { ascending: false }).limit(6)
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
        address: form.address, city: form.city, zip: form.zip,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        property_type: form.property_type || null,
        sqft: form.sqft ? Number(form.sqft) : null,
        rent_amount: form.rent_amount ? Number(form.rent_amount) : null,
        landlord_id: session.user.id,
      }
      if (editId) {
        await supabase.from('properties').update(data).eq('id', editId)
        setEditId(null)
      } else {
        await supabase.from('properties').insert(data)
      }
      setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', property_type: '', sqft: '', rent_amount: '' })
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
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const existing = lease.payments?.find(p => p.due_date === dueDate)
    if (existing) {
      await supabase.from('rent_payments').delete().eq('id', existing.id)
    } else {
      await supabase.from('rent_payments').insert({
        lease_id: lease.id, landlord_id: session.user.id,
        tenant_id: lease.tenant_id, property_id: lease.property_id,
        amount: lease.rent_amount, due_date: dueDate,
        paid_date: today.toISOString().split('T')[0], status: 'paid',
      })
    }
    setMarkingPaid(null)
    fetchProperties()
  }

  function handleEdit(p) {
    setForm({ address: p.address, city: p.city || '', zip: p.zip || '', bedrooms: p.bedrooms || '', bathrooms: p.bathrooms || '', rent_amount: p.rent_amount || '', property_type: p.property_type || '', sqft: p.sqft || '' })
    setEditId(p.id)
    setShowForm(true)
  }

  const totalMonthly = properties.reduce((sum, p) => sum + (Number(p.rent_amount) || 0), 0)
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const currentDueDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f7f8fa', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '1.25rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginBottom: '0.25rem', display: 'block' }}>← Dashboard</button>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#111' }}>Properties</h1>
          {totalMonthly > 0 && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.1rem' }}>${totalMonthly.toLocaleString()}/mo · {properties.length} properties</div>}
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ address: '', city: '', zip: '', bedrooms: '', bathrooms: '', property_type: '', sqft: '', rent_amount: '' }) }}
          style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
          + Add
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ margin: '1rem', background: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '1rem', color: '#111' }}>{editId ? 'Edit Property' : 'New Property'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input placeholder="Street Address *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required style={inputStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
              <input placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input placeholder="Beds" type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} style={inputStyle} />
              <input placeholder="Baths" type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input placeholder="Monthly Rent $" type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} style={inputStyle} />
              <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} style={inputStyle}>
                <option value="">Type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="duplex">Duplex</option>
                <option value="townhouse">Townhouse</option>
                <option value="mobile">Mobile Home</option>
              </select>
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.85rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Saving...' : editId ? 'Update Property' : 'Save Property'}
            </button>
            {editId && (
              <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '0.75rem', fontSize: '0.85rem', cursor: 'pointer', color: '#666' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Property list */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {properties.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fff', borderRadius: '14px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏠</div>
            <div style={{ fontWeight: '600', color: '#111', marginBottom: '0.4rem' }}>No properties yet</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>Add your first rental property to get started.</div>
          </div>
        )}

        {properties.map((p, idx) => {
          const gradient = PROPERTY_GRADIENTS[idx % PROPERTY_GRADIENTS.length]
          const isExpanded = expanded === p.id
          const occupiedLeases = p.leases?.filter(l => l.status !== 'draft') || []
          const isOccupied = p.leases?.length > 0

          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* Property card header with gradient */}
              <div style={{ background: gradient, padding: '1.25rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: isOccupied ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: '600', color: '#fff' }}>
                  {isOccupied ? `${p.leases.length} Lease${p.leases.length > 1 ? 's' : ''}` : 'Vacant'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  {p.property_type || 'Property'}
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff', lineHeight: '1.3' }}>{p.address}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', marginTop: '0.2rem' }}>{p.city}, CA {p.zip} · {p.bedrooms}bd/{p.bathrooms}ba</div>
                {p.rent_amount > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '1.3rem', fontWeight: '700', color: '#fff' }}>${Number(p.rent_amount).toLocaleString()}<span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'rgba(255,255,255,0.7)' }}>/mo</span></div>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                <button onClick={() => setSelectedMap(selectedMap === p.id ? null : p.id)} style={actionBtnStyle}>📍 Map</button>
                <button onClick={() => handleEdit(p)} style={actionBtnStyle}>✏️ Edit</button>
                <button onClick={() => navigate('/leases/new')} style={{ ...actionBtnStyle, background: '#111', color: '#fff' }}>+ Lease</button>
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} style={actionBtnStyle}>{isExpanded ? '▲ Hide' : '▼ Details'}</button>
                <button onClick={() => handleDelete(p.id)} style={{ ...actionBtnStyle, color: '#dc2626', marginLeft: 'auto' }}>🗑️</button>
              </div>

              {/* Map */}
              {selectedMap === p.id && (
                <div style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <iframe
                    title={p.address} width="100%" height="200" style={{ border: 'none', display: 'block' }} loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.address}, ${p.city}, CA ${p.zip}`)}&output=embed`}
                  />
                </div>
              )}

              {/* Leases expanded */}
              {isExpanded && (
                <div style={{ padding: '1rem' }}>
                  {p.leases?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#888', fontSize: '0.85rem' }}>No leases yet</div>
                  )}
                  {p.leases?.map(l => {
                    const currentPaid = l.payments?.find(pay => pay.due_date === currentDueDate && pay.status === 'paid')
                    return (
                      <div key={l.id} style={{ border: '1px solid #f0f0f0', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#111', fontSize: '0.95rem' }}>{l.tenants?.full_name || 'Unknown'}</div>
                            <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.15rem' }}>{l.tenants?.phone}</div>
                            <div style={{ color: '#888', fontSize: '0.78rem' }}>{l.start_date} → {l.end_date}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: '#111', fontSize: '0.9rem' }}>${l.rent_amount}/mo</span>
                            {l.pdf_url && <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.25rem 0.5rem', background: '#111', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.7rem' }}>PDF</a>}
                            <button onClick={e => handleDeleteLease(e, l.id)} style={{ background: '#fff0f0', border: 'none', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', color: '#dc2626' }}>🗑️</button>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: '500', color: '#444' }}>{currentMonth}</span>
                          <button onClick={e => handleMarkPaid(e, l)} disabled={markingPaid === l.id} style={{
                            padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', border: 'none',
                            background: currentPaid ? '#dcfce7' : '#111',
                            color: currentPaid ? '#16a34a' : '#fff',
                          }}>
                            {markingPaid === l.id ? '...' : currentPaid ? '✓ Paid' : 'Mark Paid'}
                          </button>
                        </div>

                        {l.payments?.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {l.payments.map(pay => (
                              <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#888', padding: '0.25rem 0', borderBottom: '1px solid #f9f9f9' }}>
                                <span>{new Date(pay.due_date + 'T12:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                <span style={{ color: pay.status === 'paid' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                                  {pay.status === 'paid' ? `✓ ${pay.paid_date}` : '✗ Unpaid'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #e5e5e5',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fafafa',
}

const actionBtnStyle = {
  padding: '0.4rem 0.7rem',
  background: '#f5f5f5',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: '500',
  color: '#444',
}
