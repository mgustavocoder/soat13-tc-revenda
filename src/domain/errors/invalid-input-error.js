export class InvalidInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidInputError'
    Object.setPrototypeOf(this, InvalidInputError.prototype)
  }
}
