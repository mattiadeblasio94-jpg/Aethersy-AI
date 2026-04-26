import { getAuthorizedClient } from './google-auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

// Save Google credentials for a user
export async function saveGoogleCredentials(userId, credentials) {
  const r = await getRedis();
  await r.setex(`google:credentials:${userId}`, 86400 * 30, JSON.stringify({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  }));
}

// Get Google credentials for a user
export async function getGoogleCredentials(userId) {
  const r = await getRedis();
  const data = await r.get(`google:credentials:${userId}`);
  return data ? JSON.parse(data) : null;
}

// Send email via Gmail API
export async function sendGmail(userId, to, subject, body, html = false) {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  // Refresh token if needed
  if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
    const { credentials: newCreds } = await client.refreshAccessToken();
    await saveGoogleCredentials(userId, newCreds);
  }

  const gmail = google.gmail({ version: 'v1', auth: client });

  const message = [
    'Content-Type: text/' + (html ? 'html' : 'plain') + '; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 7bit',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  return response.data;
}

// Read emails from Gmail
export async function readGmail(userId, query = '', maxResults = 10) {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient(credentials);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });

  const messages = listResponse.data.messages || [];
  const emails = [];

  for (const msg of messages) {
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = fullMessage.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const to = headers.find(h => h.name === 'To')?.value || '';

    let body = '';
    if (fullMessage.data.payload?.parts?.[0]?.body?.data) {
      body = Buffer.from(fullMessage.data.payload.parts[0].body.data, 'base64').toString('utf-8');
    } else if (fullMessage.data.payload?.body?.data) {
      body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
    }

    emails.push({
      id: msg.id,
      subject,
      from,
      to,
      body,
      date: new Date(parseInt(msg.internalDate)).toISOString(),
    });
  }

  return emails;
}

// Write to Google Sheets
export async function writeSheet(userId, spreadsheetId, range, values) {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient(credentials);
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  return response.data;
}

// Read from Google Sheets
export async function readSheet(userId, spreadsheetId, range) {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient(credentials);
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

// Create Google Doc
export async function createDoc(userId, title, content = '') {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient(credentials);
  const docs = google.docs({ version: 'v1', auth: client });

  const document = await docs.documents.create({
    requestBody: { title },
  });

  if (content) {
    await docs.documents.batchUpdate({
      documentId: document.data.documentId,
      requestBody: {
        requests: [{
          insertText: {
            text: content,
            endOfSegmentLocation: {},
          },
        }],
      },
    });
  }

  return document.data;
}

// Read Google Doc
export async function readDoc(userId, documentId) {
  const credentials = await getGoogleCredentials(userId);
  if (!credentials) throw new Error('Credenziali Google non trovate');

  const client = getAuthorizedClient(credentials);
  const docs = google.docs({ version: 'v1', auth: client });

  const response = await docs.documents.get({ documentId });
  return response.data;
}

// Helper to load googleapis dynamically
async function loadGoogleApis() {
  try {
    return await import('googleapis');
  } catch (e) {
    throw new Error('googleapis package not installed. Run: npm install googleapis');
  }
}

// Lazy load google global
let google = null;
async function getGoogle() {
  if (!google) {
    const { googleapis } = await loadGoogleApis();
    google = googleapis;
  }
  return google;
}
