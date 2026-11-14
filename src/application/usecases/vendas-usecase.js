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

  gerarCodigoVenda() {
    const random = (Math.random() * 0xfffffffff).toString(16).toUpperCase().padStart(8, '0')
    return `VEN-${random}`
  }

  async validarClienteEVeiculo(veiculoIdentifier, clienteCpf, allowReserved = false) {
    const value = String(veiculoIdentifier ?? '').trim()
    const placa = value.toUpperCase().replace(/[^A-Z0-9]/gi, '')
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) {
      throw new InvalidInputError('Placa do veículo inválida.')
    }
    if (!CPF.isValid(clienteCpf)) {
      throw new InvalidInputError('CPF do cliente inválido.')
    }

    const cliente = await this.clientesRepository.getClientesByCpf(clienteCpf)
    if (!cliente) {
      throw new ResourceNotFoundError('Cliente não encontrado. É necessário realizar o cadastro antes de efetuar a compra.')
    }

    const veiculo = await this.veiculosRepository.getVeiculoByPlaca(placa)
    if (!veiculo) {
      throw new ResourceNotFoundError('Veículo não encontrado.')
    }
    if (veiculo.status === 'VENDIDO') {
      throw new BusinessRuleError('Veículo não está disponível para venda.')
    }
    if (!allowReserved && veiculo.status !== 'DISPONIVEL') {
      throw new BusinessRuleError('Veículo não está disponível para venda.')
    }

    return { cliente, veiculo, placa }
  }

  async comprarVeiculo(veiculoIdentifier, clienteCpf) {
    const { cliente, veiculo, placa } = await this.validarClienteEVeiculo(veiculoIdentifier, clienteCpf)

    await this.veiculosRepository.markAsVendido(placa)

    const codigo = this.gerarCodigoVenda()
    const venda = await this.vendasRepository.createVenda({
      codigo,
      veiculoId: veiculo.id,
      veiculoPlaca: veiculo.placa,
      clienteId: cliente.id,
      clienteCpf: clienteCpf,
      preco: veiculo.preco,
      status: 'PAGAMENTO_CONFIRMADO'
    })

    const { veiculoId, ...vendaSemId } = venda
    return {
      ...vendaSemId,
      veiculo: { ...veiculo, status: 'VENDIDO' },
      veiculoPlaca: veiculo.placa,
      cliente: { nome: cliente.nome, cpf: cliente.cpf, email: cliente.email }
    }
  }

  async reservarVeiculo(veiculoIdentifier, clienteCpf) {
    const { cliente, veiculo } = await this.validarClienteEVeiculo(veiculoIdentifier, clienteCpf, true)

    const reservaExistente = await this.vendasRepository.getReservaAtivaByVeiculoPlaca(veiculo.placa)
    if (reservaExistente) {
      throw new BusinessRuleError('Este veículo já possui uma reserva ativa.')
    }

    await this.veiculosRepository.markAsReservado(veiculo.placa)

    const codigo = this.gerarCodigoVenda()
    const venda = await this.vendasRepository.createVenda({
      codigo,
      veiculoId: veiculo.id,
      veiculoPlaca: veiculo.placa,
      clienteId: cliente.id,
      clienteCpf: clienteCpf,
      preco: veiculo.preco,
      status: 'AGUARDANDO_PAGAMENTO'
    })

    return {
      ...venda,
      status: 'AGUARDANDO_PAGAMENTO',
      veiculo: { ...veiculo, status: 'RESERVADO' },
      veiculoPlaca: veiculo.placa,
      cliente: { nome: cliente.nome, cpf: cliente.cpf, email: cliente.email }
    }
  }

  async listVendas() {
    return this.vendasRepository.getVendas()
  }

  async getVendaByCodigo(codigo) {
    const venda = await this.vendasRepository.getVendaByCodigo(codigo)
    if (!venda) {
      throw new ResourceNotFoundError('Venda não encontrada.')
    }
    return venda
  }

  async cancelarVenda(codigo) {
    const venda = await this.getVendaByCodigo(codigo)
    if (venda.status === 'CANCELADA') {
      throw new BusinessRuleError('Venda já cancelada.')
    }
    if (venda.status === 'PAGAMENTO_CONFIRMADO') {
      throw new BusinessRuleError('Não é possível cancelar uma venda já confirmada.')
    }

    const vendaAtualizada = await this.vendasRepository.updateStatusByCodigo(codigo, 'CANCELADA')
    await this.veiculosRepository.markAsDisponivel(venda.veiculoPlaca)

    return {
      ...vendaAtualizada,
      status: 'CANCELADA'
    }
  }

  async confirmarPagamento(codigo) {
    const venda = await this.getVendaByCodigo(codigo)
    if (venda.status === 'CANCELADA') {
      throw new BusinessRuleError('Não é possível confirmar pagamento de uma venda cancelada.')
    }
    if (venda.status === 'PAGAMENTO_CONFIRMADO') {
      throw new BusinessRuleError('Pagamento já confirmado para esta venda.')
    }

    const veiculo = await this.veiculosRepository.getVeiculoByPlaca(venda.veiculoPlaca)
    if (!veiculo) {
      throw new ResourceNotFoundError('Veículo não encontrado.')
    }
    if (veiculo.status === 'VENDIDO') {
      throw new BusinessRuleError('Veículo já vendido.')
    }

    await this.veiculosRepository.markAsVendido(venda.veiculoPlaca)

    const cliente = await this.clientesRepository.getClientesByCpf(venda.clienteCpf)
    const vendaAtualizada = await this.vendasRepository.updateStatusByCodigo(codigo, 'PAGAMENTO_CONFIRMADO')

    return {
      ...vendaAtualizada,
      status: 'PAGAMENTO_CONFIRMADO',
      veiculo: { ...veiculo, status: 'VENDIDO' },
      veiculoPlaca: veiculo.placa,
      cliente: cliente ? { nome: cliente.nome, cpf: cliente.cpf, email: cliente.email } : undefined
    }
  }
}

export { VendasUsecase }
