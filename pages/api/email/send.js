/**
 * Email API - SendGrid Integration
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, to, name, plan, stats } = req.body
  const SENDGRID_KEY = process.env.SENDGRID_API_KEY
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@aethersy.com'
  const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Lara - Aethersy AI'

  if (!SENDGRID_KEY) {
    console.log('[Email] SendGrid non configurato - email simulata')
    return res.status(200).json({ success: true, messageId: 'simulated' })
  }

  let subject, html

  switch (type) {
    case 'welcome':
      subject = '🚀 Benvenuto su Aethersy AI'
      html = getWelcomeEmail(name || 'Utente')
      break
    case 'abandoned-cart':
      subject = `⏳ ${name}, il tuo piano ${plan} ti aspetta!`
      html = getAbandonedCartEmail(name || 'Utente', plan || 'pro')
      break
    case 'payment-confirmation':
      subject = `✅ Pagamento confermato - Piano ${plan?.toUpperCase()}`
      html = getPaymentConfirmationEmail(name || 'Utente', plan || 'pro', req.body.amount || '€49')
      break
    case 'weekly-report':
      subject = '📈 Report Settimanale Aethersy'
      html = getWeeklyReportEmail(name || 'Utente', stats || {})
      break
    default:
      return res.status(400).json({ error: 'Invalid email type' })
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (response.status === 202) {
      const messageId = response.headers.get('X-Message-Id') || 'unknown'
      return res.status(200).json({ success: true, messageId })
    } else {
      const error = await response.text()
      return res.status(500).json({ success: false, error })
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

function getWelcomeEmail(name) {
  return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,sans-serif;line-height:1.6}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:30px;border-radius:10px;text-align:center}.content{background:#f8f9fa;padding:30px}.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin-top:20px}</style></head><body><div class="container"><div class="header"><h1>🚀 Benvenuto su Aethersy AI!</h1><p>Ciao ${name}, sono Lara</p></div><div class="content"><p>Sono entusiasta di averti a bordo!</p><p style="text-align:center"><a href="https://aethersy.com/dashboard" class="button">Inizia Ora →</a></p></div></div></body></html>`
}

function getAbandonedCartEmail(name, plan) {
  return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:30px;border-radius:10px;text-align:center}.content{background:#f8f9fa;padding:30px}.button{display:inline-block;background:#f5576c;color:white;padding:12px 30px;text-decoration:none;border-radius:5px}</style></head><body><div class="container"><div class="header"><h1>⏳ Il tuo upgrade ti aspetta!</h1></div><div class="content"><p>Ciao ${name}, hai lasciato il piano <strong>${plan}</strong>.</p><p style="text-align:center"><a href="https://aethersy.com/pricing" class="button">Completa Upgrade →</a></p></div></div></body></html>`
}

function getPaymentConfirmationEmail(name, plan, amount) {
  return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#11998e,#38ef7d);color:white;padding:30px;border-radius:10px;text-align:center}.receipt{background:white;padding:20px;border-radius:8px;margin:20px 0}</style></head><body><div class="container"><div class="header"><h1>✅ Pagamento Confermato!</h1></div><div class="receipt"><h3>📋 Riepilogo</h3><p><strong>Piano:</strong> ${plan.toUpperCase()}</p><p><strong>Importo:</strong> ${amount}</p></div><p>Grazie ${name}!</p></div></body></html>`
}

function getWeeklyReportEmail(name, stats) {
  return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;padding:30px;border-radius:10px;text-align:center}.stat-box{background:white;padding:15px;border-radius:8px;margin:10px 0}</style></head><body><div class="container"><div class="header"><h1>📈 Report Settimanale</h1></div><div class="stat-box"><span>📨 Email:</span><span>${stats.emailsSent||0}</span></div><div class="stat-box"><span>🎯 Lead:</span><span>${stats.leadsGenerated||0}</span></div></div></body></html>`
}
