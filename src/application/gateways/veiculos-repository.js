import { VeiculoAdapter } from './adapters/veiculo-adapter.js'

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

  async getVeiculoById(id) {
    const row = await this.queryBuilder('veiculos').where('id', id).first()
    if (!row) return undefined
    return VeiculoAdapter.toVeiculo(row)
  }

  async createVeiculo(veiculo) {
    const [id] = await this.queryBuilder('veiculos').insert({
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      cor: veiculo.cor,
      preco: veiculo.preco,
      status: 'DISPONIVEL'
    })
    return { id, ...veiculo, status: 'DISPONIVEL' }
  }

  async updateVeiculo(id, updates) {
    const fields = {}
    if (updates.marca !== undefined) fields.marca = updates.marca
    if (updates.modelo !== undefined) fields.modelo = updates.modelo
    if (updates.ano !== undefined) fields.ano = updates.ano
    if (updates.cor !== undefined) fields.cor = updates.cor
    if (updates.preco !== undefined) fields.preco = updates.preco

    await this.queryBuilder('veiculos').where('id', id).update(fields)
    return this.getVeiculoById(id)
  }

  async markAsVendido(id) {
    await this.queryBuilder('veiculos').where('id', id).update({ status: 'VENDIDO' })
  }
}

export { VeiculosRepository }
