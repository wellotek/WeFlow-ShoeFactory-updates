import QRCode from 'qrcode'
import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import type { LabelPrintItem, LabelTemplate } from '@shared/types'

export function generateCode128Svg(text: string, options?: { height?: number; barWidth?: number; includeText?: boolean }): string {
  const height = options?.height ?? 40
  const barWidth = options?.barWidth ?? 1.5
  const includeText = options?.includeText ?? true

  const patterns: string[] = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
  ]

  const START_B = 104
  const STOP = 106

  const charCodes: number[] = [START_B]
  let checkSum = START_B

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32
    if (code >= 0 && code <= 95) {
      charCodes.push(code)
      checkSum += code * (i + 1)
    }
  }

  charCodes.push(checkSum % 103)
  charCodes.push(STOP)

  let patternStr = ''
  for (const c of charCodes) {
    patternStr += patterns[c] || patterns[0]
  }

  let totalWidthUnits = 0
  for (let i = 0; i < patternStr.length; i++) {
    totalWidthUnits += Number(patternStr[i])
  }

  const svgWidth = Math.round(totalWidthUnits * barWidth + 20)
  const svgHeight = includeText ? height + 16 : height

  let currentX = 10
  let rects = ''

  for (let i = 0; i < patternStr.length; i++) {
    const width = Number(patternStr[i]) * barWidth
    if (i % 2 === 0) {
      rects += `<rect x="${currentX.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${height}" fill="#000" />`
    }
    currentX += width
  }

  const textElement = includeText
    ? `<text x="${(svgWidth / 2).toFixed(1)}" y="${svgHeight - 2}" font-family="monospace" font-size="11" text-anchor="middle" fill="#000">${text}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">${rects}${textElement}</svg>`
}

export class LabelService {
  listTemplates(): LabelTemplate[] {
    assertLicensed()
    const db = getDatabase()
    const rows = db.prepare('SELECT id, name, width_mm as widthMm, height_mm as heightMm, margins_mm as marginsMm, barcode_type as barcodeType FROM label_templates ORDER BY id ASC').all() as any[]
    return rows
  }

  async generateBarcode(type: 'code128' | 'qr', value: string): Promise<string> {
    if (type === 'qr') {
      return await QRCode.toString(value, {
        type: 'svg',
        margin: 1,
        width: 80,
        color: { dark: '#000000', light: '#ffffff' }
      })
    }
    return generateCode128Svg(value, { height: 35, barWidth: 1.3, includeText: true })
  }

  async renderLabelHtml(template: LabelTemplate, item: LabelPrintItem, copies = 1): Promise<string> {
    const barcodeSvg = await this.generateBarcode(template.barcodeType, item.barcodeValue)

    const singleLabelHtml = `
      <div class="label-card" style="width: ${template.widthMm}mm; height: ${template.heightMm}mm; padding: ${template.marginsMm}mm; box-sizing: border-box; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Segoe UI', Arial, sans-serif; background: #fff; page-break-inside: avoid; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #142B45; padding-bottom: 2mm;">
          <div>
            <div style="font-size: 8pt; font-weight: 800; color: #142B45; text-transform: uppercase; letter-spacing: 0.5px;">WeFlow ShoeFactory</div>
            <div style="font-size: 9pt; font-weight: bold; color: #000; margin-top: 1mm;">${item.productName}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 8pt; font-weight: bold; background: #203F60; color: #fff; padding: 1mm 2.5mm; border-radius: 3px;">${item.reference}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1mm; font-size: 8pt; color: #1e293b; margin: 2mm 0;">
          ${item.color ? `<div><strong>Couleur:</strong> ${item.color}</div>` : ''}
          ${item.size ? `<div><strong>Pointure:</strong> <span style="font-size: 10pt; font-weight: 900; color: #F28A27;">${item.size}</span></div>` : ''}
          ${item.lotNumber ? `<div><strong>Lot:</strong> ${item.lotNumber}</div>` : ''}
          ${item.manufacturingDate ? `<div><strong>Date:</strong> ${item.manufacturingDate}</div>` : ''}
          ${item.category ? `<div><strong>Catégorie:</strong> ${item.category}</div>` : ''}
        </div>

        <div style="display: flex; justify-content: center; align-items: center; margin-top: auto;">
          <div style="max-height: 20mm; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${barcodeSvg}
          </div>
        </div>
      </div>
    `

    let allLabels = ''
    for (let i = 0; i < copies; i++) {
      allLabels += singleLabelHtml
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: ${template.widthMm}mm ${template.heightMm}mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            background: #f8fafc;
          }
          @media print {
            body { background: transparent; }
            .label-card { border: none !important; page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${allLabels}
      </body>
      </html>
    `
  }
}

export const labelService = new LabelService()
