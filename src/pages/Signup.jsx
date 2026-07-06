import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, signInWithGoogle, friendlyError } from '../lib/auth'

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
    transition: 'border-color 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: '#111',
    background: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
    background: '#fff5f5',
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
    transition: 'opacity 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.25rem 0',
    color: '#ccc',
    fontSize: '0.8rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#ebebeb',
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    background: '#fff',
    color: '#333',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    transition: 'border-color 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  errorBox: {
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '0.7rem 0.875rem',
    color: '#dc2626',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
    animation: 'slideIn 0.2s ease-out',
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
  successEmail: {
    fontWeight: '600',
    color: '#111',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: '#888',
  },
  link: {
    color: '#111',
    fontWeight: '600',
    textDecoration: 'none',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#aaa',
    marginTop: '0.3rem',
  },
}

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  function validateForm() {
    const errors = {}
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!confirm) {
      errors.confirm = 'Please confirm your password'
    } else if (password !== confirm) {
      errors.confirm = 'Passwords do not match'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSignup(e) {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await signUp(email, password)
      
      if (error) {
        const friendlyMsg = friendlyError(error.message)
        setError(friendlyMsg)
      } else {
        setDone(true)
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    
    try {
      await signInWithGoogle('https://rentyapp.net/auth/callback')
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✉️</div>
            <div style={styles.successTitle}>Check your email</div>
            <div style={styles.successText}>
              We sent a confirmation link to{' '}
              <span style={styles.successEmail}>{email}</span>.
              Click the link to activate your account, then come back to sign in.
            </div>
            <Link to="/login" style={{ ...styles.btn, display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        a:hover { text-decoration: underline; }
      `}</style>
      
      <div style={styles.card}>
        <div style={styles.logo}>Renty</div>
        <div style={styles.subtitle}>Create your account — it's free</div>

        {error && <div style={styles.errorBox} role="alert">{error}</div>}

        <form onSubmit={handleSignup}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setFieldErrors(prev => ({ ...prev, email: '' }))
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@example.com"
              required
              disabled={loading}
              aria-invalid={!!fieldErrors.email}
              aria-describedby="email-error"
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocus : {}),
                ...(fieldErrors.email ? styles.inputError : {}),
              }}
            />
            {fieldErrors.email && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }} id="email-error">{fieldErrors.email}</div>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, password: '' }))
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              disabled={loading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-error"
              style={{
                ...styles.input,
                ...(focusedField === 'password' ? styles.inputFocus : {}),
                ...(fieldErrors.password ? styles.inputError : {}),
              }}
            />
            {fieldErrors.password && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }} id="password-error">{fieldErrors.password}</div>}
            <div style={styles.hint}>Minimum 6 characters</div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => {
                setConfirm(e.target.value)
                setFieldErrors(prev => ({ ...prev, confirm: '' }))
              }}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              disabled={loading}
              aria-invalid={!!fieldErrors.confirm}
              aria-describedby="confirm-error"
              style={{
                ...styles.input,
                ...(focusedField === 'confirm' ? styles.inputFocus : {}),
                ...(fieldErrors.confirm ? styles.inputError : {}),
              }}
            />
            {fieldErrors.confirm && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }} id="confirm-error">{fieldErrors.confirm}</div>}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{ ...styles.btn, ...(loading || googleLoading ? styles.btnDisabled : {}) }}
            aria-busy={loading}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          or
          <div style={styles.dividerLine} />
        </div>

        <button 
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{ ...styles.googleBtn, ...(googleLoading || loading ? styles.btnDisabled : {}) }}
          aria-busy={googleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Signing up…' : 'Continue with Google'}
        </button>

        <div style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
