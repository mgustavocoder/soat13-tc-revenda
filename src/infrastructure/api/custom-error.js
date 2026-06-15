import { InvalidInputError } from '../../domain/errors/invalid-input-error.js'
import { ResourceNotFoundError } from '../../domain/errors/resource-not-found-error.js'
import { DuplicateResourceError } from '../../domain/errors/duplicate-resource-error.js'
import { BusinessRuleError } from '../../domain/errors/business-rule-error.js'

export class CustomError {
  static handleControllerError(error, res) {
    if (error instanceof InvalidInputError) {
      return res.status(400).json({ message: error.message })
    }
    if (error instanceof ResourceNotFoundError) {
      return res.status(404).json({ message: error.message })
    }
    if (error instanceof DuplicateResourceError) {
      return res.status(409).json({ message: error.message })
    }
    if (error instanceof BusinessRuleError) {
      return res.status(422).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}
