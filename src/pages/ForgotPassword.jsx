import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword, friendlyError } from '../lib/auth'

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
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)
  const [fieldError, setFieldError] = useState('')

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!email.trim()) {
      setFieldError('Email is required')
      return
    }
    
    if (!validateEmail(email)) {
      setFieldError('Please enter a valid email')
      return
    }

    setError('')
    setFieldError('')
    setLoading(true)
    
    try {
      const { data, error } = await resetPassword(email)
      
      setLoading(false)
      
      if (error) {
        setError('Could not send reset email. Please check the address and try again.')
      } else {
        setDone(true)
      }
    } catch (err) {
      setLoading(false)
      setError('Network error. Please check your connection and try again.')
    }
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <div style={styles.successIcon}>🔑</div>
            <div style={styles.successTitle}>Reset link sent</div>
            <div style={styles.successText}>
              We emailed a password reset link to{' '}
              <span style={styles.successEmail}>{email}</span>.
              Check your inbox and click the link to set a new password.
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
        <div style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </div>

        {error && <div style={styles.errorBox} role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setFieldError('')
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="you@example.com"
              required
              disabled={loading}
              aria-invalid={!!fieldError}
              aria-describedby="email-error"
              style={{
                ...styles.input,
                ...(focused ? styles.inputFocus : {}),
                ...(fieldError ? styles.inputError : {}),
              }}
            />
            {fieldError && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }} id="email-error">{fieldError}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            aria-busy={loading}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div style={styles.footer}>
          Remember your password? <Link to="/login" style={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
