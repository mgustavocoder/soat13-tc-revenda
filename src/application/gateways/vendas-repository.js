import { VendaAdapter } from './adapters/venda-adapter.js'

class VendasRepository {
  constructor(queryBuilder) {
    this.queryBuilder = queryBuilder
  }

  async createVenda(venda) {
    const [id] = await this.queryBuilder('vendas').insert({
      veiculo_id: venda.veiculoId,
      cliente_id: venda.clienteId,
      cliente_cpf: venda.clienteCpf,
      preco: venda.preco
    })
    const row = await this.queryBuilder('vendas').where('id', id).first()
    return VendaAdapter.toVenda(row)
  }
}

export { VendasRepository }
