import { LicenseGuardError } from './errors'
import type { LicenseService } from './service'

let activeLicenseService: LicenseService | null = null

export function setLicenseService(service: LicenseService | null): void {
  activeLicenseService = service
}

export function setLicenseServiceForTesting(service: any): void {
  activeLicenseService = service
}

export function getLicenseService(): LicenseService | null {
  return activeLicenseService
}

export function assertLicensed(): void {
  if (!activeLicenseService || !activeLicenseService.isLicenseActivatedSync()) {
    throw new LicenseGuardError()
  }
}
