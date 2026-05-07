import { NextResponse } from "next/server";
import { initIntegrations } from "../../../lib/emergent-clone/integrations";

export async function GET() {
  initIntegrations();
  return NextResponse.json({ ok: true });
}
