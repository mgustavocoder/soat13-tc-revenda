import { VeiculoAdapter } from './adapters/veiculo-adapter.js'
import { DuplicateResourceError } from '../../domain/errors/duplicate-resource-error.js'

class VeiculosRepository {
  constructor(queryBuilder) {
    this.queryBuilder = queryBuilder
  }

  async getVeiculosDisponiveis() {
    const rows = await this.queryBuilder('veiculos')
      .where('status', 'DISPONIVEL')
      .orderBy('preco', 'asc')
    return VeiculoAdapter.toVeiculos(rows)
  }

  async getVeiculosVendidos() {
    const rows = await this.queryBuilder('veiculos')
      .where('status', 'VENDIDO')
      .orderBy('preco', 'asc')
    return VeiculoAdapter.toVeiculos(rows)
  }

  async getVeiculosReservados() {
    const rows = await this.queryBuilder('veiculos')
      .where('status', 'RESERVADO')
      .orderBy('preco', 'asc')
    return VeiculoAdapter.toVeiculos(rows)
  }

  async getVeiculoByPlaca(placa) {
    const normalized = String(placa || '').trim().toUpperCase()
    const row = await this.queryBuilder('veiculos').where('placa', normalized).first()
    if (!row) return undefined
    return VeiculoAdapter.toVeiculo(row)
  }

  async getVeiculoByIdentifier(identifier) {
    if (identifier === undefined || identifier === null || identifier === '') return undefined
    return this.getVeiculoByPlaca(identifier)
  }

  async createVeiculo(veiculo) {
    try {
      const [id] = await this.queryBuilder('veiculos').insert({
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        cor: veiculo.cor,
        placa: veiculo.placa,
        preco: veiculo.preco,
        status: 'DISPONIVEL'
      })
      return { id, ...veiculo, status: 'DISPONIVEL' }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
        throw new DuplicateResourceError('Veículo com essa placa já cadastrado.')
      }
      throw error
    }
  }

  async updateVeiculo(placa, updates) {
    const fields = {}
    if (updates.marca !== undefined) fields.marca = updates.marca
    if (updates.modelo !== undefined) fields.modelo = updates.modelo
    if (updates.ano !== undefined) fields.ano = updates.ano
    if (updates.cor !== undefined) fields.cor = updates.cor
    if (updates.placa !== undefined) fields.placa = String(updates.placa).trim().toUpperCase()
    if (updates.preco !== undefined) fields.preco = updates.preco

    const normalized = String(placa).trim().toUpperCase()
    await this.queryBuilder('veiculos').where('placa', normalized).update(fields)
    return this.getVeiculoByPlaca(normalized)
  }

  async markAsReservado(placa) {
    const normalized = String(placa).trim().toUpperCase()
    await this.queryBuilder('veiculos').where('placa', normalized).update({ status: 'RESERVADO' })
  }

  async markAsDisponivel(placa) {
    const normalized = String(placa).trim().toUpperCase()
    await this.queryBuilder('veiculos').where('placa', normalized).update({ status: 'DISPONIVEL' })
  }

  async markAsVendido(placa) {
    const normalized = String(placa).trim().toUpperCase()
    await this.queryBuilder('veiculos').where('placa', normalized).update({ status: 'VENDIDO' })
  }
}

export { VeiculosRepository }
