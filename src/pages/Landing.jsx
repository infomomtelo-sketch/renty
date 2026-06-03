import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Renty</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '6px' }}>Log in</button>
          <button onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#000', color: '#fff', border: 'none', borderRadius: '6px' }}>Get started</button>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', margin: '0 0 1rem', lineHeight: '1.2' }}>
          Landlord Management Software That Actually Works
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          Generate lease agreements online in minutes. Manage tenants, track properties, collect rent. No complexity, no hidden fees.
        </p>
        <button onClick={() => navigate('/signup')} style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Start free today — no credit card required
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', padding: '4rem 0' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Generate Lease Agreements Online</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
            Create professional, legally structured residential lease agreements in minutes. Fill in your property details, tenant information, and lease terms — Renty generates a clean PDF you can download and sign instantly. No Word templates, no lawyers needed for standard leases. Built for California independent landlords who need a fast, reliable online lease generator without the complexity of enterprise software.
          </p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Tenant Management Made Simple</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
            Keep all your tenant records in one place. Store contact information, track which tenants are in which units, and link tenants directly to their lease agreements. Renty's landlord management software gives independent property owners a clean dashboard to manage every tenant relationship without spreadsheets or sticky notes. Built for landlords managing 1 to 20 units who want organization without overhead.
          </p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Track All Your Rental Properties</h3>
          <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
            Add all your rental units to one dashboard. Track addresses, bedrooms, bathrooms, and monthly rent for every property you own. See at a glance which units are occupied, which leases are active, and which tenants belong to which properties. Renty's property tracking gives small landlords the same organized view that big property management companies pay thousands for — at $9 a month.
          </p>
        </div>
      </div>
      <div style={{ padding: '4rem 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Trusted by Independent Landlords</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { quote: 'Generated my first lease in under 5 minutes. Way easier than Word templates.', name: 'Maria T.', location: 'Fresno, CA' },
            { quote: 'Finally a landlord tool that isn\'t overkill. I manage 3 units and this is perfect.', name: 'James R.', location: 'Clovis, CA' },
            { quote: 'The PDF lease looks professional. My tenants were impressed.', name: 'Linda K.', location: 'Fresno, CA' },
          ].map(t => (
            <div key={t.name} style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 1rem', color: '#333', lineHeight: '1.6', fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ fontWeight: '500' }}>{t.name}</div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>{t.location}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Simple pricing for independent landlords</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>No per-lease fees. No transaction fees. Just $9/month.</p>
        <div style={{ display: 'inline-block', padding: '2rem', border: '2px solid #000', borderRadius: '12px', minWidth: '280px' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Renty Pro</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>$9<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span></div>
          <div style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 1.5rem' }}>7-day free trial — cancel anytime</div>
          <ul style={{ textAlign: 'left', margin: '0 0 1.5rem', padding: '0 0 0 1.2rem', lineHeight: '2' }}>
            <li>Unlimited properties</li>
            <li>Unlimited lease agreements</li>
            <li>Professional PDF generation</li>
            <li>Tenant management</li>
            <li>No transaction fees</li>
          </ul>
          <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', marginBottom: '0.75rem' }}>
            Start free trial
          </button>
          <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: '0.75rem', background: '#fff', color: '#000', border: '1px solid #000', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
            Start free — no credit card needed
          </button>
</div>
      </div>

      <div style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid #eee', color: '#666', fontSize: '0.9rem' }}>
        <p>Renty — Simple landlord management software for independent property owners.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</a>
          <a href="mailto:support@rentyapp.net" style={{ color: '#666', textDecoration: 'none' }}>Support</a>
          <a href="mailto:support@rentyapp.net" style={{ color: '#666', textDecoration: 'none' }}>Contact</a>
        </div>
        <p>© 2026 Renty. Built for California landlords.</p>
      </div>
    </div>
  )
}

