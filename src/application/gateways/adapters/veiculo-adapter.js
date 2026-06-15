class VeiculoAdapter {
  static toVeiculo(row) {
    return {
      id: row.id,
      marca: row.marca,
      modelo: row.modelo,
      ano: Number(row.ano),
      cor: row.cor,
      preco: Number(row.preco),
      status: row.status
    }
  }

  static toVeiculos(rows) {
    return rows.map(VeiculoAdapter.toVeiculo)
  }
}

export { VeiculoAdapter }
