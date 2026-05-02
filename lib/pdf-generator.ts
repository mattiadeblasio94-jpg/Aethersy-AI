/**
 * PDF Generator - Generazione PDF professionali
 * Con template per business plan, fatture, contratti, report
 */

import { createWriteStream } from 'fs';
import { join } from 'path';

export interface PDFTemplate {
  id: string;
  name: string;
  category: 'business' | 'legal' | 'finance' | 'marketing' | 'report';
  generate: (data: any) => Promise<string>;
}

// ============================================
// TEMPLATE: BUSINESS PLAN
// ============================================

const businessPlanTemplate: PDFTemplate = {
  id: 'business-plan-v1',
  name: 'Business Plan Professionale',
  category: 'business',
  generate: async (data) => generateBusinessPlanPDF(data)
};

async function generateBusinessPlanPDF(data: any): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
    h2 { color: #06b6d4; margin-top: 30px; }
    .section { margin: 20px 0; }
    .metric { display: inline-block; background: #f3f4f6; padding: 15px; margin: 10px; border-radius: 8px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
    .metric-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #7c3aed; color: white; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <h1>📊 Business Plan: ${data.companyName || 'Azienda'}</h1>
  <p style="color: #666;">Generato da Aethersy AI - ${new Date().toLocaleDateString('it-IT')}</p>

  <div class="section">
    <h2>🎯 Executive Summary</h2>
    <p>${data.executiveSummary || 'Analisi del business e opportunità di mercato.'}</p>
  </div>

  <div class="section">
    <h2>🏢 Mission & Vision</h2>
    <div class="highlight">
      <strong>Mission:</strong> ${data.mission || 'La nostra missione'}<br><br>
      <strong>Vision:</strong> ${data.vision || 'La nostra visione'}
    </div>
  </div>

  <div class="section">
    <h2>📈 Obiettivi & KPI</h2>
    ${data.goals?.map((g: any, i: number) => `
      <div class="metric">
        <div class="metric-value">${g.target}</div>
        <div class="metric-label">${g.name}</div>
      </div>
    `).join('') || ''}
  </div>

  <div class="section">
    <h2>💰 Proiezioni Finanziarie</h2>
    <table>
      <thead>
        <tr><th>Anno</th><th>Revenue</th><th>Costi</th><th>EBITDA</th></tr>
      </thead>
      <tbody>
        ${data.projections?.map((p: any) => `
          <tr>
            <td>${p.year}</td>
            <td>€${p.revenue?.toLocaleString()}</td>
            <td>€${p.costs?.toLocaleString()}</td>
            <td>€${p.ebitda?.toLocaleString()}</td>
          </tr>
        `).join('') || '<tr><td colspan="4">Nessuna proiezione disponibile</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>🎨 Marketing Strategy</h2>
    <p>${data.marketingStrategy || 'Strategia di go-to-market e acquisizione clienti.'}</p>
  </div>

  <div class="section">
    <h2>👥 Team</h2>
    <p>${data.team || 'Il nostro team di professionisti.'}</p>
  </div>

  <footer style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
    Documento generato automaticamente da Aethersy AI Platform
  </footer>
</body>
</html>`;

  return html;
}

// ============================================
// TEMPLATE: FATTURA
// ============================================

const invoiceTemplate: PDFTemplate = {
  id: 'invoice-v1',
  name: 'Fattura Professionale',
  category: 'finance',
  generate: async (data) => generateInvoicePDF(data)
};

async function generateInvoicePDF(data: any): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
    .invoice-info { text-align: right; }
    .details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #7c3aed; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .total { background: #f3f4f6; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">⚡ Aethersy AI</div>
      <div>Via dell\'Innovazione 123</div>
      <div>20100 Milano, Italia</div>
      <div>P.IVA: IT12345678901</div>
    </div>
    <div class="invoice-info">
      <h1>FATTURA</h1>
      <div><strong>N.</strong> ${data.invoiceNumber || '2026/001'}</div>
      <div><strong>Data:</strong> ${data.date || new Date().toLocaleDateString('it-IT')}</div>
      <div><strong>Scadenza:</strong> ${data.dueDate || '30 giorni FM'}</div>
    </div>
  </div>

  <div class="details">
    <strong>Cliente:</strong><br>
    ${data.clientName || 'Cliente'}<br>
    ${data.clientAddress || ''}<br>
    P.IVA: ${data.clientVAT || ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Descrizione</th>
        <th>Q.tà</th>
        <th>Prezzo Unit.</th>
        <th>Totale</th>
      </tr>
    </thead>
    <tbody>
      ${data.items?.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>€${item.unitPrice?.toFixed(2)}</td>
          <td>€${(item.quantity * item.unitPrice).toFixed(2)}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Nessun elemento</td></tr>'}
    </tbody>
  </table>

  <table style="margin-top: 20px; width: 300px; margin-left: auto;">
    <tr>
      <td>Imponibile:</td>
      <td style="text-align: right;">€${data.subtotal?.toFixed(2) || '0.00'}</td>
    </tr>
    <tr>
      <td>IVA (${data.vatRate || 22}%):</td>
      <td style="text-align: right;">€${data.vatAmount?.toFixed(2) || '0.00'}</td>
    </tr>
    <tr class="total">
      <td>Totale:</td>
      <td style="text-align: right;">€${data.total?.toFixed(2) || '0.00'}</td>
    </tr>
  </table>

  <div class="footer">
    Aethersy AI Platform - Fattura generata automaticamente<br>
    Pagamento tramite bonifico bancario - IBAN: IT00 X0000 0000 0000 0000 0000 000
  </div>
</body>
</html>`;

  return html;
}

// ============================================
// TEMPLATE: CONTRATTO
// ============================================

const contractTemplate: PDFTemplate = {
  id: 'contract-v1',
  name: 'Contratto di Servizi',
  category: 'legal',
  generate: async (data) => generateContractPDF(data)
};

async function generateContractPDF(data: any): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Georgia, serif; padding: 50px; line-height: 1.6; }
    h1 { text-align: center; color: #333; margin-bottom: 40px; }
    .article { margin: 25px 0; }
    .article-title { font-weight: bold; color: #7c3aed; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-block { width: 45%; border-top: 1px solid #333; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>CONTRATTO DI PRESTAZIONE SERVIZI</h1>

  <p>
    Tra <strong>${data.provider || 'Aethersy AI SRL'}</strong>, con sede in ${data.providerAddress || 'Milano'},
    P.IVA ${data.providerVAT || 'IT12345678901'} (di seguito "Fornitore")
  </p>
  <p>
    E <strong>${data.client || 'Cliente'}</strong>, con sede in ${data.clientAddress || ''},
    P.IVA ${data.clientVAT || ''} (di seguito "Cliente")
  </p>

  <div class="article">
    <div class="article-title">Articolo 1 - Oggetto</div>
    <p>${data.subject || 'Il presente contratto ha per oggetto la fornitura di servizi AI e automazione.'}</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 2 - Durata</div>
    <p>Il contratto ha durata ${data.duration || '12 mesi'} a decorrere dal ${data.startDate || new Date().toLocaleDateString('it-IT')}.</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 3 - Corrispettivo</div>
    <p>Il corrispettivo è pari a €${data.amount || '0,00'} ${data.paymentTerms || 'pagabili mensilmente'}.</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 4 - Obblighi del Fornitore</div>
    <p>${data.providerObligations || 'Il Fornitore si impegna a fornire i servizi con diligenza e professionalità.'}</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 5 - Obblighi del Cliente</div>
    <p>${data.clientObligations || 'Il Cliente si impegna a fornire tutte le informazioni necessarie.'}</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 6 - Riservatezza</div>
    <p>Le parti si impegnano a mantenere la massima riservatezza sulle informazioni scambiate.</p>
  </div>

  <div class="article">
    <div class="article-title">Articolo 7 - Legge Applicabile</div>
    <p>Il contratto è regolato dalla legge italiana. Foro competente: Milano.</p>
  </div>

  <div class="signature">
    <div class="signature-block">
      Il Fornitore<br><br><br>
      ___________________
    </div>
    <div class="signature-block">
      Il Cliente<br><br><br>
      ___________________
    </div>
  </div>
</body>
</html>`;

  return html;
}

// ============================================
// TEMPLATE: MARKETING REPORT
// ============================================

const marketingReportTemplate: PDFTemplate = {
  id: 'marketing-report-v1',
  name: 'Marketing Performance Report',
  category: 'marketing',
  generate: async (data) => generateMarketingReportPDF(data)
};

async function generateMarketingReportPDF(data: any): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #06b6d4; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .kpi-card { background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 20px; border-radius: 12px; text-align: center; }
    .kpi-value { font-size: 32px; font-weight: bold; }
    .kpi-label { font-size: 12px; opacity: 0.9; }
    .chart-placeholder { background: #f3f4f6; height: 200px; display: flex; align-items: center; justify-content: center; margin: 20px 0; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #333; color: white; padding: 12px; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
  </style>
</head>
<body>
  <h1>📊 Marketing Performance Report</h1>
  <p>Periodo: ${data.period || 'Ultimi 30 giorni'} - Generato: ${new Date().toLocaleDateString('it-IT')}</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">${data.impressions || '0'}</div>
      <div class="kpi-label">Impression</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${data.clicks || '0'}</div>
      <div class="kpi-label">Click</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${data.ctr || '0%'}%</div>
      <div class="kpi-label">CTR</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">€${data.cpa || '0'}</div>
      <div class="kpi-label">CPA</div>
    </div>
  </div>

  <h2>📈 Performance per Canale</h2>
  <table>
    <thead>
      <tr><th>Canale</th><th>Spend</th><th>Conv.</th><th>ROAS</th><th>Trend</th></tr>
    </thead>
    <tbody>
      ${data.channels?.map((c: any) => `
        <tr>
          <td>${c.name}</td>
          <td>€${c.spend}</td>
          <td>${c.conversions}</td>
          <td>${c.roas}</td>
          <td class="${c.trend > 0 ? 'positive' : 'negative'}">${c.trend > 0 ? '↑' : '↓'} ${Math.abs(c.trend)}%</td>
        </tr>
      `).join('') || '<tr><td colspan="5">Nessun dato</td></tr>'}
    </tbody>
  </table>

  <h2>💡 Insights & Raccomandazioni</h2>
  <ul>
    ${data.insights?.map((i: string) => `<li>${i}</li>`).join('') || '<li>Analisi in corso...</li>'}
  </ul>

  <footer style="margin-top: 50px; text-align: center; color: #999;">
    Aethersy AI Marketing Analytics
  </footer>
</body>
</html>`;

  return html;
}

// ============================================
// REGISTRO TEMPLATE
// ============================================

export const TEMPLATES: Record<string, PDFTemplate> = {
  'business-plan': businessPlanTemplate,
  'invoice': invoiceTemplate,
  'contract': contractTemplate,
  'marketing-report': marketingReportTemplate
};

// ============================================
// GENERATORE PRINCIPALE
// ============================================

export async function generatePDF(templateId: string, data: any): Promise<{ html: string; template: PDFTemplate }> {
  const template = TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template "${templateId}" non trovato. Template disponibili: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  const html = await template.generate(data);
  return { html, template };
}

export function listTemplates() {
  return Object.values(TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    category: t.category
  }));
}
