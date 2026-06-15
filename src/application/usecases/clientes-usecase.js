import { CPF } from '../../domain/entities/value-objects/cpf.js'
import { Email } from '../../domain/entities/value-objects/email.js'
import { Nome } from '../../domain/entities/value-objects/nome.js'
import { InvalidInputError } from '../../domain/errors/invalid-input-error.js'

class ClientesUsecase {
  constructor(clientesRepository) {
    this.clientesRepository = clientesRepository
  }

  async listClientes() {
    return this.clientesRepository.getClientes()
  }

  async getClienteByCpf(cpf) {
    if (!CPF.isValid(cpf)) {
      throw new InvalidInputError('CPF inválido.')
    }
    return this.clientesRepository.getClientesByCpf(cpf)
  }

  async createCliente(cliente) {
    if (!Nome.isValid(cliente.nome)) {
      throw new InvalidInputError('Nome inválido. Deve conter pelo menos 3 caracteres.')
    }
    if (!CPF.isValid(cliente.cpf)) {
      throw new InvalidInputError('CPF inválido. Deve conter 11 dígitos numéricos.')
    }
    if (!Email.isValid(cliente.email)) {
      throw new InvalidInputError('E-mail inválido.')
    }
    return this.clientesRepository.createCliente(cliente)
  }
}

export { ClientesUsecase }
