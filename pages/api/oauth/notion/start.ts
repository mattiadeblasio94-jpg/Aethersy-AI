import type { NextApiRequest, NextApiResponse } from "next";

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId, ownerId } = req.query;

  if (!projectId || !ownerId) {
    return res.status(400).json({ error: "projectId and ownerId required" });
  }

  const state = Buffer.from(
    JSON.stringify({ projectId, ownerId, ts: Date.now() })
  ).toString("base64url");

  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", NOTION_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", NOTION_REDIRECT_URI);
  url.searchParams.set("state", state);

  res.redirect(url.toString());
}
