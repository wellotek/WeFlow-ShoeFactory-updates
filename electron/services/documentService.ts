import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { settingsService } from './settingsService'
import { baseDocumentStyle, formatDa, renderHeader } from './documentTemplates'
import { costCalculationService } from './costCalculationService'

export class DocumentService {
  renderDocumentHtml(docType: string, id: number, lang: 'fr' | 'ar' = 'fr'): string {
    assertLicensed()
    const company = settingsService.getCompanyProfile()
    const isRtl = lang === 'ar'

    switch (docType) {
      case 'quote':
      case 'devis':
      case 'invoice':
      case 'facture':
      case 'customer_order':
      case 'bon_commande_client':
        return this.renderCustomerCommercialDoc(docType, id, company, isRtl)

      case 'delivery':
      case 'bon_livraison':
        return this.renderDeliveryNote(id, company, isRtl)

      case 'supplier_order':
      case 'bon_commande_fournisseur':
      case 'reception':
      case 'bon_reception':
        return this.renderPurchaseDoc(docType, id, company, isRtl)

      case 'technical_sheet':
      case 'fiche_technique':
        return this.renderTechnicalSheetDoc(id, company, isRtl)

      case 'production_order':
      case 'ordre_fabrication':
        return this.renderProductionOrderDoc(id, company, isRtl)

      case 'production_tracking':
      case 'suivi_production':
        return this.renderProductionTrackingDoc(id, company, isRtl)

      case 'materials_consumption':
      case 'rapport_consommation':
        return this.renderMaterialConsumptionReport(id, company, isRtl)

      case 'stock_report':
      case 'rapport_stock':
      case 'inventory_report':
      case 'rapport_inventaire':
        return this.renderStockInventoryReport(docType, company, isRtl)

      case 'quality_report':
      case 'rapport_qualite':
        return this.renderQualityReport(id, company, isRtl)

      case 'cost_report':
      case 'rapport_couts':
        return this.renderCostReport(id, company, isRtl)

      case 'production_report':
      case 'rapport_production':
        return this.renderProductionGlobalReport(company, isRtl)

      default:
        throw new Error(`Type de document non supporté: ${docType}`)
    }
  }

  private wrapHtml(content: string, isRtl: boolean): string {
    return `
      <!DOCTYPE html>
      <html lang="${isRtl ? 'ar' : 'fr'}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <style>
          ${baseDocumentStyle(isRtl)}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `
  }

  // 1, 2, 3: Devis / Facture / Bon de commande client
  private renderCustomerCommercialDoc(docType: string, id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const order = db.prepare(`
      SELECT co.*, c.name as customer_name, c.company as customer_company, c.phone as customer_phone,
             c.address as customer_address, c.wilaya as customer_wilaya
      FROM customer_orders co
      JOIN customers c ON co.customer_id = c.id
      WHERE co.id = ?
    `).get(id) as any

    if (!order) throw new Error('Commande introuvable')

    const items = db.prepare(`
      SELECT coi.*, m.reference as model_ref, m.name as model_name
      FROM customer_order_items coi
      JOIN shoe_models m ON coi.model_id = m.id
      WHERE coi.order_id = ?
    `).all(id) as any[]

    let title = 'Bon de Commande'
    let prefixNum = order.order_number
    if (docType === 'quote' || docType === 'devis') {
      title = isRtl ? 'عرض أسعار (Devis)' : 'Devis Estimatif'
      prefixNum = order.order_number.replace('CMD-', 'DEV-')
    } else if (docType === 'invoice' || docType === 'facture') {
      title = isRtl ? 'فاتورة تجارية (Facture)' : 'Facture Client'
      prefixNum = order.order_number.replace('CMD-', 'FACT-')
    } else {
      title = isRtl ? 'طلب زبون (Commande)' : 'Bon de Commande Client'
    }

    const header = renderHeader(company, title, prefixNum, order.order_date, isRtl)

    const clientInfo = `
      <div class="info-grid">
        <div class="info-col" style="margin-${isRtl ? 'left' : 'right'}: 4mm;">
          <div class="info-col-title">${isRtl ? 'بيانات الزبون' : 'Informations Client'}</div>
          <strong>${order.customer_company || order.customer_name}</strong><br>
          ${order.customer_name ? `Contact: ${order.customer_name}<br>` : ''}
          ${order.customer_address ? `${order.customer_address}<br>` : ''}
          <strong>Wilaya:</strong> ${order.customer_wilaya}<br>
          <strong>Tél:</strong> ${order.customer_phone}
        </div>
        <div class="info-col">
          <div class="info-col-title">${isRtl ? 'تفاصيل الطلبية' : 'Détails de la Commande'}</div>
          <strong>Statut:</strong> ${order.status}<br>
          <strong>Date souhaitée:</strong> ${order.delivery_date || 'Dès que possible'}<br>
          <strong>Quantité totale:</strong> ${order.total_quantity} paires<br>
          ${order.notes ? `<strong>Notes:</strong> ${order.notes}` : ''}
        </div>
      </div>
    `

    let rowsHtml = ''
    items.forEach((it, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${it.model_ref}</strong> - ${it.model_name}</td>
          <td style="text-align: center;">${it.color}</td>
          <td style="text-align: center; font-weight: bold; color: #F28A27;">${it.size}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">${formatDa(it.unit_price)}</td>
          <td style="text-align: right; font-weight: bold;">${formatDa(it.total_price)}</td>
        </tr>
      `
    })

    const tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 35%;">${isRtl ? 'الطراز والتعيين' : 'Modèle & Désignation'}</th>
            <th style="width: 12%; text-align: center;">${isRtl ? 'اللون' : 'Couleur'}</th>
            <th style="width: 10%; text-align: center;">${isRtl ? 'المقاس' : 'Pointure'}</th>
            <th style="width: 10%; text-align: center;">${isRtl ? 'الكمية' : 'Quantité'}</th>
            <th style="width: 13%; text-align: right;">${isRtl ? 'السعر الفردي' : 'P.U. (DA)'}</th>
            <th style="width: 15%; text-align: right;">${isRtl ? 'المجموع' : 'Total (DA)'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `

    const subTotal = order.total_amount + (order.discount || 0)
    const totalsHtml = `
      <table class="totals-area">
        <tr>
          <td><strong>${isRtl ? 'المجموع الفرعي' : 'Sous-total Brut'}:</strong></td>
          <td style="text-align: right;">${formatDa(subTotal)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td><strong>${isRtl ? 'التخفيض' : 'Remise commerciale'}:</strong></td>
          <td style="text-align: right; color: #dc2626;">-${formatDa(order.discount)}</td>
        </tr>` : ''}
        <tr class="total-grand">
          <td><strong>${isRtl ? 'المجموع الصافي للدفع' : 'Net à Payer (DA)'}:</strong></td>
          <td style="text-align: right;">${formatDa(order.total_amount)}</td>
        </tr>
        ${order.advance_paid > 0 ? `
        <tr>
          <td><strong>${isRtl ? 'التسبيق المدفوع' : 'Acompte versé'}:</strong></td>
          <td style="text-align: right; color: #16a34a;">${formatDa(order.advance_paid)}</td>
        </tr>
        <tr>
          <td><strong>${isRtl ? 'المتبقي للدفع' : 'Reste à payer'}:</strong></td>
          <td style="text-align: right; font-weight: bold;">${formatDa(order.remaining_balance)}</td>
        </tr>` : ''}
      </table>
    `

    const signHtml = `
      <div class="signature-area">
        <div class="signature-box">
          <strong>${isRtl ? 'تأشيرة ومصادقة الزبون' : 'Le Client (Cachet & Signature)'}</strong>
          <div class="signature-line"></div>
        </div>
        <div class="signature-box">
          <strong>${isRtl ? 'إدارة مصنع وي فلو' : 'Direction WeFlow ShoeFactory'}</strong>
          <div class="signature-line"></div>
        </div>
      </div>
    `

    return this.wrapHtml(header + clientInfo + tableHtml + totalsHtml + signHtml, isRtl)
  }

  // 6: Bon de livraison
  private renderDeliveryNote(id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const del = db.prepare(`
      SELECT d.*, c.name as customer_name, c.company as customer_company, c.phone as customer_phone,
             c.address as customer_address, c.wilaya as customer_wilaya
      FROM deliveries d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.id = ?
    `).get(id) as any

    if (!del) throw new Error('Bon de livraison introuvable')

    const items = db.prepare(`
      SELECT di.*, m.reference as model_ref, m.name as model_name
      FROM delivery_items di
      JOIN shoe_models m ON di.model_id = m.id
      WHERE di.delivery_id = ?
    `).all(id) as any[]

    const title = isRtl ? 'وصل تسليم بضاعة (BL)' : 'Bon de Livraison (BL)'
    const header = renderHeader(company, title, del.delivery_number, del.delivery_date, isRtl)

    const clientInfo = `
      <div class="info-grid">
        <div class="info-col" style="margin-${isRtl ? 'left' : 'right'}: 4mm;">
          <div class="info-col-title">${isRtl ? 'المستلم (الزبون)' : 'Destinataire (Client)'}</div>
          <strong>${del.customer_company || del.customer_name}</strong><br>
          ${del.customer_address ? `${del.customer_address}<br>` : ''}
          <strong>Wilaya:</strong> ${del.customer_wilaya} | <strong>Tél:</strong> ${del.customer_phone}
        </div>
        <div class="info-col">
          <div class="info-col-title">${isRtl ? 'بيانات الشحن' : 'Informations Expédition'}</div>
          <strong>Chauffeur / Transporteur:</strong> ${del.driver_name || 'Service Livraison'}<br>
          <strong>Statut livraison:</strong> ${del.status}<br>
          ${del.notes ? `<strong>Observations:</strong> ${del.notes}` : ''}
        </div>
      </div>
    `

    let totalPairs = 0
    let rowsHtml = ''
    items.forEach((it, idx) => {
      totalPairs += it.quantity
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${it.model_ref}</strong> - ${it.model_name}</td>
          <td style="text-align: center;">${it.color}</td>
          <td style="text-align: center; font-weight: bold; color: #F28A27;">${it.size}</td>
          <td style="text-align: center; font-weight: bold;">${it.quantity} paires</td>
          <td>Conforme</td>
        </tr>
      `
    })

    const tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 40%;">${isRtl ? 'الطراز' : 'Modèle'}</th>
            <th style="width: 15%; text-align: center;">${isRtl ? 'اللون' : 'Couleur'}</th>
            <th style="width: 12%; text-align: center;">${isRtl ? 'المقاس' : 'Pointure'}</th>
            <th style="width: 15%; text-align: center;">${isRtl ? 'الكمية المسلمة' : 'Qté Livrée'}</th>
            <th style="width: 13%;">${isRtl ? 'الملاحظة' : 'Observations'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #142B45; color: #fff; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 3mm;">TOTAL PAIRES LIVRÉES:</td>
            <td style="text-align: center; padding: 3mm; font-size: 11pt;">${totalPairs} paires</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `

    const signHtml = `
      <div class="signature-area">
        <div class="signature-box">
          <strong>${isRtl ? 'توقيع المستلم بالاستلام التام' : 'Le Client / Réceptionnaire (Nom, Date & Émargement)'}</strong>
          <div class="signature-line"></div>
        </div>
        <div class="signature-box">
          <strong>${isRtl ? 'تأشيرة مسؤول المستودع' : 'Magasin Expéditions WeFlow'}</strong>
          <div class="signature-line"></div>
        </div>
      </div>
    `

    return this.wrapHtml(header + clientInfo + tableHtml + signHtml, isRtl)
  }

  // 4, 5: Bon de commande fournisseur / Bon de réception
  private renderPurchaseDoc(docType: string, id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const p = db.prepare(`
      SELECT p.*, s.name as supplier_name, s.company as supplier_company, s.phone as supplier_phone,
             s.address as supplier_address, s.wilaya as supplier_wilaya
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(id) as any

    if (!p) throw new Error('Achat introuvable')

    const items = db.prepare(`
      SELECT pi.*, m.code as mat_code, m.designation as mat_name, m.unit as mat_unit
      FROM purchase_items pi
      JOIN raw_materials m ON pi.material_id = m.id
      WHERE pi.purchase_id = ?
    `).all(id) as any[]

    const isRec = docType === 'reception' || docType === 'bon_reception'
    const title = isRec
      ? (isRtl ? 'سند استلام مواد أولية' : 'Bon de Réception Matières Premières')
      : (isRtl ? 'سند طلبية مورد' : 'Bon de Commande Fournisseur')
    const header = renderHeader(company, title, p.purchase_number, p.purchase_date, isRtl)

    const suppInfo = `
      <div class="info-grid">
        <div class="info-col" style="margin-${isRtl ? 'left' : 'right'}: 4mm;">
          <div class="info-col-title">${isRtl ? 'بيانات المورد' : 'Fournisseur'}</div>
          <strong>${p.supplier_company || p.supplier_name}</strong><br>
          ${p.supplier_address ? `${p.supplier_address}<br>` : ''}
          <strong>Wilaya:</strong> ${p.supplier_wilaya} | <strong>Tél:</strong> ${p.supplier_phone}
        </div>
        <div class="info-col">
          <div class="info-col-title">${isRtl ? 'حالة السند' : 'Informations document'}</div>
          <strong>Statut:</strong> ${p.status}<br>
          <strong>Total commande:</strong> ${formatDa(p.total_amount)}<br>
          <strong>Montant payé:</strong> ${formatDa(p.paid_amount)}<br>
          <strong>Solde restant:</strong> ${formatDa(p.remaining_balance)}
        </div>
      </div>
    `

    let rowsHtml = ''
    items.forEach((it, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${it.mat_code}</strong></td>
          <td>${it.mat_name}</td>
          <td style="text-align: center;">${it.mat_unit}</td>
          <td style="text-align: center; font-weight: bold;">${it.quantity}</td>
          ${isRec ? `<td style="text-align: center; color: #16a34a; font-weight: bold;">${it.received_quantity}</td>` : ''}
          <td style="text-align: right;">${formatDa(it.unit_price)}</td>
          <td style="text-align: right; font-weight: bold;">${formatDa(it.total_price)}</td>
        </tr>
      `
    })

    const tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 15%;">${isRtl ? 'الرمز' : 'Code'}</th>
            <th style="width: 30%;">${isRtl ? 'المادة الأولية' : 'Matière Première'}</th>
            <th style="width: 10%; text-align: center;">${isRtl ? 'الوحدة' : 'Unité'}</th>
            <th style="width: 10%; text-align: center;">${isRtl ? 'الكمية المطلوبة' : 'Qté Cde'}</th>
            ${isRec ? `<th style="width: 10%; text-align: center;">${isRtl ? 'الكمية المستلمة' : 'Qté Reçue'}</th>` : ''}
            <th style="width: 15%; text-align: right;">${isRtl ? 'السعر' : 'P.U. (DA)'}</th>
            <th style="width: 15%; text-align: right;">${isRtl ? 'المجموع' : 'Total (DA)'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `

    const totalsHtml = `
      <table class="totals-area">
        <tr class="total-grand">
          <td><strong>${isRtl ? 'المجموع الإجمالي' : 'Montant Total TTC (DA)'}:</strong></td>
          <td style="text-align: right;">${formatDa(p.total_amount)}</td>
        </tr>
      </table>
    `

    const signHtml = `
      <div class="signature-area">
        <div class="signature-box">
          <strong>${isRtl ? 'المورد / المسلم' : 'Le Fournisseur / Livreur'}</strong>
          <div class="signature-line"></div>
        </div>
        <div class="signature-box">
          <strong>${isRtl ? 'مسؤول المشتريات والمخزن' : 'Responsable Achats & Magasin WeFlow'}</strong>
          <div class="signature-line"></div>
        </div>
      </div>
    `

    return this.wrapHtml(header + suppInfo + tableHtml + totalsHtml + signHtml, isRtl)
  }

  // 7: Fiche technique de fabrication (matches Screenshot 03)
  private renderTechnicalSheetDoc(id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const ts = db.prepare(`
      SELECT ts.*, m.reference as model_ref, m.name as model_name, m.category, m.collection, m.gender
      FROM technical_sheets ts
      JOIN shoe_models m ON ts.model_id = m.id
      WHERE ts.id = ?
    `).get(id) as any

    if (!ts) throw new Error('Fiche technique introuvable')

    const items = db.prepare(`
      SELECT ti.*, m.code as mat_code, m.designation as mat_name, m.unit as mat_unit, m.unit_price as mat_price
      FROM technical_sheet_items ti
      JOIN raw_materials m ON ti.material_id = m.id
      WHERE ti.sheet_id = ?
    `).all(id) as any[]

    const title = isRtl ? 'البطاقة التقنية للتصنيع' : 'Fiche Technique de Fabrication'
    const header = renderHeader(company, title, `FT-${ts.model_ref}`, ts.updated_at.slice(0, 10), isRtl)

    const modelInfo = `
      <div class="info-grid">
        <div class="info-col" style="margin-${isRtl ? 'left' : 'right'}: 4mm;">
          <div class="info-col-title">${isRtl ? 'بيانات الموديل' : 'Informations Modèle'}</div>
          <strong>Modèle:</strong> ${ts.model_ref} — ${ts.model_name}<br>
          <strong>Catégorie:</strong> ${ts.category} | <strong>Genre:</strong> ${ts.gender}<br>
          <strong>Collection:</strong> ${ts.collection || 'Standard'}
        </div>
        <div class="info-col">
          <div class="info-col-title">${isRtl ? 'البيانات المالية المعيارية' : 'Coûts & Prix Cibles'}</div>
          <strong>Main d’œuvre estimée:</strong> ${formatDa(ts.labor_cost_per_pair)} / paire<br>
          <strong>Frais indirects usine:</strong> ${formatDa(ts.overhead_cost_per_pair)} / paire<br>
          <strong>Prix de vente conseillé:</strong> ${formatDa(ts.target_sale_price)}
        </div>
      </div>
    `

    let rowsHtml = ''
    items.forEach((it) => {
      const grossQty = it.base_quantity * (1 + (it.scrap_percentage || 0) / 100)
      const cost = grossQty * it.mat_price
      rowsHtml += `
        <tr>
          <td><strong>${it.mat_name}</strong> (${it.mat_code})</td>
          <td style="text-align: center;">${it.mat_unit}</td>
          <td style="text-align: center; font-weight: bold;">${it.base_quantity.toFixed(2)}</td>
          <td style="text-align: center; color: #dc2626;">${it.scrap_percentage}%</td>
          <td style="text-align: center;">${grossQty.toFixed(2)}</td>
          <td style="text-align: right;">${formatDa(it.mat_price)}</td>
          <td style="text-align: right; font-weight: bold;">${formatDa(cost)}</td>
        </tr>
      `
    })

    const tableHtml = `
      <h3 style="color: #142B45; border-bottom: 1.5px solid #203F60; padding-bottom: 2mm; margin-bottom: 3mm;">
        ${isRtl ? 'جدول استهلاك المواد الأولية / Tableau de consommation des matières premières' : 'Tableau de Consommation des Matières Premières'}
      </h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRtl ? 'المادة الأولية' : 'Matière'}</th>
            <th style="text-align: center;">${isRtl ? 'الوحدة' : 'Unité'}</th>
            <th style="text-align: center;">${isRtl ? 'الكمية المقدرة' : 'Qté Nette'}</th>
            <th style="text-align: center;">${isRtl ? 'الهدر المسموح' : 'Perte %'}</th>
            <th style="text-align: center;">${isRtl ? 'الكمية الإجمالية' : 'Qté Brute'}</th>
            <th style="text-align: right;">${isRtl ? 'السعر' : 'P.U. (DA)'}</th>
            <th style="text-align: right;">${isRtl ? 'التكلفة / زوج' : 'Coût / Paire'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `

    const notesHtml = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4mm; margin-top: 4mm;">
        <strong style="color: #142B45;">Notes Techniques & Consignes d’Assemblage :</strong><br>
        ${ts.notes || 'Respecter les spécifications techniques de découpe et de collage thermique.'}
      </div>
    `

    return this.wrapHtml(header + modelInfo + tableHtml + notesHtml, isRtl)
  }

  // 8: Ordre de fabrication (OF) (matches Screenshot 05)
  private renderProductionOrderDoc(id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const po = db.prepare(`
      SELECT po.*, m.reference as model_ref, m.name as model_name, m.category, m.photo_url
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      WHERE po.id = ?
    `).get(id) as any

    if (!po) throw new Error('Ordre de fabrication introuvable')

    const title = isRtl ? 'أمر الإنتاج والتصنيع' : 'Ordre de Fabrication (OF)'
    const header = renderHeader(company, title, po.order_number, po.start_date, isRtl)

    let sizeBreakdown: Record<string, number> = {}
    try {
      sizeBreakdown = JSON.parse(po.size_breakdown_json)
    } catch {
      // ignore
    }

    let sizeHeaders = ''
    let sizeValues = ''
    for (const [sz, qty] of Object.entries(sizeBreakdown)) {
      sizeHeaders += `<th style="text-align: center; background: #203F60; color: #fff; padding: 2mm;">Taille ${sz}</th>`
      sizeValues += `<td style="text-align: center; font-weight: bold; font-size: 11pt; padding: 3mm; color: #F28A27;">${qty}</td>`
    }

    const sizeMatrixHtml = `
      <h3 style="color: #142B45; margin-bottom: 2mm;">${isRtl ? 'توزيع مقاسات الأحذية / Grille de production par pointure' : 'Matrice de Production par Pointure'}</h3>
      <table class="data-table" style="margin-bottom: 5mm;">
        <thead>
          <tr>
            <th style="text-align: left; background: #142B45; color: #fff;">Désignation / Pointures</th>
            ${sizeHeaders}
            <th style="text-align: center; background: #142B45; color: #fff;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${po.model_ref} - ${po.color}</strong></td>
            ${sizeValues}
            <td style="text-align: center; font-weight: 800; font-size: 12pt; background: #f1f5f9;">${po.total_quantity} paires</td>
          </tr>
        </tbody>
      </table>
    `

    const stages = db.prepare(`
      SELECT * FROM production_stages WHERE production_order_id = ? ORDER BY stage_number ASC
    `).all(id) as any[]

    let stagesRows = ''
    stages.forEach((st) => {
      stagesRows += `
        <tr>
          <td style="text-align: center; font-weight: bold;">0${st.stage_number}</td>
          <td><strong>${st.stage_name_fr}</strong> (${st.stage_name_ar})</td>
          <td style="text-align: center;">${st.planned_quantity}</td>
          <td style="text-align: center; color: #16a34a; font-weight: bold;">${st.completed_quantity}</td>
          <td style="text-align: center; color: #dc2626;">${st.rejected_quantity}</td>
          <td style="text-align: center;">${st.completion_percent}%</td>
          <td style="text-align: center;"><strong>${st.status}</strong></td>
          <td>${st.operator_name || '-'}</td>
        </tr>
      `
    })

    const stagesHtml = `
      <h3 style="color: #142B45; margin-bottom: 2mm;">${isRtl ? 'متابعة مراحل الإنتاج السبعة' : 'Suivi des 7 Étapes de Fabrication'}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 6%; text-align: center;">Étape</th>
            <th style="width: 26%;">Phase</th>
            <th style="width: 10%; text-align: center;">Prévu</th>
            <th style="width: 10%; text-align: center;">Terminé</th>
            <th style="width: 10%; text-align: center;">Rejeté</th>
            <th style="width: 10%; text-align: center;">Taux %</th>
            <th style="width: 14%; text-align: center;">Statut</th>
            <th style="width: 14%;">Opérateur</th>
          </tr>
        </thead>
        <tbody>
          ${stagesRows}
        </tbody>
      </table>
    `

    const signHtml = `
      <div class="signature-area">
        <div class="signature-box">
          <strong>${isRtl ? 'المشرف على الورشة' : 'Chef d’Atelier Fabrication'}</strong>
          <div class="signature-line"></div>
        </div>
        <div class="signature-box">
          <strong>${isRtl ? 'مدير المصنع' : 'Directeur de Production'}</strong>
          <div class="signature-line"></div>
        </div>
      </div>
    `

    return this.wrapHtml(header + sizeMatrixHtml + stagesHtml + signHtml, isRtl)
  }

  // 9: Fiche de suivi de production (Kanban / Workflow report)
  private renderProductionTrackingDoc(id: number, company: any, isRtl: boolean): string {
    return this.renderProductionOrderDoc(id, company, isRtl)
  }

  // 10: Rapport de consommation matières premières
  private renderMaterialConsumptionReport(id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const po = db.prepare(`
      SELECT po.*, m.reference as model_ref, m.name as model_name
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      WHERE po.id = ?
    `).get(id) as any

    if (!po) throw new Error('Ordre introuvable')

    const cons = db.prepare(`
      SELECT pmc.*, m.code as mat_code, m.designation as mat_name, m.unit as mat_unit
      FROM production_material_consumptions pmc
      JOIN raw_materials m ON pmc.material_id = m.id
      WHERE pmc.production_order_id = ?
    `).all(id) as any[]

    const title = isRtl ? 'تقرير استهلاك المواد الأولية' : 'Rapport de Consommation Matières Premières'
    const header = renderHeader(company, title, `CONS-${po.order_number}`, new Date().toISOString().slice(0, 10), isRtl)

    let rows = ''
    let totalCost = 0
    cons.forEach((c) => {
      totalCost += c.cost_applied
      rows += `
        <tr>
          <td><strong>${c.mat_code}</strong></td>
          <td>${c.mat_name}</td>
          <td style="text-align: center;">${c.quantity_consumed} ${c.mat_unit}</td>
          <td style="text-align: center; color: #dc2626;">${c.scrap_quantity} ${c.mat_unit}</td>
          <td style="text-align: right; font-weight: bold;">${formatDa(c.cost_applied)}</td>
          <td>${c.recorded_at.slice(0, 10)}</td>
        </tr>
      `
    })

    const content = `
      <div style="margin-bottom: 4mm;">
        <strong>Ordre de fabrication :</strong> ${po.order_number} (${po.model_ref} - ${po.model_name}) | <strong>Volume :</strong> ${po.total_quantity} paires
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Matière Première</th>
            <th style="text-align: center;">Quantité Consommée</th>
            <th style="text-align: center;">Pertes constatées</th>
            <th style="text-align: right;">Coût Total Imputé</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align: center; padding: 4mm;">Aucune consommation enregistrée</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #142B45; color: #fff; font-weight: bold;">
            <td colspan="4" style="text-align: right;">TOTAL COÛT MATIÈRES :</td>
            <td style="text-align: right;">${formatDa(totalCost)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `
    return this.wrapHtml(header + content, isRtl)
  }

  // 11, 12: Rapport de stock & Rapport d'inventaire
  private renderStockInventoryReport(docType: string, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const materials = db.prepare('SELECT * FROM raw_materials ORDER BY category ASC, code ASC').all() as any[]
    const variants = db.prepare(`
      SELECT v.*, m.reference as model_ref, m.name as model_name
      FROM shoe_variants v
      JOIN shoe_models m ON v.model_id = m.id
      WHERE v.stock_finished > 0
      ORDER BY m.reference ASC, v.size ASC
    `).all() as any[]

    const title = docType.includes('inventaire')
      ? (isRtl ? 'تقرير الجرد العام للمخزون' : 'Rapport d’Inventaire Physique du Stock')
      : (isRtl ? 'تقرير وضعية المخزون العام' : 'État Récapitulatif du Stock')
    const header = renderHeader(company, title, `INV-${new Date().toISOString().slice(0, 10)}`, new Date().toISOString().slice(0, 10), isRtl)

    let matRows = ''
    let totalMatValue = 0
    materials.forEach((m) => {
      const val = m.stock_quantity * m.unit_price
      totalMatValue += val
      matRows += `
        <tr>
          <td><strong>${m.code}</strong></td>
          <td>${m.designation}</td>
          <td>${m.category}</td>
          <td style="text-align: center; font-weight: bold;">${m.stock_quantity} ${m.unit}</td>
          <td style="text-align: center;">${m.min_threshold}</td>
          <td style="text-align: right;">${formatDa(m.unit_price)}</td>
          <td style="text-align: right; font-weight: bold;">${formatDa(val)}</td>
          <td style="text-align: center; color: ${m.stock_quantity <= m.min_threshold ? '#dc2626' : '#16a34a'}; font-weight: bold;">${m.status}</td>
        </tr>
      `
    })

    let finRows = ''
    let totalPairs = 0
    variants.forEach((v) => {
      totalPairs += v.stock_finished
      finRows += `
        <tr>
          <td><strong>${v.model_ref}</strong></td>
          <td>${v.model_name}</td>
          <td style="text-align: center;">${v.color}</td>
          <td style="text-align: center; font-weight: bold; color: #F28A27;">${v.size}</td>
          <td style="text-align: center; font-weight: bold;">${v.stock_finished} paires</td>
          <td style="text-align: center;">${v.barcode || '-'}</td>
        </tr>
      `
    })

    const content = `
      <h3 style="color: #142B45;">1. Stock des Matières Premières & Composants</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Désignation</th>
            <th>Catégorie</th>
            <th style="text-align: center;">Stock Dispo</th>
            <th style="text-align: center;">Seuil Min</th>
            <th style="text-align: right;">Prix Achat</th>
            <th style="text-align: right;">Valeur Stock</th>
            <th style="text-align: center;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${matRows}
        </tbody>
        <tfoot>
          <tr style="background: #203F60; color: #fff; font-weight: bold;">
            <td colspan="6" style="text-align: right;">VALEUR TOTALE MATIÈRES :</td>
            <td style="text-align: right;">${formatDa(totalMatValue)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <h3 style="color: #142B45; margin-top: 6mm;">2. Stock des Produits Finis (Chaussures Disponibles)</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Réf</th>
            <th>Modèle</th>
            <th style="text-align: center;">Couleur</th>
            <th style="text-align: center;">Pointure</th>
            <th style="text-align: center;">Stock Disponible</th>
            <th style="text-align: center;">Code-barres</th>
          </tr>
        </thead>
        <tbody>
          ${finRows || '<tr><td colspan="6" style="text-align: center; padding: 4mm;">Aucun produit fini en stock</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #142B45; color: #fff; font-weight: bold;">
            <td colspan="4" style="text-align: right;">TOTAL PAIRES DISPONIBLES :</td>
            <td style="text-align: center;">${totalPairs} paires</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `
    return this.wrapHtml(header + content, isRtl)
  }

  // 13: Rapport de contrôle qualité
  private renderQualityReport(id: number, company: any, isRtl: boolean): string {
    const db = getDatabase()
    const q = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(id) as any
    if (!q) throw new Error('Contrôle qualité introuvable')

    const title = isRtl ? 'تقرير فحص ومراقبة الجودة' : 'Rapport de Contrôle Qualité'
    const header = renderHeader(company, title, `QUAL-${q.lot_number}`, q.inspection_date, isRtl)

    const content = `
      <div class="info-grid">
        <div class="info-col" style="margin-${isRtl ? 'left' : 'right'}: 4mm;">
          <div class="info-col-title">Informations Lot Inspecté</div>
          <strong>Numéro de Lot:</strong> ${q.lot_number}<br>
          <strong>Modèle:</strong> ${q.model_name}<br>
          <strong>Pointure:</strong> ${q.size || 'Toutes'}<br>
          <strong>Inspecteur:</strong> ${q.inspector_name}
        </div>
        <div class="info-col">
          <div class="info-col-title">Résultats de l'Inspection</div>
          <strong>Quantité inspectée:</strong> ${q.quantity_inspected} paires<br>
          <strong>Quantité acceptée:</strong> <span style="color: #16a34a; font-weight: bold;">${q.quantity_accepted}</span><br>
          <strong>Quantité rejetée:</strong> <span style="color: #dc2626; font-weight: bold;">${q.quantity_rejected}</span><br>
          <strong>Décision:</strong> ${q.action_taken}
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Défaut Constaté</th>
            <th>Gravité</th>
            <th>Mesure Corrective</th>
            <th>Observations</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${q.defect_cause || 'Aucun défaut majeur'}</strong></td>
            <td>${q.severity}</td>
            <td>${q.action_taken}</td>
            <td>${q.notes || '-'}</td>
          </tr>
        </tbody>
      </table>
    `
    return this.wrapHtml(header + content, isRtl)
  }

  // 14: Rapport des coûts de revient (matches Screenshot 10)
  private renderCostReport(modelId: number, company: any, isRtl: boolean): string {
    const cost = costCalculationService.calculateModel(modelId)
    const title = isRtl ? 'تقرير حساب التكاليف وهوامش الربح' : 'Rapport Détaillé du Coût de Revient'
    const header = renderHeader(company, title, `COUT-${cost.model_reference}`, new Date().toISOString().slice(0, 10), isRtl)

    const content = `
      <div style="margin-bottom: 4mm;">
        <h3 style="color: #142B45; margin: 0 0 1mm 0;">Modèle : ${cost.model_reference} — ${cost.model_name}</h3>
        <div>Pointure de référence : ${cost.size} | Couleur : ${cost.color}</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Composant du Coût de Revient</th>
            <th style="text-align: right;">Coût Unitaire (DA)</th>
            <th style="text-align: center;">Part du Coût %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Matières Premières de Base (Cuir)</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatDa(cost.raw_materials_cost)}</td>
            <td style="text-align: center;">${Math.round((cost.raw_materials_cost / cost.total_unit_cost) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Semelles & Éléments de Semelage</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatDa(cost.soles_cost)}</td>
            <td style="text-align: center;">${Math.round((cost.soles_cost / cost.total_unit_cost) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Accessoires, Doublures, Fils & Lacets</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatDa(cost.accessories_cost)}</td>
            <td style="text-align: center;">${Math.round((cost.accessories_cost / cost.total_unit_cost) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Main d’Œuvre Directe (Coupe, Piquage, Montage)</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatDa(cost.labor_cost)}</td>
            <td style="text-align: center;">${Math.round((cost.labor_cost / cost.total_unit_cost) * 100)}%</td>
          </tr>
          <tr>
            <td><strong>Frais Indirects Usine & Amortissement Machines</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatDa(cost.production_expenses)}</td>
            <td style="text-align: center;">${Math.round((cost.production_expenses / cost.total_unit_cost) * 100)}%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #203F60; color: #fff; font-weight: bold; font-size: 10.5pt;">
            <td>COÛT DE REVIENT TOTAL :</td>
            <td style="text-align: right;">${formatDa(cost.total_unit_cost)}</td>
            <td style="text-align: center;">100%</td>
          </tr>
          <tr style="background: #142B45; color: #fff; font-weight: bold; font-size: 11pt;">
            <td>PRIX DE VENTE CONSEILLÉ :</td>
            <td style="text-align: right;">${formatDa(cost.sale_price)}</td>
            <td></td>
          </tr>
          <tr style="background: #f1f5f9; font-weight: 800; font-size: 11pt; color: #16a34a;">
            <td>MARGE BRUTE DÉGAGÉE :</td>
            <td style="text-align: right;">+${formatDa(cost.gross_margin)}</td>
            <td style="text-align: center;">+${cost.margin_percentage}%</td>
          </tr>
        </tfoot>
      </table>
    `
    return this.wrapHtml(header + content, isRtl)
  }

  // 15: Rapport global de production
  private renderProductionGlobalReport(company: any, isRtl: boolean): string {
    const db = getDatabase()
    const orders = db.prepare(`
      SELECT po.*, m.reference as model_ref, m.name as model_name
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      ORDER BY po.id DESC
    `).all() as any[]

    const title = isRtl ? 'التقرير الشامل لنشاط الإنتاج' : 'Rapport Général d’Activité de Production'
    const header = renderHeader(company, title, `PROD-${new Date().toISOString().slice(0, 10)}`, new Date().toISOString().slice(0, 10), isRtl)

    let rows = ''
    orders.forEach((o) => {
      rows += `
        <tr>
          <td><strong>${o.order_number}</strong></td>
          <td>${o.model_ref} - ${o.model_name}</td>
          <td style="text-align: center;">${o.color}</td>
          <td style="text-align: center; font-weight: bold;">${o.total_quantity} paires</td>
          <td style="text-align: center;">${o.start_date}</td>
          <td style="text-align: center;">${o.due_date}</td>
          <td style="text-align: center;">${o.completion_percentage}%</td>
          <td style="text-align: center;"><strong>${o.status}</strong></td>
        </tr>
      `
    })

    const content = `
      <table class="data-table">
        <thead>
          <tr>
            <th>N° OF</th>
            <th>Modèle</th>
            <th style="text-align: center;">Couleur</th>
            <th style="text-align: center;">Volume</th>
            <th style="text-align: center;">Date Début</th>
            <th style="text-align: center;">Échéance</th>
            <th style="text-align: center;">Avancement</th>
            <th style="text-align: center;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
    return this.wrapHtml(header + content, isRtl)
  }
}

export const documentService = new DocumentService()
