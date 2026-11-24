import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { migrate } from '../../electron/database/migrate'
import { setDatabaseForTesting } from '../../electron/database/connection'
import { setLicenseServiceForTesting } from '../../electron/license/guard'
import { documentService } from '../../electron/services/documentService'
import { labelService } from '../../electron/services/labelService'

describe('Document Generation & Print Templates Integration', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    setDatabaseForTesting(db)
    migrate(db)
    setLicenseServiceForTesting({
      isLicenseActivatedSync: () => true
    })
  })

  afterEach(() => {
    setLicenseServiceForTesting(null)
    db.close()
    setDatabaseForTesting(null)
  })

  it('renders Devis, Facture and Bon de Commande in FR and AR', () => {
    const devisFr = documentService.renderDocumentHtml('devis', 1, 'fr')
    expect(devisFr).toContain('Devis Estimatif')
    expect(devisFr).toContain('CMD-2024-0482'.replace('CMD-', 'DEV-'))
    expect(devisFr).toContain('DA')

    const factureAr = documentService.renderDocumentHtml('facture', 1, 'ar')
    expect(factureAr).toContain('فاتورة تجارية')
    expect(factureAr).toContain('dir="rtl"')
    expect(factureAr).toContain('DA')
  })

  it('renders Bon de Livraison (BL) with full quantities and signatures', () => {
    const blHtml = documentService.renderDocumentHtml('bon_livraison', 1, 'fr')
    expect(blHtml).toContain('Bon de Livraison')
    expect(blHtml).toContain('BL-9482')
    expect(blHtml).toContain('Le Client')
    expect(blHtml).toContain('Magasin Expéditions')
  })

  it('renders Fiche Technique de Fabrication with consumption table', () => {
    const ftHtml = documentService.renderDocumentHtml('fiche_technique', 1, 'fr')
    expect(ftHtml).toContain('Fiche Technique de Fabrication')
    expect(ftHtml).toContain('FT-SF-001')
    expect(ftHtml).toContain('Cuir naturel bovin noir')
    expect(ftHtml).toContain('Tableau de Consommation')
  })

  it('renders Ordre de Fabrication with 7-stage tracking and size matrix', () => {
    const ofHtml = documentService.renderDocumentHtml('ordre_fabrication', 1, 'fr')
    expect(ofHtml).toContain('Ordre de Fabrication')
    expect(ofHtml).toContain('PR-2026-015')
    expect(ofHtml).toContain('Coupe')
    expect(ofHtml).toContain('Piquage')
    expect(ofHtml).toContain('Emballage')
    expect(ofHtml).toContain('120 paires')
  })

  it('renders Stock and Inventory reports with valuation in DA', () => {
    const stockHtml = documentService.renderDocumentHtml('stock_report', 1, 'fr')
    expect(stockHtml).toContain('État Récapitulatif du Stock')
    expect(stockHtml).toContain('Cuir naturel bovin noir')
    expect(stockHtml).toContain('VALEUR TOTALE')
  })

  it('renders Quality Inspection report', () => {
    const qualHtml = documentService.renderDocumentHtml('quality_report', 1, 'fr')
    expect(qualHtml).toContain('Rapport de Contrôle Qualité')
    expect(qualHtml).toContain('B-2084')
    expect(qualHtml).toContain('Couture')
  })

  it('renders Cost of Production report matching Screenshot 10 breakdown', () => {
    const costHtml = documentService.renderDocumentHtml('cost_report', 1, 'fr')
    expect(costHtml).toContain('Rapport Détaillé du Coût de Revient')
    expect(costHtml).toContain('SF-001')
    expect(costHtml).toContain('COÛT DE REVIENT TOTAL')
    expect(costHtml).toContain('MARGE BRUTE DÉGAGÉE')
    expect(costHtml).toContain('34.6%')
  })

  it('renders Product, Box and Batch Labels with Code 128 / QR codes', async () => {
    const templates = labelService.listTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(3)

    const boxTemplate = templates.find((t) => t.id === 'shoe_box_standard')!
    const labelHtml = await labelService.renderLabelHtml(boxTemplate, {
      reference: 'SF-001',
      productName: 'Homme Classique',
      color: 'Noir',
      size: 42,
      lotNumber: 'PR-2026-015',
      barcodeValue: '61300010042'
    }, 2)

    expect(labelHtml).toContain('WeFlow ShoeFactory')
    expect(labelHtml).toContain('SF-001')
    expect(labelHtml).toContain('42')
    expect(labelHtml).toContain('<svg')
  })
})
