/**
 * Google Workspace API
 * Gmail, Sheets, Drive, Calendar
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createGoogleIntegration } from '../../../lib/google-integration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    const google = createGoogleIntegration();

    // Recupera token dal body o session
    const { accessToken } = req.body;
    if (accessToken) {
      google.setCredentials(accessToken);
    }

    switch (action) {
      // ============================================
      // GMAIL
      // ============================================
      case 'send-email':
        return sendEmail(req, res, google);

      case 'get-inbox':
        return getInbox(req, res, google);

      // ============================================
      // SHEETS
      // ============================================
      case 'create-sheet':
        return createSheet(req, res, google);

      case 'append-data':
        return appendData(req, res, google);

      case 'get-data':
        return getData(req, res, google);

      // ============================================
      // DRIVE
      // ============================================
      case 'upload-file':
        return uploadFile(req, res, google);

      case 'list-files':
        return listFiles(req, res, google);

      // ============================================
      // CALENDAR
      // ============================================
      case 'create-event':
        return createEvent(req, res, google);

      case 'get-events':
        return getEvents(req, res, google);

      default:
        res.status(400).json({
          error: 'Azione non valida',
          availableActions: [
            'send-email', 'get-inbox',
            'create-sheet', 'append-data', 'get-data',
            'upload-file', 'list-files',
            'create-event', 'get-events'
          ]
        });
    }
  } catch (error: any) {
    console.error('Google API error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// GMAIL ACTIONS
// ============================================

async function sendEmail(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { to, subject, body, html } = req.body;

  const result = await google.sendEmail(to, subject, body, html);
  res.json(result);
}

async function getInbox(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { maxResults = 10 } = req.body;

  const emails = await google.getInbox(maxResults);
  res.json({ emails });
}

// ============================================
// SHEETS ACTIONS
// ============================================

async function createSheet(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { title, sheets } = req.body;

  const result = await google.createSpreadsheet(title, sheets);
  res.json(result);
}

async function appendData(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { spreadsheetId, sheetName, data } = req.body;

  const result = await google.appendData(spreadsheetId, sheetName, data);
  res.json(result);
}

async function getData(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { spreadsheetId, range } = req.body;

  const data = await google.getData(spreadsheetId, range);
  res.json({ data });
}

// ============================================
// DRIVE ACTIONS
// ============================================

async function uploadFile(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { fileName, mimeType, base64Content } = req.body;

  const content = Buffer.from(base64Content, 'base64');
  const result = await google.uploadFile(fileName, mimeType, content);
  res.json(result);
}

async function listFiles(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { folderId } = req.body;

  const files = await google.listFiles(folderId);
  res.json({ files });
}

// ============================================
// CALENDAR ACTIONS
// ============================================

async function createEvent(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { summary, startTime, endTime, attendees } = req.body;

  const result = await google.createEvent(summary, startTime, endTime, attendees);
  res.json(result);
}

async function getEvents(req: NextApiRequest, res: NextApiResponse, google: any) {
  const { startDate, endDate } = req.body;

  const events = await google.getEvents(startDate, endDate);
  res.json({ events });
}
