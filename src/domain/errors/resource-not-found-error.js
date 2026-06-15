export class ResourceNotFoundError extends Error {
  constructor(message = 'Recurso não encontrado') {
    super(message)
    this.name = 'ResourceNotFoundError'
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype)
  }
}
