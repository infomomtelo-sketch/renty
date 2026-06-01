import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const uid = session.user.id
    const [p, t, l] = await Promise.all([
      supabase.from('properties').select('*').eq('landlord_id', uid),
      supabase.from('tenants').select('*').eq('landlord_id', uid),
      supabase.from('leases').select('*').eq('landlord_id', uid),
    ])
    setProperties(p.data || [])
    setTenants(t.data || [])
    setLeases(l.data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Renty</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/properties">Properties</Link>
          <Link to="/tenants">Tenants</Link>
          <Link to="/leases/new">New Lease</Link>
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Properties', count: properties.length, link: '/properties' },
          { label: 'Tenants', count: tenants.length, link: '/tenants' },
          { label: 'Leases', count: leases.length, link: '/leases/new' },
        ].map(s => (
          <div key={s.label} onClick={() => navigate(s.link)} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{s.count}</div>
            <div style={{ color: '#666' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={() => navigate('/properties')} style={{ flex: 1, padding: '1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
          + Add Property
        </button>
        <button onClick={() => navigate('/leases/new')} style={{ flex: 1, padding: '1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
          + New Lease
        </button>
      </div>
    </div>
  )
}
