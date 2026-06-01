import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LeaseView({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lease, setLease] = useState(null)
  const [property, setProperty] = useState(null)
  const [tenant, setTenant] = useState(null)

  useEffect(() => { fetchLease() }, [])

  async function fetchLease() {
    const { data: l } = await supabase.from('leases').select('*').eq('id', id).single()
    if (!l) return
    setLease(l)
    const [p, t] = await Promise.all([
      supabase.from('properties').select('*').eq('id', l.property_id).single(),
      supabase.from('tenants').select('*').eq('id', l.tenant_id).single(),
    ])
    setProperty(p.data)
    setTenant(t.data)
  }

  if (!lease) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Lease Details</h2>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Property</div>
            <div style={{ fontWeight: '500' }}>{property?.address}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Tenant</div>
            <div style={{ fontWeight: '500' }}>{tenant?.full_name}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Start Date</div>
            <div style={{ fontWeight: '500' }}>{lease.start_date}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>End Date</div>
            <div style={{ fontWeight: '500' }}>{lease.end_date}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Monthly Rent</div>
            <div style={{ fontWeight: '500' }}>${lease.rent_amount}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Security Deposit</div>
            <div style={{ fontWeight: '500' }}>${lease.security_deposit}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Status</div>
            <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{lease.status}</div>
          </div>
        </div>
      </div>

      {lease.pdf_url && (
        <a href={lease.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '1rem', background: '#000', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '1rem' }}>
          Download Lease PDF
        </a>
      )}
    </div>
  )
}
