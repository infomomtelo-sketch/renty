import { useState } from 'react'
import { WORKER_URL } from '../lib/supabase'

export default function AIAssistant({ properties, tenants, leases }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m your Renty AI assistant. Ask me anything about your properties, tenants, or leases.' }
  ])
  const [loading, setLoading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null) // { sent, total, errors }

  const context = { properties, tenants, leases }

  // Extract tenant emails from the last assistant message that looks like drafted notices
  function extractEmailsFromContext() {
    // Build a map of tenant name -> email from the tenants prop
    const emailMap = {}
    if (tenants) {
      tenants.forEach(t => {
        if (t.email) {
          const name = `${t.first_name || ''} ${t.last_name || ''}`.trim().toLowerCase()
          emailMap[name] = t.email
        }
      })
    }
    return emailMap
  }

  // Find the last assistant message and extract subject + body per tenant
  function parseLastDraft() {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant) return null

    const text = lastAssistant.text
    const emailMap = extractEmailsFromContext()

    // Try to match tenant names in the draft to their emails
    const drafts = []
    for (const [name, email] of Object.entries(emailMap)) {
      // Check if this tenant appears in the draft
      const firstName = name.split(' ')[0]
      if (text.toLowerCase().includes(firstName.toLowerCase())) {
        // Extract subject line if present
        const subjectMatch = text.match(/Subject:\s*(.+)/i)
        const subject = subjectMatch ? subjectMatch[1].trim() : 'Message from your landlord'
        drafts.push({ email, subject, body: text })
      }
    }

    // Fallback: if no tenant name matched but we have tenants with emails, send to all
    if (drafts.length === 0 && Object.keys(emailMap).length > 0) {
      const subjectMatch = text.match(/Subject:\s*(.+)/i)
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Message from your landlord'
      for (const email of Object.values(emailMap)) {
        drafts.push({ email, subject, body: text })
      }
    }

    return drafts.length > 0 ? drafts : null
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setEmailStatus(null)
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const token = localStorage.getItem('sb-token') || sessionStorage.getItem('sb-token')
      const res = await fetch(`${WORKER_URL}/api/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg, context }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.text }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong. Try again.' }])
    }
    setLoading(false)
  }

  async function handleSendEmails() {
    const drafts = parseLastDraft()
    if (!drafts || drafts.length === 0) {
      setEmailStatus({ error: 'No tenant emails found. Make sure tenants have email addresses saved.' })
      return
    }

    setSendingEmail(true)
    setEmailStatus(null)

    try {
      const token = localStorage.getItem('sb-token') || sessionStorage.getItem('sb-token')

      const res = await fetch(`${WORKER_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: drafts.map(d => d.email),
          subject: drafts[0].subject,
          body: drafts[0].body,
        }),
      })

      const data = await res.json()
      setEmailStatus({ sent: data.sent, total: data.total, results: data.results })
    } catch (err) {
      setEmailStatus({ error: 'Failed to send. Check your connection and try again.' })
    }

    setSendingEmail(false)
  }

  // Show send button if the last message is from assistant and looks like a draft
  const lastMsg = messages[messages.length - 1]
  const showSendButton = !loading && lastMsg?.role === 'assistant' &&
    (lastMsg.text.toLowerCase().includes('subject:') ||
     lastMsg.text.toLowerCase().includes('invoice') ||
     lastMsg.text.toLowerCase().includes('notice') ||
     lastMsg.text.toLowerCase().includes('reminder'))

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

          {/* Send Email Button — appears after a draft */}
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
                {sendingEmail ? 'Sending...' : '📧 Send to Tenants'}
              </button>
              {emailStatus && (
                <div style={{
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
