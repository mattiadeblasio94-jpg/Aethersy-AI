import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { connectionId, metadata } = req.body;

  const { error } = await supabaseAdmin
    .from("integration_connections")
    .update({ metadata })
    .eq("id", connectionId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ ok: true });
}
