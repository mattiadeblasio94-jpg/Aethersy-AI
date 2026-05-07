import type { IntegrationContext, IntegrationHandler } from "./core";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const TelegramIntegration: IntegrationHandler = {
  slug: "telegram",
  displayName: "Telegram",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const chatId = ctx.metadata?.chat_id || payload.chatId;
    if (!chatId) throw new Error("chatId missing");
    const text = payload.text ?? "Hello from AIForge";
    return sendTelegramMessage(chatId, text);
  },

  async receiveWebhook(req: Request) {
    const body = await req.json();
    const message = body.message || body.edited_message;
    const chatId = message?.chat?.id?.toString();
    const text = message?.text ?? "";

    // Qui devi mappare chatId -> connectionId (es. via metadata in Supabase)
    // Per ora ritorniamo un placeholder
    return {
      connectionId: "TODO-map-chatId-to-connection",
      event: { chatId, text, raw: body }
    };
  }
};
