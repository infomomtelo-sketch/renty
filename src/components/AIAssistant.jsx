import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const WORKER = import.meta.env.VITE_WORKER_URL || 'https://rentyapp-worker.infomomtelo.workers.dev'

// Font shared across the whole panel
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export default function AIAssistant({ properties = [], tenants = [], leases = [] }) {
  const [open, setOpen]               = useState(false)
  const [input, setInput]             = useState('')
  const [messages, setMessages]       = useState([
    { role: 'assistant', content: "Hi! I'm your Renty assistant. Ask me anything — draft a notice, check a tenant, send a reminder." }
  ])
  const [loading, setLoading]         = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [lastDraft, setLastDraft]     = useState(null)
  const [formHtml, setFormHtml]       = useState(null)
  const bottomRef = useRef(null)

  // Context comes from props — no re-fetch needed, no column mismatch
  const context = { properties, tenants, leases }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function getTenantRecipients() {
    return tenants
      .filter(t => t.email)
      .map(t => ({ email: t.email, name: `${t.first_name || ''} ${t.last_name || ''}`.trim() }))
  }

  function parseDraft(text) {
    const subjectMatch = text.match(/^Subject:\s*(.+)/im)
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Message from your landlord'
    const body = text.replace(/^Subject:.*\n?/im, '').trim()
    return { subject, body }
  }

  async function sendMessage() {
    const msg = input.trim()
    if (!msg || loading) return

    setInput('')
    setEmailStatus(null)
    setLastDraft(null)
    setFormHtml(null)

    const userMsg = { role: 'user', content: msg }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      const history = next
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .slice(-10)

      const res = await fetch(`${WORKER}/api/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg, history, context }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Worker error')

      const aiMsg = { role: 'assistant', content: data.text }
      setMessages(prev => [...prev, aiMsg])

      if (data.readyToSend) setLastDraft(parseDraft(data.text))
      if (data.formHtml)    setFormHtml(data.formHtml)

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  async function sendEmails() {
    if (!lastDraft || sendingEmail) return
    setSendingEmail(true)
    setEmailStatus(null)

    const recipients = getTenantRecipients()
    if (!recipients.length) {
      setEmailStatus({ error: 'No tenant emails found. Add emails to your tenants first.' })
      setSendingEmail(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      const res = await fetch(`${WORKER}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipients,
          subject: lastDraft.subject,
          body: lastDraft.body,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')

      setEmailStatus({ sent: data.sent, total: data.total, errors: data.errors })
      const content = data.errors?.length
        ? `Sent to ${data.sent} of ${data.total} tenants. Failed: ${data.errors.map(e => e.email).join(', ')}`
        : `Done — sent to all ${data.sent} tenant${data.sent !== 1 ? 's' : ''}.`
      setMessages(prev => [...prev, { role: 'assistant', content }])
      setLastDraft(null)

    } catch (err) {
      setEmailStatus({ error: err.message })
    } finally {
      setSendingEmail(false)
    }
  }

  const recipientCount = getTenantRecipients().length

  return (
    <>
      {/* FAB — raised above bottom nav (nav is ~56px, give 16px gap = 72px) */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="AI Assistant"
        style={{
          position: 'fixed',
          bottom: 72,       // clears the 56px bottom nav + gap
          right: 20,
          zIndex: 999,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#111',
          color: '#fff',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
        }}
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          // panel sits above the FAB — FAB bottom 72 + FAB height 48 + 8px gap = 128
          bottom: 128,
          right: 16,
          zIndex: 998,
          width: 'min(360px, calc(100vw - 32px))',
          maxHeight: '60vh',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e5e5',
          overflow: 'hidden',
          fontFamily: FONT,  // lock font for the entire panel
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: '#111',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT }}>✦ Renty AI</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1, fontFamily: FONT }}>
                {tenants.length
                  ? `${tenants.length} tenant${tenants.length !== 1 ? 's' : ''} · ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}`
                  : 'No data loaded yet'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1, fontFamily: FONT }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? '#111' : '#f3f4f6',
                  color: m.role === 'user' ? '#fff' : '#111',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: FONT,
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '12px 12px 12px 2px',
                  background: '#f3f4f6',
                  fontSize: 13,
                  color: '#888',
                }}>
                  <span style={{ animation: 'renty-pulse 1s infinite' }}>●</span>{' '}
                  <span style={{ animation: 'renty-pulse 1s infinite .2s' }}>●</span>{' '}
                  <span style={{ animation: 'renty-pulse 1s infinite .4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Send to tenants button */}
          {lastDraft && !loading && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <button
                onClick={sendEmails}
                disabled={sendingEmail}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  background: sendingEmail ? '#86efac' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: sendingEmail ? 'default' : 'pointer',
                  fontFamily: FONT,
                }}
              >
                {sendingEmail ? 'Sending…' : `📧 Send to ${recipientCount} tenant${recipientCount !== 1 ? 's' : ''}`}
              </button>
              <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4, fontFamily: FONT }}>
                Subject: {lastDraft.subject}
              </div>
            </div>
          )}

          {/* Open Form button */}
          {formHtml && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  const w = window.open('', '_blank')
                  w.document.write(formHtml)
                  w.document.close()
                }}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  background: '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                📄 Open Form — Fill &amp; Print
              </button>
            </div>
          )}

          {/* Email status */}
          {emailStatus && (
            <div style={{
              margin: '0 14px 10px',
              padding: '8px 10px',
              borderRadius: 8,
              flexShrink: 0,
              background: emailStatus.error ? '#fef2f2' : '#f0fdf4',
              color: emailStatus.error ? '#b91c1c' : '#15803d',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: FONT,
            }}>
              {emailStatus.error
                ? `⚠ ${emailStatus.error}`
                : `✓ Sent ${emailStatus.sent} of ${emailStatus.total}`}
            </div>
          )}

          {/* Input row — explicit styling so browser doesn't override */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            background: '#fff',  // ensure white behind input
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask or request anything…"
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #d1d5db',  // stronger border — visible on all backgrounds
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
                color: '#111',
                background: '#fff',             // explicit white — prevents system overrides
                WebkitAppearance: 'none',       // remove iOS default styling
                appearance: 'none',
                minWidth: 0,                    // flex item won't overflow
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.4 : 1,
                fontFamily: FONT,
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>

          {/* Hint */}
          <div style={{
            padding: '6px 12px 10px',
            fontSize: 10.5,
            color: '#bbb',
            textAlign: 'center',
            flexShrink: 0,
            fontFamily: FONT,
          }}>
            Try: "Draft a late rent notice for all tenants"
          </div>
        </div>
      )}

      <style>{`
        @keyframes renty-pulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>
    </>
  )
}
