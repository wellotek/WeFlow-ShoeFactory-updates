export type UpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

export type UpdateSnapshot = {
  currentVersion: string
  availableVersion: string | null
  releaseNotes?: string | null
  phase: UpdatePhase
  percent: number
  error: string
  packaged: boolean
}

export function isNewerVersion(current: string, next: string): boolean {
  const parts = (value: string) =>
    value
      .replace(/^v/i, '')
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map((part) => Number.parseInt(part, 10))
  const left = parts(current)
  const right = parts(next)
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const currentPart = left[index] ?? 0
    const nextPart = right[index] ?? 0
    if (nextPart > currentPart) return true
    if (nextPart < currentPart) return false
  }
  return false
}
