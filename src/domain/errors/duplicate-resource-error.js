export class DuplicateResourceError extends Error {
  constructor(message = 'Recurso já cadastrado') {
    super(message)
    this.name = 'DuplicateResourceError'
    Object.setPrototypeOf(this, DuplicateResourceError.prototype)
  }
}
