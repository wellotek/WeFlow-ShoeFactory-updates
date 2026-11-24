export type LicenseFailureCategory =
  | 'invalid'
  | 'already'
  | 'limit'
  | 'network'
  | 'rate'
  | 'unauthorized'
  | 'storage'

export class LicenseOperationError extends Error {
  readonly category: LicenseFailureCategory
  readonly serverMessage?: string
  readonly status?: number

  constructor(category: LicenseFailureCategory, serverMessage?: string, status?: number) {
    super(`License operation failed: ${category}${serverMessage ? ` (${serverMessage})` : ''}`)
    this.name = 'LicenseOperationError'
    this.category = category
    this.serverMessage = serverMessage
    this.status = status
  }
}

export class LicenseGuardError extends Error {
  constructor(message = 'Feature requires an active license') {
    super(message)
    this.name = 'LicenseGuardError'
  }
}

export function categoryFromToken(token: string | undefined): LicenseFailureCategory {
  if (!token) return 'invalid'
  const t = token.toLowerCase()
  if (t.includes('rate') || t.includes('too_many')) return 'rate'
  if (t.includes('limit') || t.includes('max') || t.includes('seat')) return 'limit'
  if (t.includes('already') || t.includes('in_use')) return 'already'
  if (t.includes('unauthorized') || t.includes('revoked') || t.includes('forbidden')) return 'unauthorized'
  if (t.includes('network') || t.includes('timeout') || t.includes('econnrefused')) return 'network'
  return 'invalid'
}
