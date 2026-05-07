import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/emergent-clone/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: "projectId required" });

    const { data, error } = await supabaseAdmin
      .from("integration_connections")
      .select("*, integration_providers(*)")
      .eq("project_id", projectId as string);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { ownerId, projectId, providerId, displayName, accessToken, refreshToken, metadata } = req.body;

    const { data, error } = await supabaseAdmin
      .from("integration_connections")
      .insert({
        owner_id: ownerId,
        project_id: projectId,
        provider_id: providerId,
        display_name: displayName,
        access_token: accessToken,
        refresh_token: refreshToken,
        metadata
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
