import type { IntegrationContext, IntegrationHandler } from "./core";

async function slackApi(path: string, method: string, token: string, body?: any) {
  const res = await fetch(`https://slack.com/api/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Slack API error");
  return data;
}

export const SlackIntegration: IntegrationHandler = {
  slug: "slack",
  displayName: "Slack",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const action = payload.action;

    if (action === "send_message") {
      const channel = payload.channel ?? ctx.metadata?.default_channel;
      if (!channel) throw new Error("channel missing");

      return slackApi("chat.postMessage", "POST", token, {
        channel,
        text: payload.text ?? "Hello from AIForge"
      });
    }

    if (action === "send_thread_reply") {
      const channel = payload.channel ?? ctx.metadata?.default_channel;
      const thread_ts = payload.thread_ts;
      if (!channel || !thread_ts) throw new Error("channel and thread_ts required");

      return slackApi("chat.postMessage", "POST", token, {
        channel,
        thread_ts,
        text: payload.text ?? "Reply from AIForge"
      });
    }

    if (action === "list_channels") {
      return slackApi("conversations.list", "GET", token);
    }

    // Default: send message
    const channel = payload.channel ?? ctx.metadata?.default_channel;
    const text = payload.text ?? payload.message ?? "Hello from AIForge";
    if (channel) {
      return slackApi("chat.postMessage", "POST", token, { channel, text });
    }

    throw new Error(`Unsupported Slack action: ${action}`);
  },

  async receiveWebhook(req: Request) {
    const body = await req.json();

    if (body.type === "url_verification") {
      return {
        connectionId: null as any,
        event: { challenge: body.challenge }
      };
    }

    if (body.event) {
      const event = body.event;
      return {
        connectionId: "TODO-map-team-to-connection" as any,
        event
      };
    }

    return { connectionId: null as any, event: body };
  }
};
