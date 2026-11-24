import { ZodError } from 'zod'
import { LicenseGuardError, LicenseOperationError } from '../license/errors'

export interface IpcError {
  code: string
  messageKey: string
  detail?: string
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

export function fail<T>(code: string, messageKey: string, detail?: string): IpcResult<T> {
  const error: IpcError = detail ? { code, messageKey, detail } : { code, messageKey }
  return { ok: false, error }
}

export function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

export function mapError(error: unknown): IpcError {
  if (error instanceof LicenseGuardError) {
    return { code: 'LICENSE_REQUIRED', messageKey: 'license.errors.unauthorized' }
  }
  if (error instanceof LicenseOperationError) {
    return { code: 'LICENSE_ERROR', messageKey: `license.errors.${error.category}` }
  }
  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      messageKey: 'errors.validationFailed',
      detail: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    }
  }

  if (error instanceof Error) {
    if (error.message.startsWith('errors.')) {
      return { code: 'BUSINESS_ERROR', messageKey: error.message }
    }
    return { code: 'INTERNAL_ERROR', messageKey: 'errors.unexpected', detail: error.message }
  }

  return { code: 'INTERNAL_ERROR', messageKey: 'errors.unexpected' }
}
