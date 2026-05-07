import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";
import { generateAppSpec } from "../../../lib/emergent-clone/llm";
import { materializeApp } from "../../../lib/emergent-clone/builder";
import { initAndPushRepo } from "../../../lib/emergent-clone/git";
import { triggerVercelDeploy, triggerFlyDeploy } from "../../../lib/emergent-clone/deploy";
import { getIntegration, getConnectionById } from "../../../lib/emergent-clone/integrations/core";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: "projectId required" });
    }

    const { data, error } = await supabaseAdmin
      .from("builds")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { projectId, provider = "vercel" } = req.body;

    const { data: messages, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (tasksError || !messages) {
      return res.status(500).json({ error: tasksError?.message ?? "No messages" });
    }

    const chat = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: projectError?.message ?? "Project not found" });
    }

    const { data: buildRow, error: buildError } = await supabaseAdmin
      .from("builds")
      .insert({ project_id: projectId, status: "running" })
      .select()
      .single();

    if (buildError) {
      return res.status(500).json({ error: buildError.message });
    }

    try {
      const spec = await generateAppSpec(chat as any);
      const { path: localPath } = await materializeApp(spec as any);

      const { repoUrl } = await initAndPushRepo(localPath, spec.name || project.name);

      let dashboardUrl: string | null = null;
      if (provider === "vercel") {
        const res = await triggerVercelDeploy({
          projectName: spec.name || project.name,
          repoUrl
        });
        dashboardUrl = res.dashboardUrl;
      } else if (provider === "fly") {
        const res = await triggerFlyDeploy({
          appName: spec.name || project.name,
          repoUrl
        });
        dashboardUrl = res.dashboardUrl;
      }

      await supabaseAdmin
        .from("builds")
        .update({
          status: "success",
          logs: `Build OK. Repo: ${repoUrl} - Dashboard: ${dashboardUrl}`,
          artifact_url: repoUrl
        })
        .eq("id", buildRow.id);

      // Notify Slack connections about successful build
      const { data: slackConnections } = await supabaseAdmin
        .from("integration_connections")
        .select("*")
        .eq("project_id", projectId)
        .eq("provider_slug", "slack");

      if (slackConnections && slackConnections.length > 0) {
        for (const conn of slackConnections) {
          try {
            const handler = getIntegration("slack");
            if (handler?.send) {
              const ctx = await getConnectionById(conn.id);
              if (ctx) {
                await handler.send(ctx, {
                  action: "send_message",
                  channel: conn.metadata?.default_channel,
                  text: `Build completata per ${project.name}`
                });
              }
            }
          } catch (e) {
            console.error("Failed to notify Slack:", e);
          }
        }
      }

      return res.status(200).json({
        buildId: buildRow.id,
        repoUrl,
        dashboardUrl
      });
    } catch (e: any) {
      await supabaseAdmin
        .from("builds")
        .update({
          status: "failed",
          logs: e.message ?? "Unknown error"
        })
        .eq("id", buildRow.id);

      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
