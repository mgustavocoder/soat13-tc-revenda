class VendaAdapter {
  static toVenda(row) {
    return {
      id: row.id,
      codigo: row.codigo,
      veiculoId: row.veiculo_id,
      veiculoPlaca: row.veiculo_placa,
      clienteId: row.cliente_id,
      clienteCpf: row.cliente_cpf,
      preco: Number(row.preco),
      dataVenda: row.data_venda,
      status: row.status ?? 'AGUARDANDO_PAGAMENTO'
    }
  }

  static toVendas(rows) {
    return rows.map(VendaAdapter.toVenda)
  }
}

export { VendaAdapter }
