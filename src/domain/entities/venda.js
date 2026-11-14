class Venda {
  constructor(veiculoId, clienteId, clienteCpf, preco, codigo = null, status = 'AGUARDANDO_PAGAMENTO') {
    this.veiculoId = veiculoId
    this.clienteId = clienteId
    this.clienteCpf = clienteCpf
    this.preco = preco
    this.codigo = codigo
    this.status = status
  }
}

export { Venda }
