import type { IntegrationContext, IntegrationHandler } from "./core";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const GoogleIntegration: IntegrationHandler = {
  slug: "google",
  displayName: "Google Workspace",
  category: "productivity",

  async refreshToken(ctx: IntegrationContext) {
    if (!ctx.refreshToken) return ctx;
    const data = await refreshGoogleToken(ctx.refreshToken);
    ctx.accessToken = data.access_token;
    return ctx;
  },

  async send(ctx: IntegrationContext, payload: any) {
    const scope = payload.scope ?? "gmail";
    if (scope === "gmail") {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          raw: payload.rawBase64
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    throw new Error("Unsupported Google scope");
  }
};
