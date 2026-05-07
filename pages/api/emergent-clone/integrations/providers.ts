import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data, error } = await supabaseAdmin
    .from("integration_providers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
