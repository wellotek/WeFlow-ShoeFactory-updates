import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import type { Machine, MachineMaintenance } from '@shared/types'

export class MachineService {
  list(status?: string): Machine[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM machines WHERE 1=1'
    const params: any[] = []

    if (status && status !== 'Tous') {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY code ASC'
    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): Machine | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as any
    if (!row) return null
    return this.mapRow(row, db)
  }

  create(data: Partial<Machine>): Machine {
    assertLicensed()
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO machines (code, name, machine_type, acquisition_date, status, location, next_maintenance_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const res = stmt.run(
      data.code,
      data.name,
      data.machine_type || 'Général',
      data.acquisition_date || null,
      data.status || 'Active',
      data.location || null,
      data.next_maintenance_date || null,
      data.notes || null
    )

    return this.getById(Number(res.lastInsertRowid))!
  }

  update(id: number, data: Partial<Machine>): Machine {
    assertLicensed()
    const db = getDatabase()
    const current = this.getById(id)
    if (!current) throw new Error('Machine introuvable')

    db.prepare(`
      UPDATE machines SET
        code = ?, name = ?, machine_type = ?, acquisition_date = ?, status = ?,
        location = ?, next_maintenance_date = ?, notes = ?
      WHERE id = ?
    `).run(
      data.code ?? current.code,
      data.name ?? current.name,
      data.machine_type ?? current.machine_type,
      data.acquisition_date !== undefined ? data.acquisition_date : current.acquisition_date,
      data.status ?? current.status,
      data.location !== undefined ? data.location : current.location,
      data.next_maintenance_date !== undefined ? data.next_maintenance_date : current.next_maintenance_date,
      data.notes !== undefined ? data.notes : current.notes,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM machines WHERE id = ?').run(id)
    return res.changes > 0
  }

  listMaintenance(machineId?: number): MachineMaintenance[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT mm.*, m.name as machine_name
      FROM machine_maintenances mm
      JOIN machines m ON mm.machine_id = m.id
    `
    const params: any[] = []
    if (machineId) {
      sql += ' WHERE mm.machine_id = ?'
      params.push(machineId)
    }
    sql += ' ORDER BY mm.intervention_date DESC'

    return db.prepare(sql).all(...params) as MachineMaintenance[]
  }

  createMaintenance(data: Partial<MachineMaintenance>): MachineMaintenance {
    assertLicensed()
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO machine_maintenances (machine_id, maintenance_type, intervention_date, cost, description, technician_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const res = stmt.run(
      data.machine_id,
      data.maintenance_type || 'Préventive',
      data.intervention_date || new Date().toISOString().slice(0, 10),
      data.cost || 0,
      data.description || '',
      data.technician_name || 'Technicien Interne',
      data.status || 'Planifiée'
    )

    return db.prepare('SELECT * FROM machine_maintenances WHERE id = ?').get(Number(res.lastInsertRowid)) as MachineMaintenance
  }

  updateMaintenance(id: number, data: Partial<MachineMaintenance>): MachineMaintenance {
    assertLicensed()
    const db = getDatabase()
    db.prepare(`
      UPDATE machine_maintenances SET
        maintenance_type = COALESCE(?, maintenance_type),
        intervention_date = COALESCE(?, intervention_date),
        cost = COALESCE(?, cost),
        description = COALESCE(?, description),
        technician_name = COALESCE(?, technician_name),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      data.maintenance_type ?? null,
      data.intervention_date ?? null,
      data.cost ?? null,
      data.description ?? null,
      data.technician_name ?? null,
      data.status ?? null,
      id
    )

    return db.prepare('SELECT * FROM machine_maintenances WHERE id = ?').get(id) as MachineMaintenance
  }

  private mapRow(r: any, db: any): Machine {
    const maintenances = db.prepare('SELECT * FROM machine_maintenances WHERE machine_id = ? ORDER BY intervention_date DESC').all(r.id) as MachineMaintenance[]
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      machine_type: r.machine_type,
      acquisition_date: r.acquisition_date,
      status: r.status,
      location: r.location,
      next_maintenance_date: r.next_maintenance_date,
      notes: r.notes,
      maintenances
    }
  }
}

export const machineService = new MachineService()
