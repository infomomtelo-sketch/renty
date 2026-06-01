import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else navigate('/dashboard')
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Create your Renty account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <button onClick={handleGoogle} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
        Continue with Google
      </button>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}
