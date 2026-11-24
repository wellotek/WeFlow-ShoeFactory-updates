import { describe, expect, it } from 'vitest'
import {
  signState,
  verifyState,
  graceValid,
  approachingDeadline,
  offlineUntilFrom
} from '../../electron/license/integrity'
import { extractLicenseTerms } from '../../electron/license/terms'
import { categoryFromToken } from '../../electron/license/errors'

describe('License System Units', () => {
  it('signs and verifies license state integrity', () => {
    const fields = {
      v: 1,
      license_id: 'WF-SHOE-2026-TEST',
      installation_id: '11111111-2222-3333-4444-555555555555',
      status: 'active',
      lastValidatedAt: '2026-01-01T00:00:00.000Z',
      offlineUntil: '2026-01-08T00:00:00.000Z',
      product: 'WeFlowShoeFactory',
      version: '1.0.0'
    }

    const signature = signState(fields)
    expect(signature).toHaveLength(64)

    const valid = verifyState({ ...fields, integrity: signature })
    expect(valid).toBe(true)

    // Tampered state fails
    const tampered = verifyState({ ...fields, product: 'HackedApp', integrity: signature })
    expect(tampered).toBe(false)
  })

  it('validates offline grace window of 7 days', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const offlineUntil = offlineUntilFrom(now, 7)

    expect(graceValid(offlineUntil, new Date('2026-01-05T12:00:00Z'))).toBe(true)
    expect(graceValid(offlineUntil, new Date('2026-01-08T12:00:01Z'))).toBe(false)
  })

  it('detects approaching refresh deadline within 48h', () => {
    const offlineUntil = '2026-01-03T12:00:00Z'
    // 24h before deadline
    expect(approachingDeadline(offlineUntil, new Date('2026-01-02T12:00:00Z'), 48)).toBe(true)
    // 72h before deadline -> not approaching yet
    expect(approachingDeadline(offlineUntil, new Date('2025-12-31T12:00:00Z'), 48)).toBe(false)
  })

  it('extracts license terms properly', () => {
    const payload = {
      status: 'success',
      data: {
        lifetime: true,
        activated_at: '2026-01-10T10:00:00Z',
        plan: 'lifetime'
      }
    }
    const terms = extractLicenseTerms(payload)
    expect(terms).toBeDefined()
    expect(terms?.lifetime).toBe(true)
    expect(terms?.activatedAt).toBe('2026-01-10')
  })

  it('maps server rejection tokens to failure categories', () => {
    expect(categoryFromToken('seat_limit_reached')).toBe('limit')
    expect(categoryFromToken('license_already_active')).toBe('already')
    expect(categoryFromToken('rate_limit_exceeded')).toBe('rate')
    expect(categoryFromToken('unauthorized_product')).toBe('unauthorized')
    expect(categoryFromToken('unknown_code')).toBe('invalid')
  })
})
