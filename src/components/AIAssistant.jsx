import { useState } from 'react'
import { WORKER_URL } from '../lib/supabase'

export default function AIAssistant({ properties, tenants, leases }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m your Renty AI assistant. Ask me anything about your properties, tenants, or leases.' }
  ])
  const [loading, setLoading] = useState(false)

  const context = { properties, tenants, leases }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`${WORKER_URL}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.text }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong. Try again.' }])
    }
    setLoading(false)
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
          maxHeight: '480px',
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
            Try: "Draft a rent reminder for Frank Lopez"
          </div>
        </div>
      )}
    </>
  )
}
