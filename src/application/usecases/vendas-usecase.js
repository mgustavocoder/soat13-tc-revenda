import { CPF } from '../../domain/entities/value-objects/cpf.js'
import { InvalidInputError } from '../../domain/errors/invalid-input-error.js'
import { ResourceNotFoundError } from '../../domain/errors/resource-not-found-error.js'
import { BusinessRuleError } from '../../domain/errors/business-rule-error.js'

class VendasUsecase {
  constructor(vendasRepository, clientesRepository, veiculosRepository) {
    this.vendasRepository = vendasRepository
    this.clientesRepository = clientesRepository
    this.veiculosRepository = veiculosRepository
  }

  async comprarVeiculo(veiculoId, clienteCpf) {
    const parsedId = Number(veiculoId)
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new InvalidInputError('ID do veículo inválido.')
    }
    if (!CPF.isValid(clienteCpf)) {
      throw new InvalidInputError('CPF do cliente inválido.')
    }

    const cliente = await this.clientesRepository.getClientesByCpf(clienteCpf)
    if (!cliente) {
      throw new ResourceNotFoundError('Cliente não encontrado. É necessário realizar o cadastro antes de efetuar a compra.')
    }

    const veiculo = await this.veiculosRepository.getVeiculoById(parsedId)
    if (!veiculo) {
      throw new ResourceNotFoundError('Veículo não encontrado.')
    }
    if (veiculo.status === 'VENDIDO') {
      throw new BusinessRuleError('Veículo não está disponível para venda.')
    }

    await this.veiculosRepository.markAsVendido(parsedId)

    const venda = await this.vendasRepository.createVenda({
      veiculoId: parsedId,
      clienteId: cliente.id,
      clienteCpf: clienteCpf,
      preco: veiculo.preco
    })

    return {
      ...venda,
      veiculo: { ...veiculo, status: 'VENDIDO' },
      cliente: { nome: cliente.nome, cpf: cliente.cpf, email: cliente.email }
    }
  }
}

export { VendasUsecase }
