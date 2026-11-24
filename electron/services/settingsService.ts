import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import type { AppSettings, CompanyProfile } from '@shared/types'

export class SettingsService {
  getCompanyProfile(): CompanyProfile {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM company_profile WHERE id = 1').get() as any
    if (!row) {
      return {
        name: 'WeFlow ShoeFactory SARL',
        activity: 'Fabrication et Façonnage de Chaussures et Maroquinerie',
        address: 'Zone Industrielle Oued Smar, Lot 45',
        city: 'Alger',
        wilaya: '16 - Alger',
        phone: '0550 12 34 56',
        email: 'contact@weflow-shoes.dz',
        rc: '16/00-1234567B22',
        nif: '002216012345678',
        nis: '0022160100123',
        ai: '16012345678'
      }
    }
    return {
      name: row.name,
      activity: row.activity,
      address: row.address,
      city: row.city,
      wilaya: row.wilaya,
      phone: row.phone,
      email: row.email,
      rc: row.rc,
      nif: row.nif,
      nis: row.nis,
      ai: row.ai,
      logoUrl: row.logo_url
    }
  }

  updateCompanyProfile(profile: Partial<CompanyProfile>): CompanyProfile {
    assertLicensed()
    const db = getDatabase()
    const current = this.getCompanyProfile()

    db.prepare(`
      UPDATE company_profile SET
        name = ?, activity = ?, address = ?, city = ?, wilaya = ?,
        phone = ?, email = ?, rc = ?, nif = ?, nis = ?, ai = ?, logo_url = ?
      WHERE id = 1
    `).run(
      profile.name ?? current.name,
      profile.activity ?? current.activity,
      profile.address ?? current.address,
      profile.city ?? current.city,
      profile.wilaya ?? current.wilaya,
      profile.phone ?? current.phone,
      profile.email ?? current.email,
      profile.rc ?? current.rc,
      profile.nif ?? current.nif,
      profile.nis ?? current.nis,
      profile.ai ?? current.ai,
      profile.logoUrl !== undefined ? profile.logoUrl : current.logoUrl
    )

    return this.getCompanyProfile()
  }

  getAppSettings(): AppSettings {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as any
    if (!row) {
      return {
        language: 'fr',
        currency: 'DA',
        autoBackup: true,
        printFormat: 'A4',
        defaultMarginPercent: 35.0,
        theme: 'light'
      }
    }
    return {
      language: row.language,
      currency: row.currency,
      autoBackup: row.auto_backup === 1,
      printFormat: row.print_format,
      defaultMarginPercent: row.default_margin_percent,
      theme: row.theme
    }
  }

  updateAppSettings(settings: Partial<AppSettings>): AppSettings {
    const db = getDatabase()
    const current = this.getAppSettings()

    db.prepare(`
      UPDATE app_settings SET
        language = ?, currency = ?, auto_backup = ?, print_format = ?,
        default_margin_percent = ?, theme = ?
      WHERE id = 1
    `).run(
      settings.language ?? current.language,
      settings.currency ?? current.currency,
      settings.autoBackup !== undefined ? (settings.autoBackup ? 1 : 0) : (current.autoBackup ? 1 : 0),
      settings.printFormat ?? current.printFormat,
      settings.defaultMarginPercent ?? current.defaultMarginPercent,
      settings.theme ?? current.theme
    )

    return this.getAppSettings()
  }
}

export const settingsService = new SettingsService()
