import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── PUBLIC PAGE — no auth required, no nav bar, no sign-out button ──

const STEPS = ['Personal Info', 'Employment', 'Rental History', 'Documents', 'Review & Submit']

export default function Apply() {
  const { propertyId } = useParams()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', dob: '',
    employer: '', job_title: '', monthly_income: '', employment_type: 'Full-time',
    current_address: '', current_landlord: '', current_landlord_phone: '',
    reason_leaving: '', years_at_current: '',
    id_file: null, income_file: null,
    adults: '1', pets: 'No', pets_desc: '', notes: '',
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function field(label, key, type = 'text', placeholder = '') {
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={placeholder}
          style={styles.input}
        />
      </div>
    )
  }

  function select(label, key, options) {
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>{label}</label>
        <select value={form[key]} onChange={e => set(key, e.target.value)} style={styles.input}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  async function uploadFile(file, bucket, path) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      let id_url = null, income_url = null
      const ts = Date.now()

      if (form.id_file) {
        id_url = await uploadFile(form.id_file, 'applications', `${propertyId}/${ts}-id`)
      }
      if (form.income_file) {
        income_url = await uploadFile(form.income_file, 'applications', `${propertyId}/${ts}-income`)
      }

      const { error: dbErr } = await supabase.from('applications').insert({
        property_id: propertyId,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        dob: form.dob || null,
        employer: form.employer,
        job_title: form.job_title,
        monthly_income: parseFloat(form.monthly_income) || null,
        employment_type: form.employment_type,
        current_address: form.current_address,
        current_landlord: form.current_landlord,
        current_landlord_phone: form.current_landlord_phone,
        reason_leaving: form.reason_leaving,
        years_at_current: form.years_at_current,
        adults: parseInt(form.adults) || 1,
        pets: form.pets,
        pets_desc: form.pets_desc,
        notes: form.notes,
        id_document_url: id_url,
        income_document_url: income_url,
        status: 'pending',
      })

      if (dbErr) throw dbErr
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: 'Inter,sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Application Submitted
            </h2>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              Your rental application has been received. The landlord will review it and be in touch within 2–3 business days.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.header}>
          <div style={styles.logo}>RentyApp</div>
          <div style={styles.headerSub}>Rental Application</div>
        </div>

        <div style={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={i} style={styles.progressStep}>
              <div style={{
                ...styles.progressDot,
                background: i <= step ? '#111' : '#e5e7eb',
                color: i <= step ? '#fff' : '#aaa',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{
                ...styles.progressLabel,
                color: i === step ? '#111' : '#aaa',
                fontWeight: i === step ? 600 : 400,
              }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.body}>
          {step === 0 && (
            <>
              <h3 style={styles.stepTitle}>Personal Information</h3>
              <div style={styles.row}>
                {field('First Name', 'first_name', 'text', 'John')}
                {field('Last Name', 'last_name', 'text', 'Doe')}
              </div>
              {field('Email Address', 'email', 'email', 'john@email.com')}
              {field('Phone Number', 'phone', 'tel', '(559) 000-0000')}
              {field('Date of Birth', 'dob', 'date')}
              {select('Number of Adults Moving In', 'adults', ['1','2','3','4','5+'])}
              {select('Pets', 'pets', ['No','Yes — see description'])}
              {form.pets.startsWith('Yes') && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Pet Description (type, breed, weight)</label>
                  <textarea
                    value={form.pets_desc}
                    onChange={e => set('pets_desc', e.target.value)}
                    style={{ ...styles.input, height: 72, resize: 'vertical' }}
                    placeholder="e.g. 1 dog, Labrador, 60 lbs"
                  />
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={styles.stepTitle}>Employment & Income</h3>
              {select('Employment Type', 'employment_type', ['Full-time','Part-time','Self-employed','Retired','Other'])}
              {field('Employer / Company Name', 'employer', 'text', 'Acme Inc.')}
              {field('Job Title', 'job_title', 'text', 'Manager')}
              {field('Gross Monthly Income ($)', 'monthly_income', 'number', '4000')}
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={styles.stepTitle}>Rental History</h3>
              {field('Current / Most Recent Address', 'current_address', 'text', '123 Main St, Fresno, CA')}
              {field('Current / Previous Landlord Name', 'current_landlord', 'text')}
              {field('Landlord Phone Number', 'current_landlord_phone', 'tel', '(559) 000-0000')}
              {field('How long at this address?', 'years_at_current', 'text', '2 years')}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Reason for Leaving</label>
                <textarea
                  value={form.reason_leaving}
                  onChange={e => set('reason_leaving', e.target.value)}
                  style={{ ...styles.input, height: 72, resize: 'vertical' }}
                  placeholder="Relocating, lease ending, etc."
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={styles.stepTitle}>Documents</h3>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                Upload a government-issued ID and proof of income (pay stub, bank statement, or offer letter). Both are optional but help speed up your application.
              </p>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Government-Issued ID</label>
                <label style={styles.fileLabel}>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => set('id_file', e.target.files[0])} />
                  <span style={styles.fileBtn}>{form.id_file ? `✓ ${form.id_file.name}` : '📎 Choose file'}</span>
                </label>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Proof of Income</label>
                <label style={styles.fileLabel}>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => set('income_file', e.target.files[0])} />
                  <span style={styles.fileBtn}>{form.income_file ? `✓ ${form.income_file.name}` : '📎 Choose file'}</span>
                </label>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Additional Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  style={{ ...styles.input, height: 80, resize: 'vertical' }}
                  placeholder="Anything else you'd like the landlord to know"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 style={styles.stepTitle}>Review & Submit</h3>
              <div style={styles.reviewGrid}>
                <ReviewRow label="Name" value={`${form.first_name} ${form.last_name}`} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Phone" value={form.phone} />
                <ReviewRow label="Employer" value={form.employer} />
                <ReviewRow label="Monthly Income" value={form.monthly_income ? `$${form.monthly_income}` : '—'} />
                <ReviewRow label="Current Address" value={form.current_address} />
                <ReviewRow label="Pets" value={form.pets} />
                <ReviewRow label="ID Document" value={form.id_file ? form.id_file.name : 'Not uploaded'} />
                <ReviewRow label="Income Doc" value={form.income_file ? form.income_file.name : 'Not uploaded'} />
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 16, lineHeight: 1.6 }}>
                By submitting you confirm all information is accurate. The landlord may contact you and your references to verify details.
              </p>
              {error && <div style={styles.errorBox}>{error}</div>}
            </>
          )}
        </div>

        <div style={styles.navRow}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={styles.btnBack}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && (!form.first_name || !form.email)}
              style={{ ...styles.btnNext, opacity: (step === 0 && (!form.first_name || !form.email)) ? 0.4 : 1 }}
            >
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ ...styles.btnNext, background: submitting ? '#666' : '#111' }}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '8px 0' }}>
      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, color: '#999', width: 120, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111' }}>{value || '—'}</span>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px 60px', fontFamily: 'Georgia, serif' },
  card: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' },
  header: { background: '#111', color: '#fff', padding: '20px 24px' },
  logo: { fontFamily: 'Inter,sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' },
  headerSub: { fontFamily: 'Inter,sans-serif', fontSize: 12, opacity: 0.5, marginTop: 2 },
  progress: { display: 'flex', padding: '16px 20px', gap: 0, borderBottom: '1px solid #f0f0f0', overflowX: 'auto' },
  progressStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 56, gap: 4 },
  progressDot: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, transition: 'background 0.2s' },
  progressLabel: { fontFamily: 'Inter,sans-serif', fontSize: 9, textAlign: 'center', lineHeight: 1.3, transition: 'color 0.2s' },
  body: { padding: '24px 24px 8px' },
  stepTitle: { fontFamily: 'Inter,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 18, color: '#111' },
  row: { display: 'flex', gap: 12 },
  fieldGroup: { marginBottom: 14, flex: 1 },
  label: { display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 10.5, fontWeight: 600, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: 14, color: '#111', outline: 'none', background: '#fafafa', boxSizing: 'border-box' },
  fileLabel: { display: 'block', cursor: 'pointer' },
  fileBtn: { display: 'inline-block', padding: '8px 14px', border: '1px dashed #ccc', borderRadius: 6, fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#555', background: '#fafafa' },
  reviewGrid: { display: 'flex', flexDirection: 'column' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#b91c1c', marginTop: 12 },
  navRow: { display: 'flex', alignItems: 'center', padding: '16px 24px 20px', borderTop: '1px solid #f0f0f0', gap: 10 },
  btnBack: { padding: '9px 18px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 8, fontFamily: 'Inter,sans-serif', fontSize: 13, cursor: 'pointer' },
  btnNext: { padding: '9px 22px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
