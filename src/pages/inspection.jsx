import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const WORKER = import.meta.env.VITE_WORKER_URL || 'https://rentyapp-worker.infomomtelo.workers.dev'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const ROOMS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Exterior', 'Garage', 'Other']

const SEVERITY_COLOR = { Good: '#16a34a', Fair: '#d97706', Poor: '#dc2626' }
const SEVERITY_BG    = { Good: '#f0fdf4', Fair: '#fffbeb', Poor: '#fef2f2' }

export default function Inspection({ session }) {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [photos, setPhotos]       = useState([]) // { file, preview, room, analysis }
  const [room, setRoom]           = useState('Living Room')
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport]       = useState(null)
  const [address, setAddress]     = useState('')
  const [step, setStep]           = useState('capture') // capture | review | report

  // ── Add photos ───────────────────────────────────────
  function handleFiles(files) {
    const arr = Array.from(files).slice(0, 10 - photos.length)
    arr.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          base64: e.target.result.split(',')[1],
          mimeType: file.type,
          room,
          analysis: null,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(id) {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  // ── Analyze all photos ───────────────────────────────
  async function analyzePhotos() {
    if (!photos.length) return
    setAnalyzing(true)

    try {
      // Build one prompt per photo via Worker
      const analyzed = await Promise.all(photos.map(async (photo) => {
        const prompt = `You are a professional home inspector analyzing a photo of the ${photo.room}.

Identify any issues, defects, or notable conditions visible in this photo.

Return ONLY valid JSON (no markdown):
{
  "room": "${photo.room}",
  "condition": "Good|Fair|Poor",
  "findings": [
    {"issue": "Issue name", "severity": "Minor|Moderate|Major", "detail": "1-2 sentence description"}
  ],
  "summary": "1 sentence overall condition summary for this room/area"
}

If no issues found, return findings as empty array and condition as "Good".`

        const res = await fetch(`${WORKER}/api/inspect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            image: photo.base64,
            mimeType: photo.mimeType,
          })
        })

        if (!res.ok) throw new Error('Analysis failed')
        const data = await res.json()

        let result = null
        try {
          const clean = (data.text || '').replace(/```json|```/g, '').trim()
          const start = clean.indexOf('{')
          const end   = clean.lastIndexOf('}')
          result = JSON.parse(clean.slice(start, end + 1))
        } catch {
          result = { room: photo.room, condition: 'Fair', findings: [], summary: 'Could not parse analysis.' }
        }

        return { ...photo, analysis: result }
      }))

      setPhotos(analyzed)

      // Build overall report
      const allFindings = analyzed.flatMap(p => (p.analysis?.findings || []).map(f => ({ ...f, room: p.room })))
      const conditions  = analyzed.map(p => p.analysis?.condition).filter(Boolean)
      const overall     = conditions.includes('Poor') ? 'Poor' : conditions.includes('Fair') ? 'Fair' : 'Good'
      const majorCount  = allFindings.filter(f => f.severity === 'Major').length
      const modCount    = allFindings.filter(f => f.severity === 'Moderate').length

      setReport({
        address: address || 'Property',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        overall,
        photoCount: analyzed.length,
        findings: allFindings,
        majorCount,
        modCount,
        rooms: analyzed,
      })

      setStep('report')
    } catch (err) {
      alert('Analysis failed. Check your connection and try again.')
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Print report ─────────────────────────────────────
  function printReport() {
    window.print()
  }

  // ── RENDER ────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, background: '#f8f9fb', minHeight: '100vh', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => step === 'report' ? setStep('capture') : navigate('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>
            {step === 'report' ? 'Inspection Report' : 'Property Inspection'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 }}>
            {step === 'capture' ? 'AI-powered photo analysis' : step === 'report' ? report?.date : 'Review photos'}
          </div>
        </div>
      </div>

      {/* STEP: CAPTURE */}
      {step === 'capture' && (
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Address */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Property Address
            </div>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, Fresno CA"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #e5e5e5', fontSize: 14, fontFamily: FONT,
                outline: 'none', color: '#111', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Room selector */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              Room / Area
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROOMS.map(r => (
                <button key={r} onClick={() => setRoom(r)}
                  style={{
                    padding: '7px 14px', borderRadius: 99, fontSize: 13, fontFamily: FONT,
                    fontWeight: 500, cursor: 'pointer', border: '1.5px solid',
                    borderColor: room === r ? '#111' : '#e5e5e5',
                    background: room === r ? '#111' : '#fff',
                    color: room === r ? '#fff' : '#555',
                    transition: 'all 0.15s',
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            style={{
              border: '2px dashed #d1d5db', borderRadius: 14, padding: '32px 20px',
              textAlign: 'center', cursor: 'pointer', background: '#fff',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>
              Add Photos
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              Tap to capture or upload · {10 - photos.length} remaining
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={e => handleFiles(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                Photos ({photos.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#eee' }}>
                    <img src={p.preview} alt={p.room} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.6)', padding: '4px 6px',
                      fontSize: 10, color: '#fff', fontWeight: 500,
                    }}>
                      {p.room}
                    </div>
                    <button onClick={() => removePhoto(p.id)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                        width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze button */}
          {photos.length > 0 && (
            <button onClick={analyzePhotos} disabled={analyzing}
              style={{
                width: '100%', padding: '15px 0',
                background: analyzing ? '#555' : '#111',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: analyzing ? 'default' : 'pointer',
                fontFamily: FONT, letterSpacing: -0.2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {analyzing ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'renty-spin 0.8s linear infinite', fontSize: 16 }}>⟳</span>
                  Analyzing {photos.length} photo{photos.length !== 1 ? 's' : ''}…
                </>
              ) : `✦ Analyze ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* STEP: REPORT */}
      {step === 'report' && report && (
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Overall score card */}
          <div style={{
            background: SEVERITY_BG[report.overall], border: `1.5px solid`,
            borderColor: SEVERITY_COLOR[report.overall],
            borderRadius: 14, padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: SEVERITY_COLOR[report.overall], letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              Overall Condition
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: SEVERITY_COLOR[report.overall], letterSpacing: -1, marginBottom: 4 }}>
              {report.overall}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {report.address} · {report.photoCount} photo{report.photoCount !== 1 ? 's' : ''} analyzed
            </div>
            {(report.majorCount > 0 || report.modCount > 0) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {report.majorCount > 0 && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                    {report.majorCount} Major
                  </span>
                )}
                {report.modCount > 0 && (
                  <span style={{ background: '#fffbeb', color: '#d97706', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                    {report.modCount} Moderate
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Per-room breakdown */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Room by Room
          </div>

          {report.rooms.map((photo, i) => {
            const a = photo.analysis
            if (!a) return null
            return (
              <div key={photo.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', overflow: 'hidden' }}>
                {/* Room header */}
                <div style={{ display: 'flex', gap: 12, padding: 14, alignItems: 'center' }}>
                  <img src={photo.preview} alt={photo.room} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 3 }}>{a.room}</div>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{a.summary}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: SEVERITY_BG[a.condition], color: SEVERITY_COLOR[a.condition],
                    flexShrink: 0,
                  }}>
                    {a.condition}
                  </span>
                </div>

                {/* Findings */}
                {a.findings?.length > 0 && (
                  <div style={{ borderTop: '1px solid #f3f4f6' }}>
                    {a.findings.map((f, j) => (
                      <div key={j} style={{
                        padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                        borderBottom: j < a.findings.length - 1 ? '1px solid #f9fafb' : 'none',
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                          background: f.severity === 'Major' ? '#fef2f2' : f.severity === 'Moderate' ? '#fffbeb' : '#f0fdf4',
                          color: f.severity === 'Major' ? '#dc2626' : f.severity === 'Moderate' ? '#d97706' : '#16a34a',
                          flexShrink: 0, marginTop: 1,
                        }}>
                          {f.severity}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{f.issue}</div>
                          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {a.findings?.length === 0 && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #f3f4f6', fontSize: 13, color: '#16a34a' }}>
                    ✓ No issues found
                  </div>
                )}
              </div>
            )
          })}

          {/* All findings summary */}
          {report.findings.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                All Findings ({report.findings.length})
              </div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', overflow: 'hidden' }}>
                {report.findings.map((f, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                    borderBottom: i < report.findings.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                      background: f.severity === 'Major' ? '#fef2f2' : f.severity === 'Moderate' ? '#fffbeb' : '#f0fdf4',
                      color: f.severity === 'Major' ? '#dc2626' : f.severity === 'Moderate' ? '#d97706' : '#16a34a',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {f.severity}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>{f.room}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{f.issue}</div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={printReport}
              style={{
                width: '100%', padding: '14px 0', background: '#111', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}>
              🖨 Print / Save as PDF
            </button>
            <button onClick={() => { setPhotos([]); setReport(null); setAddress(''); setStep('capture') }}
              style={{
                width: '100%', padding: '14px 0', background: '#fff', color: '#111',
                border: '1.5px solid #e5e5e5', borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT,
              }}>
              + New Inspection
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes renty-spin { to { transform: rotate(360deg); } }
        @media print {
          button { display: none !important; }
          nav, header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
