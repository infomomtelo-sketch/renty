import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    // Supabase automatically reads the #access_token hash and sets the session.
    // We just need to wait for onAuthStateChange to fire, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        navigate('/dashboard', { replace: true })
      }
      if (event === 'SIGNED_OUT') {
        subscription.unsubscribe()
        navigate('/login', { replace: true })
      }
    })

    // Fallback: if session already exists (page reload after hash consumed), go straight in
    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (err) {
        setError('Authentication failed. Please try again.')
        return
      }
      if (session) {
        subscription.unsubscribe()
        navigate('/dashboard', { replace: true })
      }
    })

    // Safety timeout — if nothing happens in 5s, show error
    const timeout = setTimeout(() => {
      setError('Sign-in timed out. Please try again.')
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', gap: 16, padding: 24,
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{error}</div>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 24px', background: '#111', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}
        >
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', gap: 12, color: '#555',
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #eee',
        borderTopColor: '#111', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize: 14 }}>Signing you in…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
