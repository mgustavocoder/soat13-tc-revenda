import { InvalidInputError } from '../../domain/errors/invalid-input-error.js'
import { ResourceNotFoundError } from '../../domain/errors/resource-not-found-error.js'

const ANO_MINIMO = 1886
const ANO_MAXIMO = new Date().getFullYear() + 1

const normalizePlaca = (placa = '') => {
  if (typeof placa !== 'string') return ''
  return placa.trim().replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

const isValidPlaca = (placa) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)

class VeiculosUsecase {
  constructor(veiculosRepository) {
    this.veiculosRepository = veiculosRepository
  }

  async listVeiculosDisponiveis() {
    return this.veiculosRepository.getVeiculosDisponiveis()
  }

  async listVeiculosVendidos() {
    return this.veiculosRepository.getVeiculosVendidos()
  }

  async listVeiculosReservados() {
    return this.veiculosRepository.getVeiculosReservados()
  }

  async getVeiculoByPlaca(placa) {
    const normalized = normalizePlaca(placa)
    if (!isValidPlaca(normalized)) {
      throw new InvalidInputError('Placa do veículo inválida.')
    }
    return this.veiculosRepository.getVeiculoByPlaca(normalized)
  }

  async getVeiculoByIdentifier(identifier) {
    if (identifier === undefined || identifier === null || identifier === '') {
      throw new InvalidInputError('Identificador do veículo inválido.')
    }
    return this.getVeiculoByPlaca(identifier)
  }

  async createVeiculo(veiculo) {
    this.#validateVeiculoFields(veiculo)
    return this.veiculosRepository.createVeiculo(veiculo)
  }

  async updateVeiculo(placa, updates) {
    const normalized = normalizePlaca(placa)
    if (!isValidPlaca(normalized)) {
      throw new InvalidInputError('Placa do veículo inválida.')
    }

    const veiculo = await this.veiculosRepository.getVeiculoByPlaca(normalized)
    if (!veiculo) {
      throw new ResourceNotFoundError('Veículo não encontrado.')
    }
    if (veiculo.status === 'RESERVADO' || veiculo.status === 'VENDIDO') {
      throw new InvalidInputError('Não é possível editar um veículo reservado ou vendido.')
    }

    if (updates && Object.prototype.hasOwnProperty.call(updates, 'placa')) {
      throw new InvalidInputError('A placa do veículo não pode ser alterada.')
    }

    const allowedFields = ['marca', 'modelo', 'ano', 'cor', 'preco']
    const filtered = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) filtered[field] = updates[field]
    }

    if (Object.keys(filtered).length === 0) {
      throw new InvalidInputError('Nenhum campo válido fornecido para atualização.')
    }

    if (filtered.marca !== undefined && (!filtered.marca || typeof filtered.marca !== 'string' || filtered.marca.trim().length === 0)) {
      throw new InvalidInputError('Marca inválida.')
    }
    if (filtered.modelo !== undefined && (!filtered.modelo || typeof filtered.modelo !== 'string' || filtered.modelo.trim().length === 0)) {
      throw new InvalidInputError('Modelo inválido.')
    }
    if (filtered.cor !== undefined && (!filtered.cor || typeof filtered.cor !== 'string' || filtered.cor.trim().length === 0)) {
      throw new InvalidInputError('Cor inválida.')
    }
    if (filtered.ano !== undefined) {
      const ano = Number(filtered.ano)
      if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > ANO_MAXIMO) {
        throw new InvalidInputError(`Ano inválido. Deve estar entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`)
      }
      filtered.ano = ano
    }
    if (filtered.preco !== undefined) {
      const preco = Number(filtered.preco)
      if (isNaN(preco) || preco <= 0) {
        throw new InvalidInputError('Preço inválido. Deve ser um valor positivo.')
      }
      filtered.preco = preco
    }

    return this.veiculosRepository.updateVeiculo(normalized, filtered)
  }

  #validateVeiculoFields(veiculo) {
    if (!veiculo.marca || typeof veiculo.marca !== 'string' || veiculo.marca.trim().length === 0) {
      throw new InvalidInputError('Marca inválida.')
    }
    if (!veiculo.modelo || typeof veiculo.modelo !== 'string' || veiculo.modelo.trim().length === 0) {
      throw new InvalidInputError('Modelo inválido.')
    }
    if (!veiculo.cor || typeof veiculo.cor !== 'string' || veiculo.cor.trim().length === 0) {
      throw new InvalidInputError('Cor inválida.')
    }
    const placa = normalizePlaca(veiculo.placa)
    if (!isValidPlaca(placa)) {
      throw new InvalidInputError('Placa do veículo inválida.')
    }
    veiculo.placa = placa
    const ano = Number(veiculo.ano)
    if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > ANO_MAXIMO) {
      throw new InvalidInputError(`Ano inválido. Deve estar entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`)
    }
    const preco = Number(veiculo.preco)
    if (isNaN(preco) || preco <= 0) {
      throw new InvalidInputError('Preço inválido. Deve ser um valor positivo.')
    }
  }
}

export { VeiculosUsecase }
