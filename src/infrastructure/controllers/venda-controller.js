import { CustomError } from '../api/custom-error.js'

class VendaController {
  constructor(vendasUsecase) {
    this.vendasUsecase = vendasUsecase
  }

  async comprarVeiculo(req, res) {
    try {
      const { veiculoId, clienteCpf } = req.body
      if (!veiculoId || !clienteCpf) {
        return res.status(400).json({ message: 'Campos obrigatórios: veiculoId, clienteCpf.' })
      }
      const venda = await this.vendasUsecase.comprarVeiculo(veiculoId, clienteCpf)
      return res.status(201).json(venda)
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }
}

export { VendaController }
