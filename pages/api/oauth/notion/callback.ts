import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/emergent-clone/supabase";

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET!;
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI!;
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

  let stateData: { projectId: string; ownerId: string; ts: number };
  try {
    stateData = JSON.parse(Buffer.from(state as string, "base64url").toString("utf-8"));
  } catch {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  const { projectId, ownerId } = stateData;

  const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: NOTION_REDIRECT_URI,
      client_id: NOTION_CLIENT_ID,
      client_secret: NOTION_CLIENT_SECRET
    })
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return res.status(500).json({ error: `Token exchange failed: ${text}` });
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string;
  const workspaceName = tokenData.workspace_name as string | undefined;
  const botId = tokenData.bot_id as string | undefined;

  const { data: provider } = await supabaseAdmin
    .from("integration_providers")
    .select("id")
    .eq("slug", "notion")
    .single();

  if (!provider) {
    return res.status(500).json({ error: "Notion provider not configured" });
  }

  const { data: connection, error: insertError } = await supabaseAdmin
    .from("integration_connections")
    .insert({
      owner_id: ownerId,
      project_id: projectId,
      provider_id: provider.id,
      provider_slug: "notion",
      display_name: workspaceName ?? "Notion workspace",
      access_token: accessToken,
      refresh_token: null,
      scopes: tokenData.owner?.user?.person ? ["pages:read", "pages:write"] : [],
      account_label: workspaceName ?? null,
      metadata: {
        bot_id: botId,
        workspace_name: workspaceName
      }
    })
    .select()
    .single();

  if (insertError) {
    return res.status(500).json({ error: `Failed to save connection: ${insertError.message}` });
  }

  const redirectUrl = new URL(`${APP_BASE_URL}/workspace?tab=integrations`);
  redirectUrl.searchParams.set("projectId", projectId);
  redirectUrl.searchParams.set("connected", "notion");
  redirectUrl.searchParams.set("connectionId", connection.id);
  res.redirect(redirectUrl.toString());
}
