class VendaAdapter {
  static toVenda(row) {
    return {
      id: row.id,
      veiculoId: row.veiculo_id,
      clienteId: row.cliente_id,
      clienteCpf: row.cliente_cpf,
      preco: Number(row.preco),
      dataVenda: row.data_venda
    }
  }

  static toVendas(rows) {
    return rows.map(VendaAdapter.toVenda)
  }
}

export { VendaAdapter }
