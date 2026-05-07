import type { NextApiRequest, NextApiResponse } from "next";
import { getIntegration, getConnectionById } from "../../../../lib/emergent-clone/integrations/core";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { connectionId, providerSlug, payload } = req.body;

  const handler = getIntegration(providerSlug);
  if (!handler || !handler.send) {
    return res.status(400).json({ error: "Provider not supported or send() not implemented" });
  }

  const ctx = await getConnectionById(connectionId);
  if (!ctx) return res.status(404).json({ error: "Connection not found" });

  const result = await handler.send(ctx, payload);
  res.status(200).json({ ok: true, result });
}
