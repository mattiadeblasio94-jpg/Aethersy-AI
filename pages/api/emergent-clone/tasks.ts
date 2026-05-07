import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: "projectId required" });

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("project_id", projectId as string)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { projectId, role, content } = req.body;

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({ project_id: projectId, role, content })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
