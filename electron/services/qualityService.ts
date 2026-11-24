import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { QualityInspection } from '@shared/types'

export class QualityService {
  list(filters?: { modelId?: number; severity?: string }): QualityInspection[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM quality_inspections WHERE 1=1'
    const params: any[] = []

    if (filters?.modelId) {
      sql += ' AND model_id = ?'
      params.push(filters.modelId)
    }
    if (filters?.severity) {
      sql += ' AND severity = ?'
      params.push(filters.severity)
    }

    sql += ' ORDER BY id DESC'
    return db.prepare(sql).all(...params) as QualityInspection[]
  }

  getById(id: number): QualityInspection | null {
    assertLicensed()
    const db = getDatabase()
    return (db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(id) as QualityInspection) || null
  }

  recordInspection(data: Partial<QualityInspection>): QualityInspection {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    const seqRow = db.prepare("SELECT current_number, prefix FROM document_sequences WHERE doc_type = 'quality_lot'").get() as any
    const nextSeq = (seqRow?.current_number || 2084) + 1
    const lotNumber = data.lot_number || `${seqRow?.prefix || 'B-'}${String(nextSeq)}`

    const stmt = db.prepare(`
      INSERT INTO quality_inspections (
        lot_number, production_order_id, model_id, model_name, size,
        quantity_inspected, quantity_accepted, quantity_rejected, defect_cause,
        severity, action_taken, notes, inspector_name, inspection_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const res = stmt.run(
      lotNumber,
      data.production_order_id || null,
      data.model_id || null,
      data.model_name || 'Modèle Chaussure',
      data.size || null,
      data.quantity_inspected || 0,
      data.quantity_accepted || 0,
      data.quantity_rejected || 0,
      data.defect_cause || '',
      data.severity || 'Moyenne',
      data.action_taken || 'Rejeté',
      data.notes || '',
      data.inspector_name || 'Contrôleur Qualité',
      data.inspection_date || now.slice(0, 10)
    )

    db.prepare("UPDATE document_sequences SET current_number = ? WHERE doc_type = 'quality_lot'").run(nextSeq)

    return this.getById(Number(res.lastInsertRowid))!
  }
}

export const qualityService = new QualityService()
