import type { CompanyProfile } from '@shared/types'

export function baseDocumentStyle(isRtl: boolean): string {
  return `
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: ${isRtl ? "'Cairo', 'Segoe UI', Tahoma, sans-serif" : "'Montserrat', 'Segoe UI', Arial, sans-serif"};
      direction: ${isRtl ? 'rtl' : 'ltr'};
      text-align: ${isRtl ? 'right' : 'left'};
      margin: 0;
      padding: 0;
      color: #1e293b;
      font-size: 10pt;
      line-height: 1.4;
      background: #fff;
    }
    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #142B45;
      padding-bottom: 8mm;
      margin-bottom: 6mm;
    }
    .company-title {
      font-size: 16pt;
      font-weight: 800;
      color: #142B45;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-subtitle {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 1mm;
    }
    .company-meta {
      font-size: 8pt;
      color: #475569;
      margin-top: 2mm;
      line-height: 1.3;
    }
    .doc-badge {
      display: inline-block;
      background: #142B45;
      color: #fff;
      padding: 3mm 6mm;
      border-radius: 4px;
      font-size: 12pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-meta {
      margin-top: 2mm;
      font-size: 8.5pt;
      color: #334155;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 6mm;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      background: #f8fafc;
      padding: 4mm 5mm;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .info-col-title {
      font-size: 8pt;
      font-weight: bold;
      color: #F28A27;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 1mm;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6mm;
    }
    table.data-table th {
      background: #203F60;
      color: #fff;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3mm 3mm;
      border: 1px solid #142B45;
      text-align: ${isRtl ? 'right' : 'left'};
    }
    table.data-table td {
      padding: 2.5mm 3mm;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    table.data-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .totals-area {
      width: 45%;
      margin-${isRtl ? 'right' : 'left'}: auto;
      margin-bottom: 6mm;
      border-collapse: collapse;
    }
    .totals-area td {
      padding: 2mm 3mm;
      font-size: 9pt;
      border: 1px solid #cbd5e1;
    }
    .totals-area .total-grand {
      background: #142B45;
      color: #fff;
      font-size: 11pt;
      font-weight: 800;
    }
    .signature-area {
      display: table;
      width: 100%;
      margin-top: 10mm;
      page-break-inside: avoid;
    }
    .signature-box {
      display: table-cell;
      width: 50%;
      text-align: center;
      padding: 0 10mm;
    }
    .signature-line {
      border-bottom: 1px dashed #64748b;
      height: 18mm;
      margin-bottom: 2mm;
    }
    .footer {
      position: fixed;
      bottom: 5mm;
      left: 15mm;
      right: 15mm;
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 2mm;
    }
  `
}

export function renderHeader(company: CompanyProfile, docTitle: string, docNumber: string, docDate: string, isRtl: boolean): string {
  return `
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          <div class="company-title">${company.name}</div>
          <div class="company-subtitle">${company.activity}</div>
          <div class="company-meta">
            ${company.address}, ${company.city} (${company.wilaya})<br>
            <strong>Tél:</strong> ${company.phone} | <strong>Email:</strong> ${company.email}<br>
            <strong>RC:</strong> ${company.rc} | <strong>NIF:</strong> ${company.nif} | <strong>NIS:</strong> ${company.nis}
          </div>
        </td>
        <td style="vertical-align: top; width: 40%; text-align: ${isRtl ? 'left' : 'right'};">
          <div class="doc-badge">${docTitle}</div>
          <div class="doc-meta">
            <strong>N°:</strong> ${docNumber}<br>
            <strong>Date:</strong> ${docDate}
          </div>
        </td>
      </tr>
    </table>
  `
}

export function formatDa(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' DA'
}
