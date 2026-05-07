import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, role, content } = body;

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({ project_id: projectId, role, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
