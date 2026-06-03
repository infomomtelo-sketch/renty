import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, WORKER_URL } from '../lib/supabase'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const uid = session.user.id
    const [p, t, l, pr] = await Promise.all([
      supabase.from('properties').select('*').eq('landlord_id', uid),
      supabase.from('tenants').select('*').eq('landlord_id', uid),
      supabase.from('leases').select('*').eq('landlord_id', uid),
      supabase.from('profiles').select('*').eq('id', uid).single(),
    ])
    setProperties(p.data || [])
    setTenants(t.data || [])
    setLeases(l.data || [])
    setProfile(pr.data)
  }

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch(`${WORKER_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'trial'

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Renty</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <Link to="/properties">Properties</Link>
          <Link to="/tenants">Tenants</Link>
          <Link to="/leases">Leases</Link>
          <Link to="/leases/new">New Lease</Link>
          <Link to="/account">Account</Link>
          <button onClick={handleSignOut} style={{ padding: '0.35rem 0.75rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.85rem' }}>Sign out</button>
        </div>
      </nav>

      {!isActive && (
        <div style={{ padding: '1rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>Start your 7-day free trial</div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>Then $9/month — cancel anytime</div>
          </div>
          <button onClick={handleSubscribe} disabled={loading} style={{ padding: '0.6rem 1.2rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
            {loading ? 'Loading...' : 'Start Free Trial'}
          </button>
        </div>
      )}

      {isActive && (
        <div style={{ padding: '0.75rem 1rem', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <span style={{ color: '#2e7d32', fontWeight: '500', fontSize: '0.9rem' }}>✓ Pro plan active</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Properties', count: properties.length, link: '/properties' },
          { label: 'Tenants', count: tenants.length, link: '/tenants' },
          { label: 'Leases', count: leases.length, link: '/leases' },
        ].map(s => (
          <div key={s.label} onClick={() => navigate(s.link)} style={{ padding: '0.75rem', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{s.count}</div>
            <div style={{ color: '#666', fontSize: '0.8rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={() => navigate('/properties')} style={{ flex: 1, padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          + Add Property
        </button>
        <button onClick={() => navigate('/leases/new')} style={{ flex: 1, padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          + New Lease
        </button>
      </div>
    </div>
  )
}
