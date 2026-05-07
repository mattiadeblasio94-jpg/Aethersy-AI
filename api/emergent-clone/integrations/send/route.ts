import { NextRequest, NextResponse } from "next/server";
import { getIntegration, getConnectionById } from "../../../../lib/emergent-clone/integrations/core";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { connectionId, providerSlug, payload } = body;

  const handler = getIntegration(providerSlug);
  if (!handler || !handler.send) {
    return NextResponse.json({ error: "Provider not supported or send() not implemented" }, { status: 400 });
  }

  const ctx = await getConnectionById(connectionId);
  if (!ctx) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const result = await handler.send(ctx, payload);
  return NextResponse.json({ ok: true, result });
}
