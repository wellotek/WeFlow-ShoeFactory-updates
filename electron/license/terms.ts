export type LicenseTerms = {
  lifetime?: boolean
  expiresAt?: string
  durationMonths?: number
  activatedAt?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function pick(sources: Array<Record<string, unknown> | null>, keys: string[]): unknown {
  for (const source of sources) {
    if (!source) continue
    for (const key of keys) {
      const value = source[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
  }
  return undefined
}

function lifetimeFlag(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (typeof value === 'string' && ['lifetime', 'vie', 'à vie', 'a vie', 'permanent'].includes(value.trim().toLowerCase())) {
    return true
  }
  return undefined
}

function dateOnly(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : undefined
}

function monthCount(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 1200) return undefined
  return parsed
}

export function extractLicenseTerms(body: Record<string, unknown> | null): LicenseTerms | undefined {
  if (!body) return undefined
  const sources = [body, asRecord(body.license), asRecord(body.data), asRecord(body.license_data)]
  const plan = pick(sources, ['plan', 'period', 'type'])
  const lifetime = lifetimeFlag(pick(sources, ['lifetime', 'is_lifetime', 'isLifetime'])) ?? lifetimeFlag(plan)
  const expiresAt = dateOnly(pick(sources, ['expires_at', 'expiresAt', 'expiration', 'expiry', 'valid_until', 'validUntil']))
  const durationMonths = monthCount(pick(sources, ['duration_months', 'durationMonths', 'months']))
  const activatedAt = dateOnly(pick(sources, ['activated_at', 'activatedAt', 'activation_date', 'activationDate']))
  if (lifetime !== true && !expiresAt && !durationMonths && !activatedAt) return undefined
  return {
    ...(lifetime === true ? { lifetime: true } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(durationMonths ? { durationMonths } : {}),
    ...(activatedAt ? { activatedAt } : {})
  }
}
