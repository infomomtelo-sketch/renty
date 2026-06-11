import AIAssistant from '../components/AIAssistant'
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, WORKER_URL } from '../lib/supabase'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [applications, setApplications] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const uid = session.user.id
    const [p, t, l, pr, a] = await Promise.all([
      supabase.from('properties').select('*').eq('landlord_id', uid),
      supabase.from('tenants').select('*').eq('landlord_id', uid),
      supabase.from('leases').select('*').eq('landlord_id', uid),
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('applications').select('*').eq('landlord_id', uid).eq('status', 'pending'),
    ])
    setProperties(p.data || [])
    setTenants(t.data || [])
    setLeases(l.data || [])
    setProfile(pr.data)
    setApplications(a.data || [])
  }

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch(`${WORKER_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, email: session.user.email }),
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
  const totalMonthly = leases.reduce((sum, l) => sum + (Number(l.rent_amount) || 0), 0)
  const firstName = session.user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f7f8fa', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Renty</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111', marginTop: '0.1rem' }}>{greeting}, {firstName}</div>
          </div>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.8rem', color: '#666', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* Trial banner */}
        {!isActive && (
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.4rem' }}>Free Trial</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Unlock all features</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>7 days free · then $9/month</div>
            <button onClick={handleSubscribe} disabled={loading} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        )}

        {/* Income card */}
        {isActive && totalMonthly > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Monthly Income</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>${totalMonthly.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>${(totalMonthly * 12).toLocaleString()} / year · {leases.length} active lease{leases.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Properties', count: properties.length, icon: '🏠', link: '/properties' },
            { label: 'Tenants', count: tenants.length, icon: '👤', link: '/tenants' },
            { label: 'Leases', count: leases.length, icon: '📄', link: '/leases' },
            { label: 'Applications', count: applications.length, icon: '📋', link: '/applications', alert: applications.length > 0 },
          ].map(s => (
            <div key={s.label} onClick={() => navigate(s.link)} style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              border: s.alert ? '1.5px solid #ef4444' : '1px solid #f0f0f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: s.alert ? '#ef4444' : '#111', letterSpacing: '-0.02em' }}>{s.count}</div>
              <div style={{ fontSize: '0.78rem', color: s.alert ? '#ef4444' : '#888', fontWeight: '500', marginTop: '0.1rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => navigate('/properties')} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>＋</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111' }}>Add Property</div>
            </button>
            <button onClick={() => navigate('/leases/new')} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>📝</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111' }}>New Lease</div>
            </button>
            <button onClick={() => navigate('/tenants')} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>👤</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111' }}>Add Tenant</div>
            </button>
            <button onClick={() => navigate('/account')} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>⚙️</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111' }}>Account</div>
            </button>
          </div>
        </div>

        {/* Applications alert */}
        {applications.length > 0 && (
          <div onClick={() => navigate('/applications')} style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '0.9rem' }}>📋 {applications.length} Pending Application{applications.length > 1 ? 's' : ''}</div>
              <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem' }}>Tap to review</div>
            </div>
            <div style={{ color: '#dc2626', fontSize: '1.2rem' }}>→</div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-around', padding: '0.6rem 0 0.8rem', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'Properties', link: '/properties' },
          { icon: '👤', label: 'Tenants', link: '/tenants' },
          { icon: '📄', label: 'Leases', link: '/leases' },
          { icon: '📋', label: 'Apps', link: '/applications' },
          { icon: '⚙️', label: 'Account', link: '/account' },
        ].map(n => (
          <div key={n.label} onClick={() => navigate(n.link)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '1.2rem' }}>{n.icon}</div>
            <div style={{ fontSize: '0.6rem', color: '#999', fontWeight: '500' }}>{n.label}</div>
          </div>
        ))}
      </div>

      <AIAssistant properties={properties} tenants={tenants} leases={leases} />
    </div>
  )
}
