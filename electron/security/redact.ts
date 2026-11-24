const SECRET_KEY = /activation|password|secret|token|integrity|apiKey|apikey|license_id|licenseId/i

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item))
  if (!value || typeof value !== 'object') return value
  const output: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value)) {
    output[key] = SECRET_KEY.test(key) ? '[redacted]' : redact(nested)
  }
  return output
}
