import { VendaAdapter } from './adapters/venda-adapter.js'

class VendasRepository {
  constructor(queryBuilder) {
    this.queryBuilder = queryBuilder
  }

  async getVendaById(id) {
    const row = await this.queryBuilder('vendas').where('id', Number(id)).first()
    return row ? VendaAdapter.toVenda(row) : undefined
  }

  async getVendas() {
    const rows = await this.queryBuilder('vendas').orderBy('id', 'asc')
    return VendaAdapter.toVendas(rows)
  }

  async getVendaByCodigo(codigo) {
    const row = await this.queryBuilder('vendas').where('codigo', String(codigo)).first()
    return row ? VendaAdapter.toVenda(row) : undefined
  }

  async getReservaAtivaByVeiculoPlaca(placa) {
    const row = await this.queryBuilder('vendas')
      .where('veiculo_placa', String(placa).trim().toUpperCase())
      .whereIn('status', ['AGUARDANDO_PAGAMENTO'])
      .orderBy('id', 'desc')
      .first()

    return row ? VendaAdapter.toVenda(row) : undefined
  }

  async createVenda(venda) {
    const [id] = await this.queryBuilder('vendas').insert({
      codigo: venda.codigo,
      veiculo_id: venda.veiculoId,
      veiculo_placa: venda.veiculoPlaca,
      cliente_id: venda.clienteId,
      cliente_cpf: venda.clienteCpf,
      preco: venda.preco,
      status: venda.status ?? 'AGUARDANDO_PAGAMENTO'
    })
    const row = await this.queryBuilder('vendas').where('id', id).first()
    return VendaAdapter.toVenda(row)
  }

  async updateStatus(id, status) {
    await this.queryBuilder('vendas').where('id', Number(id)).update({ status })
    return this.getVendaById(id)
  }

  async updateStatusByCodigo(codigo, status) {
    await this.queryBuilder('vendas').where('codigo', String(codigo)).update({ status })
    return this.getVendaByCodigo(codigo)
  }
}

export { VendasRepository }
