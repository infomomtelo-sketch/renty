import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>Renty</h1>
        <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>← Back</button>
      </div>

      <h2>Privacy Policy</h2>
      <p style={{ color: '#666' }}>Last updated: June 2, 2026</p>

      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us when you create an account, add properties, tenants, or generate lease agreements. This includes your name, email address, property addresses, and tenant information.</p>

        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve Renty, process payments through Stripe, generate lease agreement PDFs, and send you service-related emails.</p>

        <h3>3. Data Storage</h3>
        <p>Your data is stored securely using Supabase, a trusted database provider. Lease PDFs are stored in secure cloud storage. We do not sell your data to third parties.</p>

        <h3>4. Payment Information</h3>
        <p>All payment processing is handled by Stripe. Renty does not store your credit card information. Stripe's privacy policy applies to all payment data.</p>

        <h3>5. Tenant Data</h3>
        <p>You are responsible for obtaining proper consent from your tenants before entering their personal information into Renty. You agree to use tenant data only for legitimate property management purposes.</p>

        <h3>6. California Privacy Rights (CCPA)</h3>
        <p>California residents have the right to know what personal data we collect, request deletion of their data, and opt out of data selling. We do not sell personal data. To exercise your rights, contact us at support@rentyapp.net.</p>

        <h3>7. Data Deletion</h3>
        <p>You can delete your account and all associated data at any time by contacting support@rentyapp.net. We will process deletion requests within 30 days.</p>

        <h3>8. Cookies</h3>
        <p>Renty uses essential cookies only for authentication purposes. We do not use tracking or advertising cookies.</p>

        <h3>9. Contact</h3>
        <p>For privacy-related questions, contact us at <a href="mailto:support@rentyapp.net">support@rentyapp.net</a>.</p>
      </div>
    </div>
  )
}
