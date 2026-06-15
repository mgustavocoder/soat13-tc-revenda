class ClienteAdapter {
  static toCliente(row) {
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf,
      email: row.email
    }
  }

  static toClientes(rows) {
    return rows.map(ClienteAdapter.toCliente)
  }
}

export { ClienteAdapter }
