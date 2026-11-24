import { randomUUID } from 'node:crypto'

export function newId(): string {
  return randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}
