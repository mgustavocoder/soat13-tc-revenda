import { CustomError } from '../api/custom-error.js'
import { stripResponseIds, stripResponseIdsFromCollection } from '../api/response-sanitizer.js'
import { Veiculo } from '../../domain/entities/veiculo.js'

class VeiculoController {
  constructor(veiculosUsecase) {
    this.veiculosUsecase = veiculosUsecase
  }

  async listVeiculosDisponiveis(req, res) {
    try {
      const veiculos = await this.veiculosUsecase.listVeiculosDisponiveis()
      return res.status(200).json(stripResponseIdsFromCollection(veiculos))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async listVeiculosVendidos(req, res) {
    try {
      const veiculos = await this.veiculosUsecase.listVeiculosVendidos()
      return res.status(200).json(stripResponseIdsFromCollection(veiculos))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async listVeiculosReservados(req, res) {
    try {
      const veiculos = await this.veiculosUsecase.listVeiculosReservados()
      return res.status(200).json(stripResponseIdsFromCollection(veiculos))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async getVeiculoById(req, res) {
    try {
      const { placa } = req.params
      const veiculo = await this.veiculosUsecase.getVeiculoByIdentifier(placa)
      if (!veiculo) {
        return res.status(404).json({ message: 'Veículo não encontrado.' })
      }
      return res.status(200).json(stripResponseIds(veiculo))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async createVeiculo(req, res) {
    try {
      const { marca, modelo, ano, cor, placa, preco } = req.body
      if (!marca || !modelo || !ano || !cor || !placa || preco === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios: marca, modelo, ano, cor, placa, preco.' })
      }
      const veiculo = await this.veiculosUsecase.createVeiculo(new Veiculo(marca, modelo, ano, cor, placa, preco))
      return res.status(201).json(stripResponseIds(veiculo))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async updateVeiculo(req, res) {
    try {
      const { placa } = req.params
      const veiculo = await this.veiculosUsecase.updateVeiculo(placa, req.body)
      return res.status(200).json(stripResponseIds(veiculo))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }
}

export { VeiculoController }
