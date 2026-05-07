import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { connectionId, metadata } = req.body;

  if (!connectionId || !metadata) {
    return res.status(400).json({ error: "connectionId and metadata required" });
  }

  const { data, error } = await supabaseAdmin
    .from("integration_connections")
    .update({ metadata })
    .eq("id", connectionId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ ok: true, connection: data });
}
