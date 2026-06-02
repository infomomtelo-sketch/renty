import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, WORKER_URL } from '../lib/supabase'

export default function Account({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(data)
  }

  async function handleManageBilling() {
    setLoading(true)
    const res = await fetch(`${WORKER_URL}/api/billing-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: profile.stripe_customer_id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Billing portal error: ' + JSON.stringify(data))
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActive = profile?.subscription_status === 'active'
  const isTrial = profile?.subscription_status === 'trial'

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Account</h2>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Email</span>
            <span>{session.user.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Name</span>
            <span>{profile?.full_name || 'Not set'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Member since</span>
            <span>{new Date(session.user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Subscription</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '500' }}>
              {isActive ? 'Renty Pro' : isTrial ? 'Free Trial' : 'No active plan'}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              {isActive ? '$9/month' : isTrial ? 'Trial period' : 'Subscribe to unlock all features'}
            </div>
          </div>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '500',
            background: isActive ? '#e8f5e9' : isTrial ? '#fff8e1' : '#ffebee',
            color: isActive ? '#2e7d32' : isTrial ? '#f57f17' : '#c62828',
          }}>
            {isActive ? 'Active' : isTrial ? 'Trial' : 'Inactive'}
          </span>
        </div>

        {isActive && profile?.stripe_customer_id && (
          <button onClick={handleManageBilling} disabled={loading} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Manage Billing'}
          </button>
        )}

        {!isActive && (
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Start Free Trial
          </button>
        )}
      </div>

      <button onClick={handleSignOut} style={{ width: '100%', padding: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', color: '#666' }}>
        Sign out
      </button>
    </div>
  )
}
