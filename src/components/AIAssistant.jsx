import { useState } from 'react'
import { WORKER_URL, supabase } from '../lib/supabase'

export default function AIAssistant({ properties, tenants, leases }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m your Renty AI assistant. Ask me anything about your properties, tenants, or leases.' }
  ])
  const [loading, setLoading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [showSendButton, setShowSendButton] = useState(false)

  const context = { properties, tenants, leases }

  function getTenantEmails() {
    if (!tenants) return []
    return tenants.filter(t => t.email).map(t => t.email)
  }

  function getSubjectFromText(text) {
    const match = text.match(/Subject:\s*(.+)/i)
    return match ? match[1].trim() : 'Message from your landlord'
  }

  function looksLikeDraft(text) {
    const lower = text.toLowerCase()
    return (
      lower.includes('subject:') ||
      lower.includes('dear ') ||
      lower.includes('invoice') ||
      lower.includes('inspection') ||
      lower.includes('rent due') ||
      lower.includes('notice') ||
      lower.includes('reminder')
    )
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setEmailStatus(null)
    setShowSendButton(false)

    const updatedMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(updatedMessages)
    setLoading(true)

    // Build conversation history for the API (exclude the initial greeting)
    const history = updatedMessages
      .slice(1) // skip the initial assistant greeting
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

    try {
      const token = await getToken()
      const res = await fetch(`${WORKER_URL}/api/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg, context, history }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.text }])
      if (data.readyToSend || looksLikeDraft(data.text)) {
        setShowSendButton(true)
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong. Try again.' }])
    }
    setLoading(false)
  }

  async function handleSendEmails() {
    const emails = getTenantEmails()
    if (emails.length === 0) {
      setEmailStatus({ error: 'No tenant emails found. Add emails to your tenant profiles first.' })
      return
    }

    setSendingEmail(true)
    setEmailStatus(null)

    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    const body = lastAssistant?.text || ''
    const subject = getSubjectFromText(body)

    try {
      const token = await getToken()
      const res = await fetch(`${WORKER_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: emails, subject, body }),
      })

      const data = await res.json()
      setEmailStatus({ sent: data.sent, total: data.total })
      setShowSendButton(false)
    } catch (err) {
      setEmailStatus({ error: 'Failed to send. Try again.' })
    }

    setSendingEmail(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#000',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1.5rem',
          width: '320px',
          maxHeight: '520px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          border: '1px solid #eee',
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee', fontWeight: '600', fontSize: '0.95rem', background: '#000', color: '#fff', borderRadius: '12px 12px 0 0' }}>
            🤖 Renty AI Assistant
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                background: m.role === 'user' ? '#000' : '#f5f5f5',
                color: m.role === 'user' ? '#fff' : '#333',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', background: '#f5f5f5', color: '#666', alignSelf: 'flex-start' }}>
                Thinking...
              </div>
            )}
          </div>

          {showSendButton && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={handleSendEmails}
                disabled={sendingEmail}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: sendingEmail ? '#666' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sendingEmail ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}
              >
                {sendingEmail ? 'Sending...' : `📧 Send to Tenants (${getTenantEmails().length})`}
              </button>
            </div>
          )}

          {emailStatus && (
            <div style={{
              margin: '0 1rem 0.75rem',
              fontSize: '0.78rem',
              padding: '0.5rem',
              borderRadius: '6px',
              background: emailStatus.error ? '#fee2e2' : '#dcfce7',
              color: emailStatus.error ? '#b91c1c' : '#15803d',
            }}>
              {emailStatus.error
                ? `⚠️ ${emailStatus.error}`
                : `✅ Sent ${emailStatus.sent} of ${emailStatus.total} emails`
              }
            </div>
          )}

          <div style={{ padding: '0.75rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your properties..."
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', outline: 'none' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ padding: '0.5rem 0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Send
            </button>
          </div>

          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
            Try: "Send tenants a June invoice"
          </div>
        </div>
      )}
    </>
  )
}