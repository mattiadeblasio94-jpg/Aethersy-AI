import type { IntegrationContext, IntegrationHandler } from "./core";

export const SlackIntegration: IntegrationHandler = {
  slug: "slack",
  displayName: "Slack",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const channel = payload.channel ?? ctx.metadata?.channel;
    const text = payload.text ?? "Hello from AIForge";

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ channel, text })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Slack error");
    return data;
  },

  async receiveWebhook(req: Request) {
    const body = await req.json();
    return {
      connectionId: "TODO-map-slack-team-to-connection",
      event: body
    };
  }
};
