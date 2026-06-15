import { InvalidInputError } from '../../domain/errors/invalid-input-error.js'
import { ResourceNotFoundError } from '../../domain/errors/resource-not-found-error.js'

const ANO_MINIMO = 1886
const ANO_MAXIMO = new Date().getFullYear() + 1

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

  async getVeiculoById(id) {
    const parsed = Number(id)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new InvalidInputError('ID do veículo inválido.')
    }
    return this.veiculosRepository.getVeiculoById(parsed)
  }

  async createVeiculo(veiculo) {
    this.#validateVeiculoFields(veiculo)
    return this.veiculosRepository.createVeiculo(veiculo)
  }

  async updateVeiculo(id, updates) {
    const parsed = Number(id)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new InvalidInputError('ID do veículo inválido.')
    }

    const veiculo = await this.veiculosRepository.getVeiculoById(parsed)
    if (!veiculo) {
      throw new ResourceNotFoundError('Veículo não encontrado.')
    }
    if (veiculo.status === 'VENDIDO') {
      throw new InvalidInputError('Não é possível editar um veículo já vendido.')
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

    return this.veiculosRepository.updateVeiculo(parsed, filtered)
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
