import { useNavigate } from 'react-router-dom'
import { SUPPORT_EMAIL, getEmailLink } from '../lib/email'

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const styles = {
  page: {
    fontFamily: FONT,
    background: '#f8f9fb',
    minHeight: '100vh',
    paddingBottom: '4rem',
  },
  header: {
    background: '#111',
    color: '#fff',
    padding: '2rem 1.5rem',
    textAlign: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '1rem',
    opacity: 0.7,
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
  },
  section: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111',
    marginBottom: '1rem',
    marginTop: 0,
  },
  tutorialCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  tutorialTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 0.5rem',
  },
  tutorialDesc: {
    margin: '0 0 1rem',
    color: '#666',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  stepList: {
    margin: '1rem 0',
    paddingLeft: '1.5rem',
    color: '#555',
    lineHeight: '1.8',
  },
  stepItem: {
    marginBottom: '0.5rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#666',
    fontSize: '0.95rem',
    marginBottom: '2rem',
    fontFamily: FONT,
    transition: 'all 0.2s',
  },
}

export default function Help() {
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Help & Tutorials</h1>
        <p style={styles.headerSubtitle}>Learn how to get the most out of Renty</p>
      </div>

      <div style={styles.container}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={styles.backButton}
          onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ← Back to Home
        </button>

        {/* Getting Started */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🚀 Getting Started</h2>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>1. Set Up Your First Property</h3>
            <p style={styles.tutorialDesc}>
              Start by adding your rental property to Renty.
            </p>
            <ol style={styles.stepList}>
              <li style={styles.stepItem}>Sign in to your Renty account</li>
              <li style={styles.stepItem}>Go to "Properties" from the dashboard</li>
              <li style={styles.stepItem}>Click "Add Property"</li>
              <li style={styles.stepItem}>Fill in property details (address, type, bedrooms, etc.)</li>
              <li style={styles.stepItem}>Click "Save Property"</li>
            </ol>
          </div>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>2. Add a Tenant</h3>
            <p style={styles.tutorialDesc}>
              Register your tenants in the system.
            </p>
            <ol style={styles.stepList}>
              <li style={styles.stepItem}>Go to "Tenants" from the dashboard</li>
              <li style={styles.stepItem}>Click "Add Tenant"</li>
              <li style={styles.stepItem}>Enter tenant information (name, email, phone)</li>
              <li style={styles.stepItem}>Click "Save Tenant"</li>
            </ol>
          </div>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>3. Create a Lease Agreement</h3>
            <p style={styles.tutorialDesc}>
              Generate a professional lease in minutes.
            </p>
            <ol style={styles.stepList}>
              <li style={styles.stepItem}>Go to "Leases" and click "New Lease"</li>
              <li style={styles.stepItem}>Select your property and tenant</li>
              <li style={styles.stepItem}>Set lease terms (start date, rent amount, duration)</li>
              <li style={styles.stepItem}>Review the generated lease document</li>
              <li style={styles.stepItem}>Download as PDF or share with tenant</li>
            </ol>
          </div>
        </div>

        {/* Using AI Assistant */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🤖 Using the AI Property Manager</h2>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>Ask Your AI Assistant Anything</h3>
            <p style={styles.tutorialDesc}>
              Your personal AI has access to all your properties, tenants, and leases. Try asking:
            </p>
            <ul style={styles.stepList}>
              <li style={styles.stepItem}>"Draft a late rent notice for John in Apartment 2B"</li>
              <li style={styles.stepItem}>"How much total rent am I collecting this month?"</li>
              <li style={styles.stepItem}>"What's my average rent per property?"</li>
              <li style={styles.stepItem}>"Send a maintenance reminder to all tenants"</li>
              <li style={styles.stepItem}>"Explain California landlord-tenant law regarding deposits"</li>
            </ul>
          </div>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>Tips for Best Results</h3>
            <p style={styles.tutorialDesc}>
              Get the most out of your AI assistant:
            </p>
            <ul style={styles.stepList}>
              <li style={styles.stepItem}>Be specific: mention property names or tenant names</li>
              <li style={styles.stepItem}>Ask follow-up questions to refine responses</li>
              <li style={styles.stepItem}>Use it to draft, review, and edit communications</li>
              <li style={styles.stepItem}>Ask for calculations across your portfolio</li>
              <li style={styles.stepItem}>Get legal guidance specific to California</li>
            </ul>
          </div>
        </div>

        {/* Tracking Rent */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Tracking Rent Payments</h2>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>Mark Payments as Received</h3>
            <p style={styles.tutorialDesc}>
              Keep track of which tenants have paid their rent.
            </p>
            <ol style={styles.stepList}>
              <li style={styles.stepItem}>Go to "Leases" and select the active lease</li>
              <li style={styles.stepItem}>Find the current month in the rent payment tracker</li>
              <li style={styles.stepItem}>Click to mark as "Paid" or "Unpaid"</li>
              <li style={styles.stepItem}>Your dashboard will update automatically</li>
            </ol>
          </div>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>View Your Portfolio Summary</h3>
            <p style={styles.tutorialDesc}>
              Your dashboard shows a quick overview:
            </p>
            <ul style={styles.stepList}>
              <li style={styles.stepItem}>Total number of properties</li>
              <li style={styles.stepItem}>Total active leases</li>
              <li style={styles.stepItem}>Monthly rent expected</li>
              <li style={styles.stepItem}>Quick links to add more properties</li>
            </ul>
          </div>
        </div>

        {/* Managing Tenants */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 Tenant Management</h2>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>Accepting Tenant Applications</h3>
            <p style={styles.tutorialDesc}>
              Share a link with potential tenants so they can apply.
            </p>
            <ol style={styles.stepList}>
              <li style={styles.stepItem}>Create a property and lease</li>
              <li style={styles.stepItem}>You'll get a sharable application link</li>
              <li style={styles.stepItem}>Send it to potential tenants</li>
              <li style={styles.stepItem}>View all applications in "Applications"</li>
              <li style={styles.stepItem}>Download documents or approve tenants</li>
            </ol>
          </div>
        </div>

        {/* Troubleshooting */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 Troubleshooting</h2>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>Can't Sign In?</h3>
            <p style={styles.tutorialDesc}>
              Try the following:
            </p>
            <ul style={styles.stepList}>
              <li style={styles.stepItem}>Check that you're using the correct email</li>
              <li style={styles.stepItem}>Click "Forgot password" if you don't remember it</li>
              <li style={styles.stepItem}>Check your email for confirmation links</li>
              <li style={styles.stepItem}>
                Still stuck?
                <a
                  href={getEmailLink(
                    'support',
                    'Login Issue',
                    'I\'m having trouble signing in. My email is: '
                  )}
                  style={{ marginLeft: '0.5rem', color: '#111', fontWeight: '600', textDecoration: 'none' }}
                >
                  Contact support
                </a>
              </li>
            </ul>
          </div>

          <div style={styles.tutorialCard}>
            <h3 style={styles.tutorialTitle}>PDF Not Downloading?</h3>
            <p style={styles.tutorialDesc}>
              Try these steps:
            </p>
            <ul style={styles.stepList}>
              <li style={styles.stepItem}>Check your browser's download settings</li>
              <li style={styles.stepItem}>Try a different browser (Chrome, Firefox, Safari)</li>
              <li style={styles.stepItem}>Disable any ad blockers</li>
              <li style={styles.stepItem}>Clear your browser cache</li>
            </ul>
          </div>
        </div>

        {/* Support CTA */}
        <div style={{ background: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111', margin: '0 0 1rem' }}>
            Still need help?
          </h3>
          <p style={{ margin: '0 0 1.5rem', color: '#666' }}>
            Our support team is here to help. Send us a message and we'll get back to you within 24 hours.
          </p>
          <a
            href={getEmailLink('support', 'Help Request')}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#111',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            📧 Get Help
          </a>
        </div>
      </div>
    </div>
  )
}
