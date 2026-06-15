const VEICULO_STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  VENDIDO: 'VENDIDO'
}

class Veiculo {
  constructor(marca, modelo, ano, cor, preco) {
    this.marca = marca
    this.modelo = modelo
    this.ano = ano
    this.cor = cor
    this.preco = preco
    this.status = VEICULO_STATUS.DISPONIVEL
  }
}

export { Veiculo, VEICULO_STATUS }
