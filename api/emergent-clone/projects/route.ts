import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/emergent-clone/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");
  const query = supabaseAdmin.from("projects").select("*").order("created_at", { ascending: false });

  const { data, error } = ownerId
    ? await query.eq("owner_id", ownerId)
    : await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ownerId, name, description } = body;

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
