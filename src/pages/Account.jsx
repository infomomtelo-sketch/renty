import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STRIPE_LINK = 'https://buy.stripe.com/3cIaEW3LYcNoeYbabQg360j'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export default function Account({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchProfile()
    // Handle return from Stripe
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      activatePro()
    }
  }, [])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(data)
  }

  async function activatePro() {
    await supabase
      .from('profiles')
      .upsert({ id: session.user.id, is_pro: true })
    window.history.replaceState({}, '', '/account')
    fetchProfile()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isPro = profile?.is_pro === true

  return (
    <div style={{ fontFamily: FONT, maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f7f8fa', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '1.25rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginBottom: '0.25rem', display: 'block' }}>← Dashboard</button>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#111' }}>Account</h1>
        </div>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Profile */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '0.875rem' }}>Email</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>{session.user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '0.875rem' }}>Member since</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>{new Date(session.user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Subscription</div>

          {isPro ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111' }}>Renty Pro</div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.15rem' }}>$9/month · Unlimited properties</div>
                </div>
                <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: '600' }}>
                  Active
                </span>
              </div>
              <div style={{ background: '#f7f8fa', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#666' }}>
                ✓ Unlimited properties<br />
                ✓ Unlimited leases & tenants<br />
                ✓ AI assistant<br />
                ✓ PDF lease generation
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111' }}>Free Plan</div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.15rem' }}>2 properties max</div>
                </div>
                <span style={{ background: '#f3f4f6', color: '#666', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: '600' }}>
                  Free
                </span>
              </div>

              {/* Upgrade card */}
              <div style={{ background: '#111', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
                  $9<span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.6)' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                  Unlimited properties · All features
                </div>
                <a
                  href={`${STRIPE_LINK}?client_reference_id=${session.user.id}&redirect_url=${encodeURIComponent('https://rentyapp.net/account?upgraded=true')}`}
                  style={{ display: 'block', background: '#fff', color: '#111', borderRadius: '10px', padding: '0.8rem', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none' }}
                >
                  Upgrade to Pro →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{ width: '100%', padding: '0.85rem', background: '#fff', border: '1px solid #eee', borderRadius: '14px', cursor: 'pointer', color: '#888', fontSize: '0.9rem', fontFamily: FONT, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          Sign out
        </button>

      </div>
    </div>
  )
}
