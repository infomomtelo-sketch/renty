export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const url = new URL(request.url)
    const path = url.pathname
    let response

    try {
      if (path === '/api/health') {
        response = Response.json({ status: 'ok' })
      }
      else if (path === '/api/checkout' && request.method === 'POST') {
        response = await handleCheckout(request, env)
      }
      else if (path === '/api/billing-portal' && request.method === 'POST') {
        response = await handleBillingPortal(request, env)
      }
      else if (path === '/api/webhooks/stripe' && request.method === 'POST') {
        response = await handleStripeWebhook(request, env)
      }
      else if (path === '/api/auth/user' && request.method === 'GET') {
        response = await handleGetUser(request, env)
      }
      else if (path === '/api/assistant' && request.method === 'POST') {
        response = await handleAssistant(request, env)
      }
      else if (path === '/api/send-email' && request.method === 'POST') {
        response = await handleSendEmail(request, env)
      }
      else {
        response = Response.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (err) {
      response = Response.json({ error: err.message }, { status: 500 })
    }

    const headers = new Headers(response.headers)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

async function handleSendEmail(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Missing token' }, { status: 401 })

  const { to, subject, body } = await request.json()

  if (!to || !subject || !body) {
    return Response.json({ error: 'to, subject, and body are required' }, { status: 400 })
  }

  const recipients = Array.isArray(to) ? to : [to]
  const results = []

  for (const email of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Renty <contact@rentyapp.net>',
        to: email,
        subject: subject,
        text: body,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#222;">
          <img src="https://rentyapp.net/logo.png" alt="Renty" style="height:32px;margin-bottom:24px;" onerror="this.style.display='none'" />
          <div style="white-space:pre-line;line-height:1.6;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#999;">Sent via Renty · rentyapp.net</p>
        </div>`,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      results.push({ email, success: false, error: data.message || 'Failed to send' })
    } else {
      results.push({ email, success: true, id: data.id })
    }
  }

  const allSuccess = results.every(r => r.success)
  const anySuccess = results.some(r => r.success)

  return Response.json(
    { results, sent: results.filter(r => r.success).length, total: results.length },
    { status: allSuccess ? 200 : anySuccess ? 207 : 500 }
  )
}

async function handleGetUser(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Missing token' }, { status: 401 })

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

async function handleCheckout(request, env) {
  const { userId, email } = await request.json()
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const params = new URLSearchParams({
    'mode': 'subscription',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'subscription_data[trial_period_days]': '7',
    'client_reference_id': userId,
    'success_url': 'https://rentyapp.net/dashboard?success=true',
    'cancel_url': 'https://rentyapp.net/pricing',
  })

  if (email) params.set('customer_email', email)

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()
  return Response.json(data, { status: res.status })
}

async function handleBillingPortal(request, env) {
  const { customerId } = await request.json()
  if (!customerId) return Response.json({ error: 'customerId required' }, { status: 400 })

  const params = new URLSearchParams({
    'customer': customerId,
    'return_url': 'https://rentyapp.net/account',
  })

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()
  return Response.json(data, { status: res.status })
}

async function handleStripeWebhook(request, env) {
  const body = await request.text()
  const event = JSON.parse(body)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.client_reference_id
      const customerId = session.customer

      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripe_customer_id: customerId,
          subscription_status: 'active',
        }),
      })
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer

      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${customerId}`, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_status: 'canceled' }),
      })
      break
    }
  }

  return Response.json({ received: true })
}

async function handleAssistant(request, env) {
  const { message, context } = await request.json()

  const systemPrompt = `You are Renty AI — a helpful property management assistant for independent landlords.

You have access to this landlord's data:
${JSON.stringify(context, null, 2)}

Help them manage their properties, tenants, and leases. You can:
- Draft rent invoices, reminders, and notices
- Write lease violation notices
- Draft inspection notices
- Send emails to tenants (the app will handle actual delivery)
- Calculate income and expenses
- Answer questions about their tenants and leases
- Generate professional landlord communications
- Provide California rental law guidance

IMPORTANT — When asked to send or draft any communication to tenants:
1. Always draft the full message with a clear Subject: line first
2. Format it professionally with the tenant name, property, and relevant details
3. End your response with exactly this line so the app can trigger sending:
   READY_TO_SEND
4. Never say you cannot send emails — the app handles delivery, you just draft the message

Always be professional, concise, and helpful.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    return Response.json({ error: data }, { status: 500 })
  }

  const text = data.content[0].text
  const readyToSend = text.includes('READY_TO_SEND')

  return Response.json({
    text: text.replace('READY_TO_SEND', '').trim(),
    readyToSend,
  })
}
