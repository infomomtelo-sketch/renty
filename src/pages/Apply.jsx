import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Apply() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false) 
  const [form, setForm] = useState({
    full_name: '', 
    email: '',
    phone: '',
    current_address: '',
    monthly_income: '',
    employer: '',
    employment_length: '',
    occupants: '1',
    pets: false,
    pet_description: '',
    move_in_date: '',
    message: '',
  })

  useEffect(() => {
    if (!propertyId) return
    supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()
      .then(({ data }) => setProperty(data))
  }, [propertyId])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('applications').insert({
        ...form,
        property_id: propertyId,
        landlord_id: property.landlord_id,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        occupants: Number(form.occupants),
      })
      setSubmitted(true)
    } catch (err) {
      alert('Error submitting application. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: '500',
    fontSize: '0.9rem',
  }

  if (submitted) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2>Application Submitted!</h2>
        <p style={{ color: '#666' }}>Thank you for applying. The landlord will review your application and contact you soon.</p>
        <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '2rem' }}>Powered by Renty — rentyapp.net</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <p>Loading property...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Rental Application</h1>
        <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <div style={{ fontWeight: '600' }}>{property.address}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>{property.city}, CA {property.zip} · {property.bedrooms}bd/{property.bathrooms}ba</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>Personal Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={inputStyle} placeholder="John Smith" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="john@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="559-xxx-xxxx" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Current Address</label>
              <input value={form.current_address} onChange={e => setForm({ ...form, current_address: e.target.value })} style={inputStyle} placeholder="123 Main St, Fresno CA" />
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>Employment & Income</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Employer</label>
                <input value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} style={inputStyle} placeholder="Company name" />
              </div>
              <div>
                <label style={labelStyle}>Monthly Income ($)</label>
                <input type="number" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} style={inputStyle} placeholder="3000" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Length of Employment</label>
              <select value={form.employment_length} onChange={e => setForm({ ...form, employment_length: e.target.value })} style={inputStyle}>
                <option value="">Select...</option>
                <option value="less than 6 months">Less than 6 months</option>
                <option value="6-12 months">6-12 months</option>
                <option value="1-2 years">1-2 years</option>
                <option value="2-5 years">2-5 years</option>
                <option value="5+ years">5+ years</option>
                <option value="self-employed">Self-employed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>Rental Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Desired Move-in Date</label>
                <input type="date" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Number of Occupants</label>
                <select value={form.occupants} onChange={e => setForm({ ...form, occupants: e.target.value })} style={inputStyle}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.pets} onChange={e => setForm({ ...form, pets: e.target.checked })} />
                I have pets
              </label>
            </div>
            {form.pets && (
              <div>
                <label style={labelStyle}>Pet Description</label>
                <input value={form.pet_description} onChange={e => setForm({ ...form, pet_description: e.target.value })} style={inputStyle} placeholder="e.g. 1 small dog, 20 lbs" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Additional Message (optional)</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Tell the landlord a bit about yourself..." />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>

        <p style={{ textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
          Powered by <a href="https://rentyapp.net" style={{ color: '#666' }}>Renty</a>
        </p>
      </form>
    </div>
  )
}
