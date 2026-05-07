import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";
import { generateAppSpec } from "../../../lib/emergent-clone/llm";
import { materializeApp } from "../../../lib/emergent-clone/builder";
import { initAndPushRepo } from "../../../lib/emergent-clone/git";
import { triggerVercelDeploy, triggerFlyDeploy } from "../../../lib/emergent-clone/deploy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("builds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, provider = "vercel" } = body;

  const { data: messages, error: tasksError } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (tasksError || !messages) {
    return NextResponse.json({ error: tasksError?.message ?? "No messages" }, { status: 500 });
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
    return NextResponse.json({ error: projectError?.message ?? "Project not found" }, { status: 404 });
  }

  const { data: buildRow, error: buildError } = await supabaseAdmin
    .from("builds")
    .insert({ project_id: projectId, status: "running" })
    .select()
    .single();

  if (buildError) {
    return NextResponse.json({ error: buildError.message }, { status: 500 });
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

    return NextResponse.json({
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

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
