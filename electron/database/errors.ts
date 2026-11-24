export class DatabaseError extends Error {
  constructor(message: string, readonly originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}
