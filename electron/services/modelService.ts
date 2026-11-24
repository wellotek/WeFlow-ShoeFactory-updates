import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { ShoeModel, ShoeVariant } from '@shared/types'

export class ModelService {
  list(filters?: { category?: string; gender?: string; search?: string }): ShoeModel[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM shoe_models WHERE 1=1'
    const params: any[] = []

    if (filters?.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }
    if (filters?.gender) {
      sql += ' AND gender = ?'
      params.push(filters.gender)
    }
    if (filters?.search) {
      sql += ' AND (reference LIKE ? OR name LIKE ? OR description LIKE ?)'
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY id DESC'
    const rows = db.prepare(sql).all(...params) as any[]

    return rows.map((r) => this.mapRowToModel(r, db))
  }

  getById(id: number): ShoeModel | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM shoe_models WHERE id = ?').get(id) as any
    if (!row) return null
    return this.mapRowToModel(row, db)
  }

  create(data: Partial<ShoeModel> & { variants?: Partial<ShoeVariant>[] }): ShoeModel {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    const stmt = db.prepare(`
      INSERT INTO shoe_models (reference, name, category, gender, season, collection, description, photo_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      data.reference,
      data.name,
      data.category || 'Classique',
      data.gender || 'Homme',
      data.season || '',
      data.collection || '',
      data.description || '',
      data.photo_url || null,
      data.status || 'Actif',
      now,
      now
    )

    const modelId = Number(result.lastInsertRowid)

    if (data.variants && data.variants.length > 0) {
      const varStmt = db.prepare(`
        INSERT INTO shoe_variants (model_id, color, size, barcode, sku, stock_finished, stock_reserved)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const v of data.variants) {
        varStmt.run(
          modelId,
          v.color || 'Noir',
          v.size || 40,
          v.barcode || null,
          v.sku || `${data.reference}-${v.color}-${v.size}`,
          v.stock_finished || 0,
          v.stock_reserved || 0
        )
      }
    } else {
      // Default initial size matrix
      const defaultSizes = data.gender === 'Femme' ? [36, 37, 38, 39, 40, 41] : data.gender === 'Enfant' ? [28, 29, 30, 31, 32, 33, 34, 35] : [39, 40, 41, 42, 43, 44]
      const varStmt = db.prepare(`
        INSERT INTO shoe_variants (model_id, color, size, barcode, sku, stock_finished, stock_reserved)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const sz of defaultSizes) {
        varStmt.run(modelId, 'Noir', sz, null, `${data.reference}-NOIR-${sz}`, 0, 0)
      }
    }

    return this.getById(modelId)!
  }

  update(id: number, data: Partial<ShoeModel> & { variants?: Partial<ShoeVariant>[] }): ShoeModel {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()
    const current = this.getById(id)
    if (!current) throw new Error('Modèle introuvable')

    db.prepare(`
      UPDATE shoe_models SET
        reference = ?, name = ?, category = ?, gender = ?, season = ?,
        collection = ?, description = ?, photo_url = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.reference ?? current.reference,
      data.name ?? current.name,
      data.category ?? current.category,
      data.gender ?? current.gender,
      data.season ?? current.season,
      data.collection ?? current.collection,
      data.description ?? current.description,
      data.photo_url !== undefined ? data.photo_url : current.photo_url,
      data.status ?? current.status,
      now,
      id
    )

    if (data.variants && data.variants.length > 0) {
      db.prepare('DELETE FROM shoe_variants WHERE model_id = ?').run(id)
      const varStmt = db.prepare(`
        INSERT INTO shoe_variants (model_id, color, size, barcode, sku, stock_finished, stock_reserved)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const v of data.variants) {
        varStmt.run(
          id,
          v.color || 'Noir',
          v.size || 40,
          v.barcode || null,
          v.sku || `${current.reference}-${v.color}-${v.size}`,
          v.stock_finished || 0,
          v.stock_reserved || 0
        )
      }
    }

    return this.getById(id)!
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM shoe_models WHERE id = ?').run(id)
    return res.changes > 0
  }

  private mapRowToModel(row: any, db: any): ShoeModel {
    const variants = db.prepare('SELECT * FROM shoe_variants WHERE model_id = ? ORDER BY size ASC').all(row.id) as ShoeVariant[]
    return {
      id: row.id,
      reference: row.reference,
      name: row.name,
      category: row.category,
      gender: row.gender,
      season: row.season,
      collection: row.collection,
      description: row.description,
      photo_url: row.photo_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      variants
    }
  }
}

export const modelService = new ModelService()
