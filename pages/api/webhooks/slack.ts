import type { NextApiRequest, NextApiResponse } from "next";
import { getIntegration } from "../../../lib/emergent-clone/integrations/core";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const handler = getIntegration("slack");
  if (!handler?.receiveWebhook) {
    return res.status(500).json({ error: "Slack integration not available" });
  }

  try {
    const result = await handler.receiveWebhook(req as any);

    if (result.event?.challenge) {
      return res.status(200).json({ challenge: result.event.challenge });
    }

    // TODO: map team_id to connectionId
    // TODO: save events to Supabase if needed

    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
