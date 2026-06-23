import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://rentyapp-worker.infomomtelo.workers.dev'

const statusColors = {
  pending: { bg: '#fff8e1', color: '#f59e0b', label: 'Pending' },
  approved: { bg: '#e8f5e9', color: '#16a34a', label: 'Approved' },
  denied: { bg: '#fce4ec', color: '#dc2626', label: 'Denied' },
}

export default function Applications({ session }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    if (session?.user) fetchApplications()
  }, [session])

  async function fetchApplications() {
    setLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*, properties(address, city, bedrooms, bathrooms, rent)')
      .eq('landlord_id', session.user.id)
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  async function getAiSummary(app) {
    setSelected(app)
    setAiSummary('')
    if (app.ai_summary) {
      setAiSummary(app.ai_summary)
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch(`${WORKER_URL}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Summarize this rental applicant for the landlord. Be concise — 3-4 sentences max. Highlight income-to-rent ratio, employment stability, and any concerns. Applicant data: ${JSON.stringify(app)}`,
          context: {},
        }),
      })
      const data = await res.json()
      const summary = data.text
      setAiSummary(summary)
      await supabase.from('applications').update({ ai_summary: summary }).eq('id', app.id)
    } catch (err) {
      setAiSummary('Could not generate summary. Try again.')
    }
    setAiLoading(false)
  }

  async function updateStatus(id, status) {
    setStatusUpdating(true)
    await supabase.from('applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    setStatusUpdating(false)
  }

  const pending = applications.filter(a => a.status === 'pending')
  const reviewed = applications.filter(a => a.status !== 'pending')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Applications</h1>
        <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Loading...</p>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f9f9f9', borderRadius: '12px', border: '1px dashed #ddd' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>No applications yet</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Share your property application link with prospective tenants.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {pending.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Needs Review
              </div>
              {pending.map(app => <AppCard key={app.id} app={app} onSelect={getAiSummary} onStatus={updateStatus} />)}
            </div>
          )}
          {reviewed.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem', marginTop: '1rem' }}>
                Reviewed
              </div>
              {reviewed.map(app => <AppCard key={app.id} app={app} onSelect={getAiSummary} onStatus={updateStatus} />)}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '420px',
          background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', zIndex: 100,
          overflowY: 'auto', padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selected.full_name}</h2>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {selected.properties?.address || 'Unknown property'}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#999', padding: '0' }}>✕</button>
          </div>

          <div style={{ background: '#000', color: '#fff', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.5rem' }}>
              🤖 AI Summary
            </div>
            {aiLoading ? (
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Analyzing applicant...</div>
            ) : aiSummary ? (
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#eee' }}>{aiSummary}</div>
            ) : (
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Generating...</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Row label="Email" value={selected.email} />
            <Row label="Phone" value={selected.phone || '—'} />
            <Row label="Current Address" value={selected.current_address || '—'} />
            <Row label="Employer" value={selected.employer || '—'} />
            <Row label="Employment" value={selected.employment_length || '—'} />
            <Row label="Monthly Income" value={selected.monthly_income ? `$${Number(selected.monthly_income).toLocaleString()}` : '—'} />
            <Row label="Move-in Date" value={selected.move_in_date || '—'} />
            <Row label="Occupants" value={selected.occupants} />
            <Row label="Pets" value={selected.pets ? (selected.pet_description || 'Yes') : 'No'} />
            {selected.message && <Row label="Message" value={selected.message} />}
          </div>

          {selected.monthly_income && selected.properties?.rent && (
            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Income-to-Rent Ratio</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {(selected.monthly_income / selected.properties.rent).toFixed(1)}x
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                {selected.monthly_income / selected.properties.rent >= 3
                  ? '✅ Meets 3x requirement'
                  : '⚠️ Below 3x requirement'}
              </div>
            </div>
          )}

          {selected.status === 'pending' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button onClick={() => updateStatus(selected.id, 'approved')} disabled={statusUpdating}
                style={{ padding: '0.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                ✓ Approve
              </button>
              <button onClick={() => updateStatus(selected.id, 'denied')} disabled={statusUpdating}
                style={{ padding: '0.75rem', background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                ✕ Deny
              </button>
            </div>
          )}
          {selected.status !== 'pending' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <StatusBadge status={selected.status} />
              <button onClick={() => updateStatus(selected.id, 'pending')}
                style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}>
                Reset to Pending
              </button>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#ccc', textAlign: 'center' }}>
            Applied {new Date(selected.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}

function AppCard({ app, onSelect, onStatus }) {
  const s = statusColors[app.status] || statusColors.pending
  return (
    <div onClick={() => onSelect(app)}
      style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div>
        <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{app.full_name}</div>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {app.properties?.address || 'Unknown property'} · {app.email}
        </div>
        {app.monthly_income && (
          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
            ${Number(app.monthly_income).toLocaleString()}/mo · {app.employer || 'No employer listed'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <StatusBadge status={app.status} />
        <div style={{ fontSize: '0.75rem', color: '#bbb' }}>
          {new Date(app.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = statusColors[status] || statusColors.pending
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
      {s.label}
    </span>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5', paddingBottom: '0.5rem' }}>
      <span style={{ color: '#999' }}>{label}</span>
      <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}
