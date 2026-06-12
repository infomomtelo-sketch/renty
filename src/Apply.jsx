import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Apply() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingIncome, setUploadingIncome] = useState(false)
  const [step, setStep] = useState(1)
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
    gov_id_url: '',
    income_doc_url: '',
    prev_landlord_name: '',
    prev_landlord_phone: '',
    prev_landlord_email: '',
  })

  useEffect(() => {
    if (!propertyId) return
    supabase.from('properties').select('*').eq('id', propertyId).single()
      .then(({ data }) => setProperty(data))
  }, [propertyId])

  async function uploadFile(file, folder) {
    const ext = file.name.split('.').pop()
    const filename = `${folder}/${propertyId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('applications').upload(filename, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('applications').getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleGovIdUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingId(true)
    try {
      const url = await uploadFile(file, 'gov-ids')
      setForm(f => ({ ...f, gov_id_url: url }))
    } catch (err) {
      alert('Upload failed. Try again.')
    }
    setUploadingId(false)
  }

  async function handleIncomeUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingIncome(true)
    try {
      const url = await uploadFile(file, 'income-docs')
      setForm(f => ({ ...f, income_doc_url: url }))
    } catch (err) {
      alert('Upload failed. Try again.')
    }
    setUploadingIncome(false)
  }

  async function handleSubmit() {
    if (!form.full_name || !form.email) {
      alert('Please fill in your name and email.')
      return
    }
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

  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ margin: '0 0 0.5rem', color: '#111' }}>Application Submitted!</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>Thank you for applying. The landlord will review your application and contact you soon.</p>
          <p style={{ color: '#bbb', fontSize: '0.78rem', marginTop: '2rem' }}>Powered by <a href="https://rentyapp.net" style={{ color: '#999' }}>Renty</a></p>
        </div>
      </div>
    )
  }

  if (!property) {
    return <div style={pageStyle}><p style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>Loading property...</p></div>
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', padding: '1.5rem', borderRadius: '14px', marginBottom: '1.5rem', color: '#fff' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.4rem' }}>Rental Application</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{property.address}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{property.city}, CA {property.zip} · {property.bedrooms}bd/{property.bathrooms}ba</div>
        {property.rent_amount && <div style={{ marginTop: '0.75rem', fontSize: '1.3rem', fontWeight: '700' }}>${Number(property.rent_amount).toLocaleString()}<span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'rgba(255,255,255,0.5)' }}>/mo</span></div>}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['Personal', 'Employment', 'Documents', 'References', 'Review'].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '4px', borderRadius: '2px', background: step > i + 1 ? '#111' : step === i + 1 ? '#111' : '#e5e5e5', marginBottom: '0.35rem', opacity: step === i + 1 ? 1 : step > i + 1 ? 0.4 : 0.2 }} />
            <div style={{ fontSize: '0.6rem', color: step === i + 1 ? '#111' : '#bbb', fontWeight: step === i + 1 ? '700' : '400' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Step 1 — Personal */}
      {step === 1 && (
        <Section title="Personal Information">
          <Field label="Full Name *">
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={inputStyle} placeholder="John Smith" />
          </Field>
          <Row>
            <Field label="Email *">
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="john@email.com" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="559-xxx-xxxx" />
            </Field>
          </Row>
          <Field label="Current Address">
            <input value={form.current_address} onChange={e => setForm({ ...form, current_address: e.target.value })} style={inputStyle} placeholder="123 Main St, Fresno CA" />
          </Field>
          <Row>
            <Field label="Move-in Date">
              <input type="date" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Occupants">
              <select value={form.occupants} onChange={e => setForm({ ...form, occupants: e.target.value })} style={inputStyle}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </Row>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#444' }}>
              <input type="checkbox" checked={form.pets} onChange={e => setForm({ ...form, pets: e.target.checked })} />
              I have pets
            </label>
          </Field>
          {form.pets && (
            <Field label="Pet Description">
              <input value={form.pet_description} onChange={e => setForm({ ...form, pet_description: e.target.value })} style={inputStyle} placeholder="e.g. 1 small dog, 20 lbs" />
            </Field>
          )}
        </Section>
      )}

      {/* Step 2 — Employment */}
      {step === 2 && (
        <Section title="Employment & Income">
          <Row>
            <Field label="Employer">
              <input value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} style={inputStyle} placeholder="Company name" />
            </Field>
            <Field label="Monthly Income ($)">
              <input type="number" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} style={inputStyle} placeholder="3000" />
            </Field>
          </Row>
          <Field label="Length of Employment">
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
          </Field>
          <Field label="Additional Message (optional)">
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Tell the landlord a bit about yourself..." />
          </Field>
        </Section>
      )}

      {/* Step 3 — Documents */}
      {step === 3 && (
        <Section title="Verification Documents">
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0, marginBottom: '1.25rem', lineHeight: '1.6' }}>
            These documents help verify your identity and income. Accepted formats: JPG, PNG, PDF.
          </p>

          <Field label="Government-Issued ID">
            <div style={{ border: '2px dashed #e5e5e5', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', background: form.gov_id_url ? '#f0fdf4' : '#fafafa' }}>
              {form.gov_id_url ? (
                <div>
                  <div style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✓ ID Uploaded</div>
                  <button onClick={() => setForm(f => ({ ...f, gov_id_url: '' }))} style={{ ...smallBtnStyle, color: '#dc2626' }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🪪</div>
                  <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '0.75rem' }}>Driver's license, passport, or state ID</div>
                  <label style={{ ...smallBtnStyle, background: '#111', color: '#fff', cursor: 'pointer', display: 'inline-block' }}>
                    {uploadingId ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="image/*,.pdf" onChange={handleGovIdUpload} style={{ display: 'none' }} disabled={uploadingId} />
                  </label>
                </div>
              )}
            </div>
          </Field>

          <Field label="Proof of Income">
            <div style={{ border: '2px dashed #e5e5e5', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', background: form.income_doc_url ? '#f0fdf4' : '#fafafa' }}>
              {form.income_doc_url ? (
                <div>
                  <div style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✓ Document Uploaded</div>
                  <button onClick={() => setForm(f => ({ ...f, income_doc_url: '' }))} style={{ ...smallBtnStyle, color: '#dc2626' }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💵</div>
                  <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '0.75rem' }}>Pay stub, bank statement, or tax return</div>
                  <label style={{ ...smallBtnStyle, background: '#111', color: '#fff', cursor: 'pointer', display: 'inline-block' }}>
                    {uploadingIncome ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="image/*,.pdf" onChange={handleIncomeUpload} style={{ display: 'none' }} disabled={uploadingIncome} />
                  </label>
                </div>
              )}
            </div>
          </Field>
        </Section>
      )}

      {/* Step 4 — References */}
      {step === 4 && (
        <Section title="Previous Landlord Reference">
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0, marginBottom: '1.25rem', lineHeight: '1.6' }}>
            Please provide contact information for your most recent landlord.
          </p>
          <Field label="Landlord Name">
            <input value={form.prev_landlord_name} onChange={e => setForm({ ...form, prev_landlord_name: e.target.value })} style={inputStyle} placeholder="Jane Smith" />
          </Field>
          <Field label="Landlord Phone">
            <input value={form.prev_landlord_phone} onChange={e => setForm({ ...form, prev_landlord_phone: e.target.value })} style={inputStyle} placeholder="559-xxx-xxxx" />
          </Field>
          <Field label="Landlord Email">
            <input type="email" value={form.prev_landlord_email} onChange={e => setForm({ ...form, prev_landlord_email: e.target.value })} style={inputStyle} placeholder="landlord@email.com" />
          </Field>
        </Section>
      )}

      {/* Step 5 — Review */}
      {step === 5 && (
        <Section title="Review & Submit">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <ReviewRow label="Name" value={form.full_name} />
            <ReviewRow label="Email" value={form.email} />
            <ReviewRow label="Phone" value={form.phone} />
            <ReviewRow label="Employer" value={form.employer} />
            <ReviewRow label="Monthly Income" value={form.monthly_income ? `$${Number(form.monthly_income).toLocaleString()}` : '—'} />
            <ReviewRow label="Move-in Date" value={form.move_in_date || '—'} />
            <ReviewRow label="Occupants" value={form.occupants} />
            <ReviewRow label="Pets" value={form.pets ? (form.pet_description || 'Yes') : 'No'} />
            <ReviewRow label="Gov ID" value={form.gov_id_url ? '✓ Uploaded' : '—'} />
            <ReviewRow label="Income Doc" value={form.income_doc_url ? '✓ Uploaded' : '—'} />
            <ReviewRow label="Prev. Landlord" value={form.prev_landlord_name || '—'} />
          </div>
          <p style={{ fontSize: '0.78rem', color: '#999', lineHeight: '1.6' }}>
            By submitting, you certify that all information provided is accurate and complete.
          </p>
        </Section>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '0.85rem', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#444', fontWeight: '500' }}>
            ← Back
          </button>
        )}
        {step < 5 ? (
          <button onClick={() => setStep(s => s + 1)} style={{ flex: 1, padding: '0.85rem', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.85rem', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#bbb', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        Powered by <a href="https://rentyapp.net" style={{ color: '#999' }}>Renty</a>
      </p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111', marginBottom: '1.25rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#666', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>{children}</div>
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ color: '#999' }}>{label}</span>
      <span style={{ fontWeight: '500', color: '#111' }}>{value}</span>
    </div>
  )
}

const pageStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  maxWidth: '480px',
  margin: '0 auto',
  padding: '1.25rem',
  minHeight: '100vh',
  background: '#f7f8fa',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #e5e5e5',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fafafa',
}

const smallBtnStyle = {
  padding: '0.4rem 0.9rem',
  borderRadius: '8px',
  border: '1px solid #e5e5e5',
  background: '#f5f5f5',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontWeight: '500',
}
