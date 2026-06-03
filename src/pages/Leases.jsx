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

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Leases</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
          <button onClick={() => navigate('/leases/new')} style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ New Lease</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {leases.length === 0 && <p style={{ color: '#666' }}>No leases yet.</p>}
        {leases.map(l => (
          <div key={l.id} onClick={() => navigate(`/leases/${l.id}`)} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{l.properties?.address}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{l.tenants?.full_name} · {l.start_date} to {l.end_date}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 'bold' }}>${l.rent_amount}/mo</div>
              {l.pdf_url && (
                <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ padding: '0.4rem 0.8rem', background: '#000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
                  PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
