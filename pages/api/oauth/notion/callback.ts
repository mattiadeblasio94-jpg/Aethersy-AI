import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/emergent-clone/supabase";

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET!;
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!code || !state) {
    return res.status(400).json({ error: "code and state required" });
  }

  let stateData: { projectId: string; ownerId: string; ts: number };
  try {
    stateData = JSON.parse(Buffer.from(state as string, "base64url").toString("utf-8"));
  } catch {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  // Exchange code for access token
  const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64")}`
    },
    body: JSON.stringify({
      code,
      grant_type: "authorization_code",
      redirect_uri: NOTION_REDIRECT_URI
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return res.status(500).json({ error: `Token exchange failed: ${errorText}` });
  }

  const tokenData = await tokenResponse.json();

  // Get workspace info to create a human-readable label
  const workspaceName = tokenData.workspace_name ?? "Notion Workspace";
  const botId = tokenData.bot_id ?? "unknown";

  // Save connection to database
  const { data: connection, error: insertError } = await supabaseAdmin
    .from("integration_connections")
    .insert({
      owner_id: stateData.ownerId,
      project_id: stateData.projectId,
      provider_slug: "notion",
      display_name: `${workspaceName}`,
      account_label: botId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      scopes: tokenData.scope?.split(",") ?? [],
      metadata: {
        workspace_id: tokenData.workspace_id,
        workspace_name: workspaceName,
        bot_id: botId,
        token_type: tokenData.token_type
      }
    })
    .select()
    .single();

  if (insertError) {
    return res.status(500).json({ error: `Failed to save connection: ${insertError.message}` });
  }

  // Redirect back to workspace with success
  res.redirect(`/workspace?connected=notion&connectionId=${connection.id}`);
}
