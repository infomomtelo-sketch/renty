import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AIAssistant from '../components/AIAssistant'

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser]             = useState(null)
  const [properties, setProperties] = useState([])
  const [tenants, setTenants]       = useState([])
  const [leases, setLeases]         = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      setUser(user)

      const [{ data: props }, { data: tens }, { data: leas }] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase.from('tenants').select('*').eq('user_id', user.id),
        supabase.from('leases').select('*').eq('user_id', user.id).eq('status', 'active'),
      ])

      setProperties(props || [])
      setTenants(tens || [])
      setLeases(leas || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalRent = leases.reduce((sum, l) => sum + (parseFloat(l.rent_amount) || 0), 0)

  const stats = [
    { label: 'Properties', value: properties.length, icon: '🏠', route: '/properties' },
    { label: 'Tenants',    value: tenants.length,    icon: '👤', route: '/tenants' },
    { label: 'Leases',     value: leases.length,     icon: '📄', route: '/leases' },
    { label: 'Monthly Rent', value: `$${totalRent.toLocaleString()}`, icon: '💰', route: '/leases' },
  ]

  const quickActions = [
    { label: 'Add Property', icon: '🏠', route: '/properties' },
    { label: 'Add Tenant',   icon: '👤', route: '/tenants' },
    { label: 'New Lease',    icon: '📝', route: '/leases/new' },
    { label: 'Applications', icon: '📋', route: '/applications' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FONT, color: '#888' }}>
      Loading…
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, background: '#f8f9fb', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '20px 20px 24px', color: '#fff' }}>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          Good {getGreeting()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          {user?.user_metadata?.full_name?.split(' ')[0] || 'Landlord'} 👋
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} onClick={() => navigate(s.route)}
              style={{
                background: '#fff', borderRadius: 12, padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer',
                border: '1px solid #eee',
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.route)}
                style={{
                  background: '#fff', border: '1px solid #eee', borderRadius: 10,
                  padding: '14px 12px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, fontWeight: 500, color: '#111',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  fontFamily: FONT,
                }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent tenants */}
        {tenants.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Recent Tenants
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
              {tenants.slice(0, 4).map((t, i) => (
                <div key={t.id}
                  onClick={() => navigate('/tenants')}
                  style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < Math.min(tenants.length, 4) - 1 ? '1px solid #f3f4f6' : 'none',
                    cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#111',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0,
                  }}>
                    {(t.first_name?.[0] || '?')}{(t.last_name?.[0] || '')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {t.first_name} {t.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.email || 'No email'}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: '#ccc' }}>›</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {properties.length === 0 && tenants.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 12, padding: '32px 20px',
            textAlign: 'center', border: '1px solid #eee',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>
              Welcome to RentyApp
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              Start by adding your first property
            </div>
            <button onClick={() => navigate('/properties')}
              style={{
                background: '#111', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              }}>
              Add Property
            </button>
          </div>
        )}

      </div>

      {/* AI Assistant — receives real data */}
      <AIAssistant properties={properties} tenants={tenants} leases={leases} />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
