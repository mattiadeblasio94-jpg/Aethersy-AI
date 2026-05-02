/**
 * Google Workspace Integration
 * Gmail, Sheets, Drive, Calendar API
 */

import { google, Auth } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar',
];

export class GoogleIntegration {
  private oauth2Client: Auth.OAuth2Client;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  setCredentials(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
  }

  // ============================================
  // GMAIL - Invio Email
  // ============================================

  async sendEmail(to: string, subject: string, body: string, html = false) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const message = [
      'Content-Type: text/' + (html ? 'html' : 'plain') + '; charset="UTF-8"',
      'MIME-Version: 1.0',
      'Content-Transfer-Encoding: 7bit',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    return { success: true, messageId: response.data.id };
  }

  async getInbox(maxResults = 10) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox'
    });

    const messages = response.data.messages || [];
    const details = await Promise.all(
      messages.map(async msg => {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata'
        });
        return {
          id: msg.id,
          from: full.data.headers?.find(h => h.name === 'From')?.value,
          subject: full.data.headers?.find(h => h.name === 'Subject')?.value,
          date: full.data.headers?.find(h => h.name === 'Date')?.value
        };
      })
    );

    return details;
  }

  // ============================================
  // GOOGLE SHEETS - Fogli di calcolo
  // ============================================

  async createSpreadsheet(title: string, sheets?: Array<{ name: string; data: any[][] }>) {
    const sheetsApi = google.sheets({ version: 'v4', auth: this.oauth2Client });

    const response = await sheetsApi.spreadsheets.create({
      requestBody: {
        properties: { title }
      }
    });

    const spreadsheetId = response.data.spreadsheetId;

    if (sheets && spreadsheetId) {
      for (const sheet of sheets) {
        await sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: sheet.name }
              }
            }]
          }
        });

        await sheetsApi.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheet.name}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: sheet.data }
        });
      }
    }

    return { success: true, spreadsheetId, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` };
  }

  async appendData(spreadsheetId: string, sheetName: string, data: any[][]) {
    const sheetsApi = google.sheets({ version: 'v4', auth: this.oauth2Client });

    await sheetsApi.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: data }
    });

    return { success: true };
  }

  async getData(spreadsheetId: string, range: string) {
    const sheetsApi = google.sheets({ version: 'v4', auth: this.oauth2Client });

    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    return response.data.values || [];
  }

  // ============================================
  // GOOGLE DRIVE - Storage file
  // ============================================

  async uploadFile(fileName: string, mimeType: string, content: Buffer) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const fileMetadata = { name: fileName };
    const media = { mimeType, body: content };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink, webContentLink'
    });

    return {
      success: true,
      fileId: response.data.id,
      viewUrl: response.data.webViewLink,
      downloadUrl: response.data.webContentLink
    };
  }

  async createFolder(name: string, parentFolderId?: string) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const fileMetadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink'
    });

    return {
      success: true,
      folderId: response.data.id,
      url: response.data.webViewLink
    };
  }

  async listFiles(folderId?: string) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const query = folderId ? `'${folderId}' in parents and trashed=false` : 'trashed=false';

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc'
    });

    return response.data.files || [];
  }

  // ============================================
  // GOOGLE CALENDAR - Gestione eventi
  // ============================================

  async createEvent(summary: string, startTime: string, endTime: string, attendees?: string[]) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        start: { dateTime: startTime, timeZone: 'Europe/Rome' },
        end: { dateTime: endTime, timeZone: 'Europe/Rome' },
        attendees: attendees?.map(email => ({ email }))
      }
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  }

  async getEvents(startDate?: string, endDate?: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate ? new Date(startDate).toISOString() : undefined,
      timeMax: endDate ? new Date(endDate).toISOString() : undefined,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items?.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map(a => a.email) || []
    })) || [];
  }

  // ============================================
  // AUTH URL per OAuth flow
  // ============================================

  generateAuthUrl(state?: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }
}

// Factory function
export function createGoogleIntegration(
  clientId = process.env.GOOGLE_CLIENT_ID,
  clientSecret = process.env.GOOGLE_CLIENT_SECRET,
  redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
) {
  return new GoogleIntegration(clientId!, clientSecret!, redirectUri);
}
