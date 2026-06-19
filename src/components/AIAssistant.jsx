import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const WORKER = import.meta.env.VITE_WORKER_URL || 'https://rentyapp-worker.infomomtelo.workers.dev'

export default function AIAssistant() {
  const [open, setOpen]               = useState(false)
  const [input, setInput]             = useState('')
  const [messages, setMessages]       = useState([
    { role: 'assistant', content: "Hi! I'm your Renty assistant. Ask me anything — draft a notice, check a tenant, send a reminder." }
  ])
  const [loading, setLoading]         = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [lastDraft, setLastDraft]     = useState(null) // { subject, body }
  const [context, setContext]         = useState({})
  const bottomRef = useRef(null)

  // ── Load landlord context once on open ────────────────
  useEffect(() => {
    if (!open) return
    loadContext()
  }, [open])

  async function loadContext() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const uid = session.user.id

    const [{ data: properties }, { data: tenants }, { data: leases }] = await Promise.all([
      supabase.from('properties').select('*').eq('user_id', uid),
      supabase.from('tenants').select('*').eq('user_id', uid),
      supabase.from('leases').select('*').eq('user_id', uid).eq('status', 'active'),
    ])

    setContext({ properties: properties || [], tenants: tenants || [], leases: leases || [] })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Derive tenant emails from context ────────────────
  function getTenantRecipients() {
    return (context.tenants || [])
      .filter(t => t.email)
      .map(t => ({ email: t.email, name: `${t.first_name} ${t.last_name}` }))
  }

  // ── Parse subject + body from AI draft ───────────────
  function parseDraft(text) {
    const subjectMatch = text.match(/^Subject:\s*(.+)/im)
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Message from your landlord'
    // Body = everything after the Subject: line
    const body = text.replace(/^Subject:.*\n?/im, '').trim()
    return { subject, body }
  }

  // ── Send message to AI ─────────────────────────────
  async function sendMessage() {
    const msg = input.trim()
    if (!msg || loading) return

    setInput('')
    setEmailStatus(null)
    setLastDraft(null)

    const userMsg = { role: 'user', content: msg }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      // Build history for multi-turn (exclude the opening system message)
      const history = next
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1) // exclude the message we just added (it goes as `message`)
        .slice(-10)   // keep last 10 turns for context window

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

      if (data.readyToSend) {
        setLastDraft(parseDraft(data.text))
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Send emails to all tenants ─────────────────────
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
      if (data.errors?.length) {
        const failed = data.errors.map(e => e.email).join(', ')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sent to ${data.sent} of ${data.total} tenants. Failed: ${failed}`,
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Done — sent to all ${data.sent} tenant${data.sent !== 1 ? 's' : ''}.`,
        }])
      }
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
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#111', color: '#fff', border: 'none',
          fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="AI Assistant"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 144, right: 16, zIndex: 998,
          width: 'min(360px, calc(100vw - 32px))',
          maxHeight: '65vh',
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #e5e5e5',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 16px', background: '#111', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>✦ Renty AI</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>
                {context.tenants?.length
                  ? `${context.tenants.length} tenants · ${context.properties?.length || 0} properties`
                  : 'Loading your data…'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? '#111' : '#f3f4f6',
                  color: m.role === 'user' ? '#fff' : '#111',
                  fontSize: 13, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '8px 14px', borderRadius: '12px 12px 12px 2px',
                  background: '#f3f4f6', fontSize: 13, color: '#888',
                }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>●</span>{' '}
                  <span style={{ animation: 'pulse 1s infinite .2s' }}>●</span>{' '}
                  <span style={{ animation: 'pulse 1s infinite .4s' }}>●</span>
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
                  width: '100%', padding: '9px 0',
                  background: sendingEmail ? '#86efac' : '#16a34a',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: sendingEmail ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {sendingEmail
                  ? 'Sending…'
                  : `📧 Send to ${recipientCount} tenant${recipientCount !== 1 ? 's' : ''}`}
              </button>
              <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4 }}>
                Subject: {lastDraft.subject}
              </div>
            </div>
          )}

          {/* Email status */}
          {emailStatus && (
            <div style={{
              margin: '0 14px 10px', padding: '8px 10px', borderRadius: 8, flexShrink: 0,
              background: emailStatus.error ? '#fef2f2' : '#f0fdf4',
              color: emailStatus.error ? '#b91c1c' : '#15803d',
              fontSize: 12, fontWeight: 500,
            }}>
              {emailStatus.error
                ? `⚠ ${emailStatus.error}`
                : `✓ Sent ${emailStatus.sent} of ${emailStatus.total}`}
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid #eee',
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask or request anything…"
              disabled={loading}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8,
                border: '1px solid #ddd', fontSize: 13, outline: 'none',
                background: loading ? '#f9f9f9' : '#fff',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px', background: '#111', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >
              ↑
            </button>
          </div>

          {/* Hint */}
          <div style={{
            padding: '6px 12px 10px', fontSize: 10.5, color: '#bbb', textAlign: 'center', flexShrink: 0,
          }}>
            Try: "Send a late rent notice to all tenants"
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
