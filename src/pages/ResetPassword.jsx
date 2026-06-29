import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f9f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid #ebebeb',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: '#111',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#888',
    marginBottom: '2rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#444',
    marginBottom: '0.35rem',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.875rem',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    fontSize: '0.95rem',
    color: '#111',
    background: '#fafafa',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputFocus: {
    borderColor: '#111',
    background: '#fff',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  btn: {
    width: '100%',
    padding: '0.8rem',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'opacity 0.15s',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorBox: {
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '0.7rem 0.875rem',
    color: '#dc2626',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  successBox: {
    textAlign: 'center',
    padding: '1rem 0',
  },
  successIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  successTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111',
    marginBottom: '0.5rem',
  },
  successText: {
    fontSize: '0.875rem',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#aaa',
    marginTop: '0.3rem',
  },
  invalidBox: {
    textAlign: 'center',
    padding: '1rem 0',
  },
  link: {
    color: '#111',
    fontWeight: '600',
    textDecoration: 'none',
  },
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(null) // null=checking, true, false
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    // Supabase exchanges the token from the URL hash and fires PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setValidSession(true)
      }
    })

    // Also check if there's already a valid session (e.g. page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
    })

    const timeout = setTimeout(() => {
      setValidSession(prev => prev === null ? false : prev)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('Could not update password. Please request a new reset link.')
    } else {
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    }
  }

  // Still detecting session
  if (validSession === null) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888', fontSize: '0.9rem' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid #eee',
              borderTopColor: '#111', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 1rem',
            }} />
            Verifying your reset link…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    )
  }

  // Invalid / expired link
  if (validSession === false) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.invalidBox}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111', marginBottom: '0.5rem' }}>
              Link expired or invalid
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              This reset link has expired or already been used. Request a new one.
            </div>
            <Link to="/forgot-password" style={{ ...styles.btn, display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Password updated successfully
  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <div style={styles.successTitle}>Password updated</div>
            <div style={styles.successText}>
              Your password has been changed. Taking you to your dashboard…
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Renty</div>
        <div style={styles.subtitle}>Choose a new password for your account.</div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleReset}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              style={{ ...styles.input, ...(focusedField === 'password' ? styles.inputFocus : {}) }}
            />
            <div style={styles.hint}>Minimum 6 characters</div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              style={{ ...styles.input, ...(focusedField === 'confirm' ? styles.inputFocus : {}) }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
