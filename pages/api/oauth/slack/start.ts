import type { NextApiRequest, NextApiResponse } from "next";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI!;
const SLACK_SCOPES = [
  "chat:write",
  "channels:read",
  "groups:read",
  "im:read",
  "mpim:read",
  "commands",
  "incoming-webhook"
].join(",");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId, ownerId } = req.query;

  if (!projectId || !ownerId) {
    return res.status(400).json({ error: "projectId and ownerId required" });
  }

  const state = Buffer.from(JSON.stringify({ projectId, ownerId })).toString("base64url");

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", SLACK_CLIENT_ID);
  url.searchParams.set("scope", SLACK_SCOPES);
  url.searchParams.set("redirect_uri", SLACK_REDIRECT_URI);
  url.searchParams.set("state", state);

  res.redirect(url.toString());
}
