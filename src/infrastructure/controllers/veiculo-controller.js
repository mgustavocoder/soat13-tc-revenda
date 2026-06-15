import { CustomError } from '../api/custom-error.js'
import { Veiculo } from '../../domain/entities/veiculo.js'

class VeiculoController {
  constructor(veiculosUsecase) {
    this.veiculosUsecase = veiculosUsecase
  }

  async listVeiculosDisponiveis(req, res) {
    try {
      const veiculos = await this.veiculosUsecase.listVeiculosDisponiveis()
      return res.status(200).json(veiculos)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async listVeiculosVendidos(req, res) {
    try {
      const veiculos = await this.veiculosUsecase.listVeiculosVendidos()
      return res.status(200).json(veiculos)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async getVeiculoById(req, res) {
    try {
      const { id } = req.params
      const veiculo = await this.veiculosUsecase.getVeiculoById(id)
      if (!veiculo) {
        return res.status(404).json({ message: 'Veículo não encontrado.' })
      }
      return res.status(200).json(veiculo)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async createVeiculo(req, res) {
    try {
      const { marca, modelo, ano, cor, preco } = req.body
      if (!marca || !modelo || !ano || !cor || preco === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios: marca, modelo, ano, cor, preco.' })
      }
      const veiculo = await this.veiculosUsecase.createVeiculo(new Veiculo(marca, modelo, ano, cor, preco))
      return res.status(201).json(veiculo)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async updateVeiculo(req, res) {
    try {
      const { id } = req.params
      const veiculo = await this.veiculosUsecase.updateVeiculo(id, req.body)
      return res.status(200).json(veiculo)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }
}

export { VeiculoController }
