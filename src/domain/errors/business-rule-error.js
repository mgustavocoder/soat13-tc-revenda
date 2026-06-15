export class BusinessRuleError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BusinessRuleError'
    Object.setPrototypeOf(this, BusinessRuleError.prototype)
  }
}
