import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { Client, Supplier } from '@shared/types'

export class ClientSupplierService {
  // --- CLIENTS ---
  listClients(search?: string): Client[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM customers WHERE 1=1'
    const params: any[] = []
    if (search) {
      sql += ' AND (name LIKE ? OR company LIKE ? OR phone LIKE ? OR wilaya LIKE ?)'
      const term = `%${search}%`
      params.push(term, term, term, term)
    }
    sql += ' ORDER BY name ASC'
    return db.prepare(sql).all(...params) as Client[]
  }

  getClientById(id: number): Client | null {
    assertLicensed()
    const db = getDatabase()
    return (db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Client) || null
  }

  createClient(data: Partial<Client>): Client {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()
    const stmt = db.prepare(`
      INSERT INTO customers (name, company, phone, email, address, wilaya, notes, balance_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const res = stmt.run(
      data.name,
      data.company || null,
      data.phone || '',
      data.email || null,
      data.address || null,
      data.wilaya || '16 - Alger',
      data.notes || null,
      data.balance_due || 0,
      now
    )
    return this.getClientById(Number(res.lastInsertRowid))!
  }

  updateClient(id: number, data: Partial<Client>): Client {
    assertLicensed()
    const db = getDatabase()
    const current = this.getClientById(id)
    if (!current) throw new Error('Client introuvable')

    db.prepare(`
      UPDATE customers SET
        name = ?, company = ?, phone = ?, email = ?, address = ?,
        wilaya = ?, notes = ?, balance_due = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.company !== undefined ? data.company : current.company,
      data.phone ?? current.phone,
      data.email !== undefined ? data.email : current.email,
      data.address !== undefined ? data.address : current.address,
      data.wilaya ?? current.wilaya,
      data.notes !== undefined ? data.notes : current.notes,
      data.balance_due ?? current.balance_due,
      id
    )
    return this.getClientById(id)!
  }

  deleteClient(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM customers WHERE id = ?').run(id)
    return res.changes > 0
  }

  // --- SUPPLIERS ---
  listSuppliers(search?: string): Supplier[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM suppliers WHERE 1=1'
    const params: any[] = []
    if (search) {
      sql += ' AND (name LIKE ? OR company LIKE ? OR phone LIKE ? OR provided_products LIKE ?)'
      const term = `%${search}%`
      params.push(term, term, term, term)
    }
    sql += ' ORDER BY company ASC, name ASC'
    return db.prepare(sql).all(...params) as Supplier[]
  }

  getSupplierById(id: number): Supplier | null {
    assertLicensed()
    const db = getDatabase()
    return (db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier) || null
  }

  createSupplier(data: Partial<Supplier>): Supplier {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()
    const stmt = db.prepare(`
      INSERT INTO suppliers (name, company, phone, email, address, wilaya, provided_products, balance_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const res = stmt.run(
      data.name,
      data.company || null,
      data.phone || '',
      data.email || null,
      data.address || null,
      data.wilaya || '16 - Alger',
      data.provided_products || null,
      data.balance_due || 0,
      now
    )
    return this.getSupplierById(Number(res.lastInsertRowid))!
  }

  updateSupplier(id: number, data: Partial<Supplier>): Supplier {
    assertLicensed()
    const db = getDatabase()
    const current = this.getSupplierById(id)
    if (!current) throw new Error('Fournisseur introuvable')

    db.prepare(`
      UPDATE suppliers SET
        name = ?, company = ?, phone = ?, email = ?, address = ?,
        wilaya = ?, provided_products = ?, balance_due = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.company !== undefined ? data.company : current.company,
      data.phone ?? current.phone,
      data.email !== undefined ? data.email : current.email,
      data.address !== undefined ? data.address : current.address,
      data.wilaya ?? current.wilaya,
      data.provided_products !== undefined ? data.provided_products : current.provided_products,
      data.balance_due ?? current.balance_due,
      id
    )
    return this.getSupplierById(id)!
  }

  deleteSupplier(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM suppliers WHERE id = ?').run(id)
    return res.changes > 0
  }
}

export const clientSupplierService = new ClientSupplierService()
