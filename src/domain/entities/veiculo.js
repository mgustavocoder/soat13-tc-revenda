const VEICULO_STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  RESERVADO: 'RESERVADO',
  VENDIDO: 'VENDIDO'
}

const normalizePlaca = (placa = '') => {
  if (typeof placa !== 'string') return ''
  return placa.trim().replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

class Veiculo {
  constructor(marca, modelo, ano, cor, placa, preco) {
    this.marca = marca
    this.modelo = modelo
    this.ano = ano
    this.cor = cor
    this.placa = normalizePlaca(placa)
    this.preco = preco
    this.status = VEICULO_STATUS.DISPONIVEL
  }
}

export { Veiculo, VEICULO_STATUS, normalizePlaca }
