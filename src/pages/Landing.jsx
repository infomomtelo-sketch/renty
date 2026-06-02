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
        <h2 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>Simple lease management for landlords</h2>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>Generate leases, manage tenants, collect rent. No complexity.</p>
        <button onClick={() => navigate('/signup')} style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Start free today
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '4rem 0' }}>
        {[
          { title: 'Generate Leases', desc: 'Create professional PDF leases in minutes' },
          { title: 'Manage Tenants', desc: 'Keep all your tenant info in one place' },
          { title: 'Track Properties', desc: 'Manage all your units from one dashboard' },
        ].map(f => (
          <div key={f.title} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{f.title}</h3>
            <p style={{ margin: 0, color: '#666' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '4rem 0', borderTop: '1px solid #eee' }}>
        <h2>Simple pricing</h2>
        <div style={{ display: 'inline-block', padding: '2rem', border: '2px solid #000', borderRadius: '12px', minWidth: '240px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>$9<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span></div>
          <ul style={{ textAlign: 'left', margin: '1rem 0', padding: '0 0 0 1.2rem' }}>
            <li>Unlimited properties</li>
            <li>Unlimited leases</li>
            <li>PDF generation</li>
            <li>Tenant management</li>
          </ul>
          <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}
