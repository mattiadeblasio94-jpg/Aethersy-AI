import type { IntegrationContext, IntegrationHandler } from "./core";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID!;

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const WhatsAppIntegration: IntegrationHandler = {
  slug: "whatsapp",
  displayName: "WhatsApp",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const to = ctx.metadata?.phone ?? payload.to;
    if (!to) throw new Error("phone number missing");
    const text = payload.text ?? "Hello from AIForge";
    return sendWhatsAppMessage(to, text);
  },

  async receiveWebhook(req: Request) {
    const body = await req.json();
    return {
      connectionId: "TODO-map-whatsapp-to-connection",
      event: body
    };
  }
};
