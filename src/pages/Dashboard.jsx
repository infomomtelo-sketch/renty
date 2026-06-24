import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AIAssistant from '../components/AIAssistant'

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants]       = useState([])
  const [leases, setLeases]         = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!session?.user) { navigate('/login', { replace: true }); return }
    async function load() {
      const uid = session.user.id
      const [{ data: props }, { data: tens }, { data: leas }] = await Promise.all([
        supabase.from('properties').select('*').eq('landlord_id', uid),
        supabase.from('tenants').select('*').eq('landlord_id', uid),
        supabase.from('leases').select('*').eq('landlord_id', uid).eq('status', 'active'),
      ])
      setProperties(props || [])
      setTenants(tens || [])
      setLeases(leas || [])
      setLoading(false)
    }
    load()
  }, [session])

  const totalRent = leases.reduce((sum, l) => sum + (parseFloat(l.rent_amount) || 0), 0)
  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    || session?.user?.email?.split('@')[0]
    || 'Landlord'

  const stats = [
    { label: 'Properties',    value: properties.length,                icon: '🏠', route: '/properties' },
    { label: 'Tenants',       value: tenants.length,                   icon: '👤', route: '/tenants' },
    { label: 'Active Leases', value: leases.length,                    icon: '📄', route: '/leases' },
    { label: 'Monthly Rent',  value: `$${totalRent.toLocaleString()}`, icon: '💰', route: '/leases' },
  ]

  const quickActions = [
    { label: 'Add Property', icon: '🏠', route: '/properties' },
    { label: 'Add Tenant',   icon: '👤', route: '/tenants' },
    { label: 'New Lease',    icon: '📝', route: '/leases/new' },
    { label: 'Inspect',      icon: '🔍', route: '/inspect', highlight: true },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fb', fontFamily: FONT, color: '#888', fontSize: 14 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, background: '#f8f9fb', minHeight: '100vh', paddingBottom: 120 }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '20px 20px 28px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Good {getGreeting()}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{firstName} 👋</div>
            <div style={{ fontSize: 12, opacity: 0.45, marginTop: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT, marginTop: 4 }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} onClick={() => navigate(s.route)}
              style={{ background: '#fff', borderRadius: 14, padding: '16px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #eee', transition: 'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111', letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.route)}
                style={{
                  background: a.highlight ? '#111' : '#fff',
                  border: `1px solid ${a.highlight ? '#111' : '#eee'}`,
                  borderRadius: 12, padding: '14px 12px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, fontWeight: 500,
                  color: a.highlight ? '#fff' : '#111',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontFamily: FONT,
                }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tenants */}
        {tenants.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Recent Tenants</div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', overflow: 'hidden' }}>
              {tenants.slice(0, 5).map((t, i) => (
                <div key={t.id} onClick={() => navigate('/tenants')}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < Math.min(tenants.length, 5) - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    {(t.first_name?.[0] || '?').toUpperCase()}{(t.last_name?.[0] || '').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{t.first_name} {t.last_name}</div>
                    <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email || 'No email on file'}</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#ccc' }}>›</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {properties.length === 0 && tenants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '40px 20px', textAlign: 'center', border: '1px solid #eee' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🏠</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Welcome to RentyApp</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>Start by adding your first property,<br/>then add tenants and leases.</div>
            <button onClick={() => navigate('/properties')}
              style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              Add Your First Property
            </button>
          </div>
        )}

      </div>

      <AIAssistant properties={properties} tenants={tenants} leases={leases} />
    </div>
  )
}
