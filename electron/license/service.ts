import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { LicenseRecord, LicenseUiState } from '@shared/types'
import { APP_VERSION } from '@shared/version'
import {
  ACTIVATE_URL,
  FETCH_TIMEOUT_MS,
  PRODUCT,
  PRODUCT_ALT,
  PRODUCT_CANDIDATES,
  REFRESH_URL
} from './config'
import { categoryFromToken, LicenseOperationError, type LicenseFailureCategory } from './errors'
import {
  approachingDeadline,
  graceValid,
  offlineUntilFrom,
  signState,
  verifyState
} from './integrity'
import { extractLicenseTerms, type LicenseTerms } from './terms'
import { getOrCreateInstallationId, readInstallationId, type Cipher } from './installationId'
import type { Logger } from '../logger'

const storedLicenseSchema = z.object({
  v: z.literal(1),
  license_id: z.string().min(1),
  installation_id: z.string().uuid(),
  status: z.string().min(1),
  lastValidatedAt: z.string().min(1),
  offlineUntil: z.string().min(1),
  product: z.string().min(1),
  version: z.string().min(1),
  integrity: z.string().min(1),
  serverToken: z.string().min(1).optional(),
  lifetime: z.boolean().optional(),
  expiresAt: z.string().min(1).optional(),
  durationMonths: z.number().int().positive().optional(),
  activatedAt: z.string().min(1).optional()
})

type ServerOutcome =
  | { type: 'active'; serverToken?: string; terms?: LicenseTerms }
  | { type: 'denied'; category: LicenseFailureCategory }
  | { type: 'network' }

type Assessment =
  | { kind: 'missing' }
  | { kind: 'storage' }
  | { kind: 'blocked'; messageKey: string }
  | { kind: 'grace'; record: LicenseRecord }
  | { kind: 'expired'; record: LicenseRecord }

const OK_STATUSES = new Set(['active', 'ok', 'valid', 'activated', 'success'])

function termsOf(record: LicenseRecord): LicenseTerms | undefined {
  const terms: LicenseTerms = {}
  if (record.lifetime === true) terms.lifetime = true
  if (record.expiresAt) terms.expiresAt = record.expiresAt
  if (record.durationMonths) terms.durationMonths = record.durationMonths
  if (record.activatedAt) terms.activatedAt = record.activatedAt
  return Object.keys(terms).length > 0 ? terms : undefined
}

function mergeTerms(previous: LicenseTerms | undefined, incoming: LicenseTerms | undefined): LicenseTerms | undefined {
  if (!incoming) return previous
  return { ...previous, ...incoming }
}

export type LicenseServiceOptions = {
  userDataDir: string
  cipher: Cipher
  fetchImpl?: typeof fetch
  now?: () => Date
  logger?: Logger
  timeoutMs?: number
  appVersion?: string
}

const noopLogger: Logger = {
  info() {},
  warn() {},
  error() {}
}

export class LicenseService {
  private readonly userDataDir: string
  private readonly cipher: Cipher
  private readonly fetchImpl: typeof fetch
  private readonly now: () => Date
  private readonly logger: Logger
  private readonly timeoutMs: number
  private readonly appVersion: string
  private refreshAttempted = false
  private sessionDenied = false

  constructor(options: LicenseServiceOptions) {
    this.userDataDir = options.userDataDir
    this.cipher = options.cipher
    this.fetchImpl = options.fetchImpl ?? fetch
    this.now = options.now ?? (() => new Date())
    this.logger = options.logger ?? noopLogger
    this.timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS
    this.appVersion = options.appVersion ?? APP_VERSION
  }

  private licensePath(): string {
    return path.join(this.userDataDir, 'license.enc')
  }

  isLicenseActivatedSync(): boolean {
    if (this.sessionDenied) return false
    return this.assess().kind === 'grace'
  }

  authorizedClient(): { licenseId: string; installationId: string; product: string; version: string } | null {
    const assessment = this.assess()
    if (assessment.kind !== 'grace') return null
    return {
      licenseId: assessment.record.license_id,
      installationId: assessment.record.installation_id,
      product: assessment.record.product,
      version: assessment.record.version
    }
  }

  async getUiState(): Promise<LicenseUiState> {
    if (this.sessionDenied) {
      return { status: 'blocked', messageKey: 'license.errors.unauthorized' }
    }
    const assessment = this.assess()
    if (assessment.kind === 'missing') return { status: 'activate' }
    if (assessment.kind === 'storage') {
      return { status: 'blocked', messageKey: 'license.errors.storage' }
    }
    if (assessment.kind === 'blocked') {
      return { status: 'blocked', messageKey: assessment.messageKey }
    }
    if (assessment.kind === 'grace') {
      if (approachingDeadline(assessment.record.offlineUntil, this.now()) && !this.refreshAttempted) {
        await this.refresh(assessment.record)
        return this.stateAfterRefresh(assessment.record)
      }
      return this.present(assessment.record, 'grace')
    }
    return this.present(assessment.record, 'expired')
  }

  async activate(licenseId: string, activationCode: string): Promise<LicenseUiState> {
    const normalizedId = licenseId.trim().toUpperCase()
    const normalizedCode = activationCode.trim().toUpperCase()
    const installationId = getOrCreateInstallationId(this.userDataDir, this.cipher)
    this.logger.info('license activation requested', { licenseId: normalizedId })

    // Try candidates in sequence
    let outcome: ServerOutcome = { type: 'denied', category: 'invalid' }
    let matchedProduct = PRODUCT

    for (const candidate of PRODUCT_CANDIDATES) {
      outcome = await this.post(ACTIVATE_URL, {
        license_id: normalizedId,
        activation_code: normalizedCode,
        installation_id: installationId,
        product: candidate,
        product_alt: PRODUCT_ALT,
        version: this.appVersion
      })

      if (outcome.type === 'active') {
        matchedProduct = candidate
        break
      }
      if (outcome.type === 'network') {
        break
      }
    }

    if (outcome.type === 'network') throw new LicenseOperationError('network')
    if (outcome.type === 'denied') throw new LicenseOperationError(outcome.category)

    const stamped = this.stampActive(normalizedId, {
      product: matchedProduct,
      serverToken: outcome.serverToken,
      terms: outcome.terms
    })
    this.sessionDenied = false
    await this.refresh(stamped)
    return this.stateAfterRefresh(stamped)
  }

  private stateAfterRefresh(fallback: LicenseRecord): LicenseUiState {
    if (this.sessionDenied) {
      return { status: 'blocked', messageKey: 'license.errors.unauthorized', licenseId: fallback.license_id }
    }
    const latest = this.assess()
    if (latest.kind === 'grace') return this.present(latest.record, 'active')
    if (latest.kind === 'blocked' || latest.kind === 'storage') {
      return {
        status: 'blocked',
        messageKey: latest.kind === 'storage' ? 'license.errors.storage' : latest.messageKey,
        licenseId: fallback.license_id
      }
    }
    return this.present(fallback, 'expired')
  }

  private present(record: LicenseRecord, preferred: 'active' | 'grace' | 'expired'): LicenseUiState {
    const remainingMs = Date.parse(record.offlineUntil) - this.now().getTime()
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
    const terms = termsOf(record)
    const base = {
      licenseId: record.license_id,
      installationId: record.installation_id,
      daysRemaining,
      ...(terms?.lifetime === true ? { lifetime: true } : {}),
      ...(terms?.expiresAt ? { expiresAt: terms.expiresAt } : {})
    }
    if (preferred === 'expired') {
      return { ...base, status: 'expired', messageKey: 'license.errors.expired' }
    }
    return { ...base, status: preferred }
  }

  private assess(): Assessment {
    let raw: unknown = null
    try {
      raw = this.readRaw()
    } catch {
      return { kind: 'storage' }
    }
    if (!raw) return { kind: 'missing' }
    const record = storedLicenseSchema.safeParse(raw)
    if (!record.success) return { kind: 'blocked', messageKey: 'license.errors.tampered' }
    if (!verifyState(record.data)) return { kind: 'blocked', messageKey: 'license.errors.tampered' }

    let installationId: string | null = null
    try {
      installationId = readInstallationId(this.userDataDir, this.cipher)
    } catch {
      return { kind: 'storage' }
    }
    if (!installationId || record.data.installation_id !== installationId) {
      return { kind: 'blocked', messageKey: 'license.errors.unauthorized' }
    }
    if (!PRODUCT_CANDIDATES.includes(record.data.product) || record.data.status !== 'active') {
      return { kind: 'blocked', messageKey: 'license.errors.unauthorized' }
    }
    if (!graceValid(record.data.offlineUntil, this.now())) {
      return { kind: 'expired', record: record.data }
    }
    return { kind: 'grace', record: record.data }
  }

  private readRaw(): unknown | null {
    const file = this.licensePath()
    if (!fs.existsSync(file)) return null
    try {
      const plain = this.cipher.decrypt(fs.readFileSync(file))
      return JSON.parse(plain) as unknown
    } catch {
      throw new LicenseOperationError('storage')
    }
  }

  private stampActive(
    licenseId: string,
    extras?: { product?: string; serverToken?: string; terms?: LicenseTerms }
  ): LicenseRecord {
    const now = this.now()
    const installationId = getOrCreateInstallationId(this.userDataDir, this.cipher)
    const unsigned = {
      v: 1 as const,
      license_id: licenseId,
      installation_id: installationId,
      status: 'active',
      lastValidatedAt: now.toISOString(),
      offlineUntil: offlineUntilFrom(now),
      product: extras?.product ?? PRODUCT,
      version: this.appVersion
    }
    const terms = extras?.terms
    const record: LicenseRecord = {
      ...unsigned,
      integrity: signState(unsigned),
      ...(extras?.serverToken ? { serverToken: extras.serverToken } : {}),
      ...(terms?.lifetime === true ? { lifetime: true } : {}),
      ...(terms?.expiresAt ? { expiresAt: terms.expiresAt } : {}),
      ...(terms?.durationMonths ? { durationMonths: terms.durationMonths } : {}),
      ...(terms?.activatedAt ? { activatedAt: terms.activatedAt } : {})
    }
    this.persist(record)
    return record
  }

  private deny(record: LicenseRecord): void {
    this.sessionDenied = true
    const unsigned = {
      v: 1 as const,
      license_id: record.license_id,
      installation_id: record.installation_id,
      status: 'blocked',
      lastValidatedAt: record.lastValidatedAt,
      offlineUntil: new Date(0).toISOString(),
      product: record.product,
      version: record.version
    }
    this.persist({
      ...unsigned,
      integrity: signState(unsigned)
    })
  }

  private persist(record: LicenseRecord): void {
    fs.mkdirSync(this.userDataDir, { recursive: true })
    fs.writeFileSync(this.licensePath(), this.cipher.encrypt(JSON.stringify(record)))
  }

  private async refresh(record: LicenseRecord): Promise<void> {
    this.refreshAttempted = true
    const outcome = await this.post(REFRESH_URL, {
      license_id: record.license_id,
      installation_id: record.installation_id
    })
    if (outcome.type === 'active') {
      this.stampActive(record.license_id, {
        product: record.product,
        serverToken: outcome.serverToken ?? record.serverToken,
        terms: mergeTerms(termsOf(record), outcome.terms)
      })
      return
    }
    if (outcome.type === 'denied' && outcome.category === 'unauthorized') {
      this.logger.info('license refresh denied', { category: outcome.category })
      this.deny(record)
      return
    }
  }

  private async post(url: string, body: Record<string, string>): Promise<ServerOutcome> {
    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs)
      })
      const text = await response.text()
      return this.interpret(response.status, text)
    } catch {
      this.logger.warn('license request failed', { url })
      return { type: 'network' }
    }
  }

  private interpret(status: number, text: string): ServerOutcome {
    if (status === 429) return { type: 'denied', category: 'rate' }
    if (text.trim().startsWith('<')) return { type: 'network' }
    let body: Record<string, unknown> | null = null
    if (text.trim()) {
      try {
        const parsed = JSON.parse(text) as unknown
        body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
      } catch {
        body = null
      }
    }
    const code = this.extractCode(body)
    const mapped = categoryFromToken(code)
    if (body && (body.success === false || body.ok === false || body.valid === false)) {
      return { type: 'denied', category: mapped ?? 'invalid' }
    }
    if (status === 401 || status === 403) {
      return { type: 'denied', category: mapped ?? 'unauthorized' }
    }
    if (status === 409) return { type: 'denied', category: mapped ?? 'already' }
    if (status >= 500) return { type: 'network' }
    if (code && !OK_STATUSES.has(code.toLowerCase())) {
      return { type: 'denied', category: mapped ?? 'unauthorized' }
    }
    if (status < 200 || status >= 300) return { type: 'denied', category: mapped ?? 'invalid' }
    return { type: 'active', serverToken: this.extractToken(body), terms: extractLicenseTerms(body) }
  }

  private extractCode(body: Record<string, unknown> | null): string | undefined {
    if (!body) return undefined
    for (const key of ['error', 'code', 'status', 'reason']) {
      const value = body[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return undefined
  }

  private extractToken(body: Record<string, unknown> | null): string | undefined {
    if (!body) return undefined
    for (const key of ['serverToken', 'server_token', 'token']) {
      const value = body[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return undefined
  }
}
