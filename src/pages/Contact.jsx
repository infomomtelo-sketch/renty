import { useNavigate } from 'react-router-dom'
import { CONTACT_EMAIL, SUPPORT_EMAIL, getEmailLink } from '../lib/email'

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
  sectionContent: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '1rem',
  },
  contactCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: '2rem',
    minWidth: '3rem',
    textAlign: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 0.5rem',
  },
  contactText: {
    margin: 0,
    color: '#666',
    fontSize: '0.95rem',
  },
  contactLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'opacity 0.2s',
    cursor: 'pointer',
  },
  faqItem: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
  },
  faqQuestion: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 0.5rem',
  },
  faqAnswer: {
    margin: 0,
    color: '#666',
    fontSize: '0.95rem',
    lineHeight: '1.5',
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
  backButtonHover: {
    background: '#f5f5f5',
  },
}

export default function Contact() {
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Get Help & Support</h1>
        <p style={styles.headerSubtitle}>We're here to help you succeed with Renty</p>
      </div>

      <div style={styles.container}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={styles.backButton}
          onMouseOver={(e) => e.target.style.background = styles.backButtonHover.background}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ← Back to Home
        </button>

        {/* Quick Contact Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📞 Get in Touch</h2>
          <p style={styles.sectionContent}>
            Have a question or need help? Reach out to our support team. We typically respond within 24 hours.
          </p>

          <div style={styles.contactCard}>
            <div style={styles.icon}>📧</div>
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Email Support</h3>
              <p style={styles.contactText}>
                For general questions and support:
              </p>
              <a
                href={getEmailLink('support', 'Hello Renty Support')}
                style={styles.contactLink}
                onMouseOver={(e) => e.target.style.opacity = '0.7'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <div style={styles.icon}>🎯</div>
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Technical Issues</h3>
              <p style={styles.contactText}>
                Experiencing a problem? Let us know the details:
              </p>
              <a
                href={getEmailLink(
                  'support',
                  'Technical Issue Report',
                  'Please describe the issue you\'re experiencing:\n\nWhat were you trying to do?\n\nWhat happened instead?\n\nBrowser: \n\nDevice: '
                )}
                style={styles.contactLink}
                onMouseOver={(e) => e.target.style.opacity = '0.7'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Report a Bug
              </a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <div style={styles.icon}>💡</div>
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Feedback & Suggestions</h3>
              <p style={styles.contactText}>
                Have an idea to make Renty better?
              </p>
              <a
                href={getEmailLink(
                  'support',
                  'Feature Suggestion',
                  'I have a suggestion for Renty:\n\n'
                )}
                style={styles.contactLink}
                onMouseOver={(e) => e.target.style.opacity = '0.7'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Share Your Feedback
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>❓ Frequently Asked Questions</h2>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>How do I create a lease agreement?</h3>
            <p style={styles.faqAnswer}>
              Go to "Leases" from your dashboard, click "New Lease", fill in your property and tenant details, review the generated agreement, and download as PDF or share with your tenant.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Can I use the AI assistant to draft emails?</h3>
            <p style={styles.faqAnswer}>
              Yes! The AI property manager can help draft rent reminders, lease violation notices, maintenance requests, and more. Just ask it naturally in the "Inspect" section.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>How do I track rent payments?</h3>
            <p style={styles.faqAnswer}>
              In the "Leases" section, you can mark rent as paid or unpaid for each month. Your dashboard shows a summary of total monthly rent and outstanding payments.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Can I manage multiple properties?</h3>
            <p style={styles.faqAnswer}>
              Absolutely! Renty Pro supports unlimited properties. Add them in the "Properties" section and manage all tenants and leases in one place.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>How do I invite a tenant to apply?</h3>
            <p style={styles.faqAnswer}>
              Create a property and lease. You'll get a shareable link you can send to potential tenants. They can fill out their application directly through the form.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Is my data secure?</h3>
            <p style={styles.faqAnswer}>
              Yes. Renty uses Supabase for secure authentication and data encryption. Your data is encrypted in transit and at rest. See our Privacy Policy for details.
            </p>
          </div>

          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Can I cancel my subscription anytime?</h3>
            <p style={styles.faqAnswer}>
              Yes! There are no long-term contracts. You can cancel anytime from your account settings. You'll maintain access through the end of your billing period.
            </p>
          </div>
        </div>

        {/* Resources Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📚 Resources</h2>
          <div style={styles.contactCard}>
            <div style={styles.icon}>📖</div>
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Documentation</h3>
              <p style={styles.contactText}>
                Read our guides and tutorials to get the most out of Renty.
              </p>
            </div>
          </div>

          <div style={styles.contactCard}>
            <div style={styles.icon}>🔒</div>
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Privacy & Terms</h3>
              <p style={styles.contactText}>
                Learn about our privacy practices and terms of service.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <a
                  href="/privacy"
                  style={styles.contactLink}
                  onMouseOver={(e) => e.target.style.opacity = '0.7'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  Privacy Policy
                </a>
                <span style={{ color: '#ccc' }}>•</span>
                <a
                  href="/terms"
                  style={styles.contactLink}
                  onMouseOver={(e) => e.target.style.opacity = '0.7'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Section */}
        <div style={{ ...styles.section, background: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ ...styles.sectionTitle, marginTop: 0 }}>⏱️ Response Time</h3>
          <p style={styles.sectionContent}>
            <strong>Standard Support:</strong> We aim to respond to all inquiries within 24 hours during business days.
          </p>
          <p style={styles.sectionContent}>
            <strong>Account Issues:</strong> Critical account access issues are prioritized.
          </p>
          <p style={{ ...styles.sectionContent, marginBottom: 0 }}>
            <strong>Feedback:</strong> We read all feedback and use it to improve Renty!
          </p>
        </div>
      </div>
    </div>
  )
}
