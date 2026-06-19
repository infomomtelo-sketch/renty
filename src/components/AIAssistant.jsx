// RentyApp Cloudflare Worker
// Routes: /api/ai-assistant  /api/send-email

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    // ── CORS preflight ────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── /api/ai-assistant ─────────────────────────────────
    if (path === '/api/ai-assistant' && request.method === 'POST') {
      return handleAI(request, env);
    }

    // ── /api/send-email ───────────────────────────────────
    if (path === '/api/send-email' && request.method === 'POST') {
      return handleSendEmail(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ─────────────────────────────────────────────────────────
// AI ASSISTANT
// ─────────────────────────────────────────────────────────
async function handleAI(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { message, history = [], context = {} } = body;
  if (!message) return json({ error: 'No message' }, 400);

  // Build context string from whatever data the frontend passes
  let ctx = '';
  if (context.properties?.length) {
    ctx += '\n\nPROPERTIES:\n' + context.properties.map(p =>
      `- ${p.address} (${p.city}) — ${p.bedrooms}bd/${p.bathrooms}ba`
    ).join('\n');
  }
  if (context.tenants?.length) {
    ctx += '\n\nTENANTS:\n' + context.tenants.map(t =>
      `- ${t.first_name} ${t.last_name} | ${t.email} | ${t.phone || 'no phone'} | Unit: ${t.unit || 'unassigned'}`
    ).join('\n');
  }
  if (context.leases?.length) {
    ctx += '\n\nACTIVE LEASES:\n' + context.leases.map(l =>
      `- Tenant ID ${l.tenant_id} | Rent: $${l.rent_amount}/mo | ${l.start_date} – ${l.end_date}`
    ).join('\n');
  }

  const systemPrompt =
    'You are the RentyApp AI assistant — a sharp, capable property management agent for independent landlords in California.\n\n' +

    'YOUR RULES:\n' +
    '1. Be direct. No disclaimers, no bullet lists of clarifying questions, no "I can help you with…" intros. Just do it.\n' +
    '2. When asked to draft a notice, letter, or communication — write it immediately. Full, professional, ready to use.\n' +
    '3. When asked to create a form, fillable document, or anything with e-sign — output it as a complete self-contained HTML page. Include inline CSS. Include a print button. Include signature fields drawn as <canvas> elements with JS. Do not suggest third-party tools. Do not ask for more info. Just build it with blanks for the landlord to fill in.\n' +
    '4. When drafting something to email to tenants, ALWAYS start with "Subject: …" on its own line, then the body. End with READY_TO_SEND on its own line so the app can trigger the send button.\n' +
    '5. Never say you cannot send emails, cannot create forms, cannot generate documents. The app handles delivery and rendering. You produce the content.\n' +
    '6. Use the landlord\'s real data when available. Leave blanks (___) when data is missing — never invent names or amounts.\n' +
    '7. Legal/tax advice: one sentence decline, then move on. Everything else: do it.\n' +
    '8. When you output an HTML form or document, wrap it in: FORM_START and FORM_END so the app can detect and render it correctly.\n' +
    '\nLANDLORD\'S DATA:' + (ctx || '\n(No data loaded yet — user has not added properties or tenants.)');

  // Build message array with conversation history
  const messages = [];
  for (const h of history) {
    if (h.role && h.content) messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: 'user', content: message });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) return json({ error: data }, 500);

  const text = data.content[0].text;
  const readyToSend = text.includes('READY_TO_SEND');

  // Detect embedded HTML form between FORM_START / FORM_END markers
  const formMatch = text.match(/FORM_START([\s\S]*?)FORM_END/);
  const formHtml = formMatch ? formMatch[1].trim() : null;
  const displayText = text
    .replace('READY_TO_SEND', '')
    .replace(/FORM_START[\s\S]*?FORM_END/, formHtml ? '\u{1F4C4} Form generated — tap "Open Form" to view, fill, and print.' : '')
    .trim();

  return json({ text: displayText, readyToSend, formHtml });
}

// ─────────────────────────────────────────────────────────
// SEND EMAIL via Resend
// ─────────────────────────────────────────────────────────
async function handleSendEmail(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // Accepts either:
  //   { to: "a@b.com", subject: "...", body: "..." }          ← single
  //   { recipients: [{email,name},...], subject:"...", body:"..." } ← bulk
  const { to, recipients, subject, body: emailBody } = body;

  if (!subject || !emailBody) {
    return json({ error: 'Missing subject or body' }, 400);
  }

  const targets = [];
  if (Array.isArray(recipients) && recipients.length) {
    for (const r of recipients) {
      if (r.email) targets.push({ email: r.email, name: r.name || '' });
    }
  } else if (to) {
    targets.push({ email: to });
  }

  if (!targets.length) return json({ error: 'No recipients' }, 400);

  let sent = 0;
  const errors = [];

  for (const target of targets) {
    const payload = {
      from: 'RentyApp <noreply@thejudgy.com>',
      to: [target.email],
      subject,
      text: emailBody,
      // Build a minimal HTML version
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">' +
        '<div style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px;">' +
        '<strong style="font-size:18px;">RentyApp</strong>' +
        '</div>' +
        '<div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#222;">' +
        emailBody.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') +
        '</div>' +
        '<div style="border-top:1px solid #eee;margin-top:24px;padding-top:12px;font-size:11px;color:#999;">' +
        'Sent via RentyApp · rentyapp.net' +
        '</div>' +
        '</div>',
    };

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await r.json();
    if (r.ok && result.id) {
      sent++;
    } else {
      errors.push({ email: target.email, error: result.message || JSON.stringify(result) });
    }
  }

  return json({ sent, total: targets.length, errors });
}
