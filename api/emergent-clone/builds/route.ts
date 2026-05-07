import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";

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
  const { project_id, status, logs, artifact_url } = body;

  const { data, error } = await supabaseAdmin
    .from("builds")
    .insert({ project_id, status: status || "pending", logs, artifact_url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
