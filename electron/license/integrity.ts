import { createHmac, timingSafeEqual } from 'node:crypto'
import { OFFLINE_GRACE_PERIOD_DAYS, REFRESH_WITHIN_HOURS } from './config'

const PREFIX = 'weflow-shoefactory-integrity|'
const LOCAL_INTEGRITY_KEY = 'weflow-shoefactory-integrity-key-v1'

export type IntegrityFields = {
  v: number
  license_id: string
  installation_id: string
  status: string
  lastValidatedAt: string
  offlineUntil: string
  product: string
  version: string
}

function field(value: string | number): string {
  const text = String(value)
  return `${text.length}:${text}`
}

export function canonicalState(state: IntegrityFields): string {
  return (
    PREFIX +
    [
      field(state.v),
      field(state.license_id),
      field(state.installation_id),
      field(state.status),
      field(state.lastValidatedAt),
      field(state.offlineUntil),
      field(state.product),
      field(state.version)
    ].join('|')
  )
}

export function signState(state: IntegrityFields): string {
  return createHmac('sha256', LOCAL_INTEGRITY_KEY).update(canonicalState(state)).digest('hex')
}

export function verifyState(state: IntegrityFields & { integrity: string }): boolean {
  const expected = signState(state)
  const actual = state.integrity
  const left = Buffer.from(actual)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function offlineUntilFrom(from: Date, days = OFFLINE_GRACE_PERIOD_DAYS): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

export function graceValid(offlineUntil: string, now: Date = new Date()): boolean {
  const timestamp = Date.parse(offlineUntil)
  if (Number.isNaN(timestamp)) return false
  return timestamp > now.getTime()
}

export function approachingDeadline(offlineUntil: string, now: Date = new Date(), withinHours = REFRESH_WITHIN_HOURS): boolean {
  const timestamp = Date.parse(offlineUntil)
  if (Number.isNaN(timestamp)) return false
  const remaining = timestamp - now.getTime()
  return remaining > 0 && remaining <= withinHours * 60 * 60 * 1000
}
