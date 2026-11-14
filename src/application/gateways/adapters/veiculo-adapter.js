class VeiculoAdapter {
  static toVeiculo(row) {
    const placa = String(row?.placa ?? row?.veiculo_placa ?? '').trim().toUpperCase()

    return {
      id: row.id,
      placa,
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
