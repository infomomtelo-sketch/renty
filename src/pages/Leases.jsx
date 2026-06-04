import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Leases({ session }) {
  const navigate = useNavigate()
  const [leases, setLeases] = useState([])

  useEffect(() => { fetchLeases() }, [])

  async function fetchLeases() {
    const { data } = await supabase
      .from('leases')
      .select(`*, properties(address), tenants(full_name)`)
      .eq('landlord_id', session.user.id)
      .order('created_at', { ascending: false })
    setLeases(data || [])
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this lease? This cannot be undone.')) return
    await supabase.from('leases').delete().eq('id', id)
    fetchLeases()
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Leases</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
          <button onClick={() => navigate('/leases/new')} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ New Lease</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {leases.length === 0 && <p style={{ color: '#666' }}>No leases yet.</p>}
        {leases.map(l => (
          <div key={l.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            <div onClick={() => navigate(`/leases/${l.id}`)} style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{l.properties?.address}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>{l.tenants?.full_name} · {l.start_date} to {l.end_date}</div>
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
                  <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
                    PDF
                  </a>
                )}
                <button onClick={e => handleDelete(e, l.id)} style={{ padding: '0.4rem 0.8rem', background: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#c62828' }}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
