import { NextRequest, NextResponse } from 'next/server';

const ASANA_CLIENT_ID = process.env.ASANA_CLIENT_ID;
const ASANA_REDIRECT_URI = process.env.ASANA_REDIRECT_URI;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const ownerId = searchParams.get('ownerId');

  if (!projectId || !ownerId) {
    return NextResponse.json({ error: 'projectId and ownerId required' }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ projectId, ownerId })).toString('base64url');

  const url = new URL('https://app.asana.com/-/oauth_authorize');
  url.searchParams.set('client_id', ASANA_CLIENT_ID);
  url.searchParams.set('redirect_uri', ASANA_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
