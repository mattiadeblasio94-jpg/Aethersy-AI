import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { ownerId } = req.query;
    const query = supabaseAdmin.from("projects").select("*").order("created_at", { ascending: false });

    const { data, error } = ownerId
      ? await query.eq("owner_id", ownerId as string)
      : await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { ownerId, name, description } = req.body;

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        owner_id: ownerId,
        name,
        description,
        status: "idle"
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
