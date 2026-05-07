import type { NextApiRequest, NextApiResponse } from "next";
import { initIntegrations } from "../../../lib/emergent-clone/integrations";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  initIntegrations();
  res.status(200).json({ ok: true });
}
