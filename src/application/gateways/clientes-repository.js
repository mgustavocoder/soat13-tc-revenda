import { DuplicateResourceError } from '../../domain/errors/duplicate-resource-error.js'
import { ClienteAdapter } from './adapters/cliente-adapter.js'

class ClientesRepository {
  constructor(queryBuilder) {
    this.queryBuilder = queryBuilder
  }

  async getClientes() {
    const rows = await this.queryBuilder('clientes').select('*')
    return ClienteAdapter.toClientes(rows)
  }

  async getClientesByCpf(cpf) {
    const row = await this.queryBuilder('clientes').where('cpf', cpf).first()
    if (!row) return undefined
    return ClienteAdapter.toCliente(row)
  }

  async createCliente(cliente) {
    try {
      const [id] = await this.queryBuilder('clientes').insert({
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email
      })
      return { id, ...cliente }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
        throw new DuplicateResourceError('Cliente já cadastrado com esse CPF ou e-mail.')
      }
      throw error
    }
  }
}

export { ClientesRepository }
