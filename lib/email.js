// Email sending via Resend API

const RESEND_KEY = () => process.env.RESEND_API_KEY || '';
const FROM_EMAIL = () => process.env.EMAIL_FROM || 'Aethersy-AI <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = RESEND_KEY();
  if (!key) throw new Error('RESEND_API_KEY non configurato');

  const body = {
    from: FROM_EMAIL(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html || `<p>${text || ''}</p>`,
  };
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Errore invio email');
  return data;
}

export async function sendWelcomeEmail(userEmail, userName) {
  return sendEmail({
    to: userEmail,
    subject: '🚀 Benvenuto su Aethersy-AI — Sogna, Realizza, Guadagna',
    html: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
  <h1 style="background: linear-gradient(135deg,#7c3aed,#06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin-bottom: 8px;">⚡ Aethersy-AI</h1>
  <p style="color: #a78bfa; font-size: 16px; margin-bottom: 24px; font-style: italic;">Sogna, Realizza, Guadagna.</p>

  <p style="color: #cbd5e1; line-height: 1.7;">Ciao <strong style="color: #f1f5f9;">${userName}</strong>,</p>
  <p style="color: #94a3b8; line-height: 1.7;">Benvenuto su Aethersy-AI. Hai accesso alla piattaforma AI più avanzata per imprenditori.</p>

  <div style="margin: 24px 0; padding: 20px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px;">
    <p style="color: #a78bfa; font-weight: 700; margin-bottom: 12px;">Cosa puoi fare:</p>
    <ul style="color: #94a3b8; line-height: 2; margin: 0; padding-left: 20px;">
      <li>🔍 Ricerca web avanzata da 10+ fonti</li>
      <li>💬 Chat con Lara AGENTE AI Aethersy</li>
      <li>⚡ Genera codice in 12+ linguaggi</li>
      <li>📈 Dati finanziari e crypto live</li>
      <li>💰 Strategie di monetizzazione AI</li>
      <li>🧠 Second Brain per i tuoi progetti</li>
    </ul>
  </div>

  <a href="https://aethersy.com/dashboard" style="display: inline-block; background: linear-gradient(135deg,#7c3aed,#06b6d4); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-top: 8px;">Vai alla Dashboard →</a>

  <p style="color: #475569; font-size: 13px; margin-top: 32px;">Aethersy-AI · Lara AGENTE AI Aethersy · <a href="https://t.me/Lara_Aethersy_Bot" style="color: #38bdf8;">@Lara_Aethersy_Bot</a></p>
</div>`,
  });
}

export async function sendLeadNotification(adminEmail, lead) {
  return sendEmail({
    to: adminEmail,
    subject: `🎯 Nuovo lead: ${lead.name}`,
    html: `<div style="font-family: system-ui; padding: 24px;"><h2>🎯 Nuovo Lead</h2><p><strong>Nome:</strong> ${lead.name}</p><p><strong>Email:</strong> ${lead.email}</p><p><strong>Telefono:</strong> ${lead.phone || 'N/A'}</p><p><strong>Fonte:</strong> ${lead.source}</p><p><strong>ID:</strong> ${lead.id}</p></div>`,
  });
}
