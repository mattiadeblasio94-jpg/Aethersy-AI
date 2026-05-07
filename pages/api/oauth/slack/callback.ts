import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/emergent-clone/supabase";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;
const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://aethersy.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  let stateData: { projectId: string; ownerId: string };
  try {
    stateData = JSON.parse(Buffer.from(state as string, "base64url").toString("utf-8"));
  } catch {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  const { projectId, ownerId } = stateData;

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code as string,
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      redirect_uri: process.env.SLACK_REDIRECT_URI!
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.ok) {
    return res.status(500).json({ error: tokenData.error });
  }

  const accessToken = tokenData.access_token;
  const botUserId = tokenData.bot_user_id;
  const team = tokenData.team;

  const { data: provider, error: providerError } = await supabaseAdmin
    .from("integration_providers")
    .select("id")
    .eq("slug", "slack")
    .single();

  if (providerError || !provider) {
    return res.status(500).json({ error: "Slack provider not configured" });
  }

  const { error: insertError } = await supabaseAdmin
    .from("integration_connections")
    .insert({
      owner_id: ownerId,
      project_id: projectId,
      provider_id: provider.id,
      provider_slug: "slack",
      display_name: team?.name ?? "Slack Workspace",
      access_token: accessToken,
      refresh_token: null,
      scopes: tokenData.scope?.split(",") ?? [],
      account_label: team?.name ?? null,
      metadata: {
        team_id: team?.id,
        bot_user_id: botUserId,
        incoming_webhook: tokenData.incoming_webhook
      }
    });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  res.redirect(`${APP_BASE_URL}/builder?tab=integrations&projectId=${projectId}&connected=slack`);
}
