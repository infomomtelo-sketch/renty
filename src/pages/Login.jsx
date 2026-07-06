import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle, friendlyError } from '../lib/auth'

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
  forgotLink: {
    display: 'block',
    textAlign: 'right',
    fontSize: '0.78rem',
    color: '#888',
    textDecoration: 'none',
    marginTop: '0.4rem',
    transition: 'color 0.15s',
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
  warningBox: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '0.7rem 0.875rem',
    color: '#92400e',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
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
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [attemptCount, setAttemptCount] = useState(0)

  useEffect(() => {
    // Clear attempts after 15 minutes
    const timer = setTimeout(() => setAttemptCount(0), 15 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [attemptCount])

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
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleLogin(e) {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (attemptCount >= 5) {
      setWarning('Too many failed attempts. Please try again in 15 minutes or use the forgot password link.')
      return
    }

    setLoading(true)
    setError('')
    setWarning('')
    
    try {
      const { data, error } = await signInWithEmail(email, password)
      
      if (error) {
        const friendlyMsg = friendlyError(error.message)
        setError(friendlyMsg)
        setAttemptCount(prev => prev + 1)
        
        // Log attempt for security monitoring
        if (attemptCount >= 4) {
          setWarning('One more failed attempt and you\'ll be temporarily locked out.')
        }
      } else {
        // Reset attempts on success
        setAttemptCount(0)
        navigate('/dashboard')
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
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
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
        <div style={styles.subtitle}>Welcome back — sign in to continue</div>

        {error && <div style={styles.errorBox} role="alert">{error}</div>}
        {warning && <div style={styles.warningBox} role="alert">{warning}</div>}

        <form onSubmit={handleLogin}>
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
            <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{ ...styles.btn, ...(loading || googleLoading ? styles.btnDisabled : {}) }}
            aria-busy={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
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
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div style={styles.footer}>
          No account? <Link to="/signup" style={styles.link}>Sign up</Link>
        </div>
      </div>
    </div>
  )
}
