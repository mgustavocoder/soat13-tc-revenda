import { CustomError } from '../api/custom-error.js'
import { stripResponseIds, stripResponseIdsFromCollection } from '../api/response-sanitizer.js'

class VendaController {
  constructor(vendasUsecase) {
    this.vendasUsecase = vendasUsecase
  }

  async comprarVeiculo(req, res) {
    try {
      const { veiculoPlaca, placa, clienteCpf } = req.body
      const veiculoIdentifier = veiculoPlaca ?? placa
      if (!veiculoIdentifier || !clienteCpf) {
        return res.status(400).json({ message: 'Campos obrigatórios: veiculoPlaca, clienteCpf.' })
      }
      const venda = await this.vendasUsecase.comprarVeiculo(veiculoIdentifier, clienteCpf)
      return res.status(201).json(stripResponseIds(venda))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async reservarVeiculo(req, res) {
    try {
      const { veiculoPlaca, placa, clienteCpf } = req.body
      const veiculoIdentifier = veiculoPlaca ?? placa
      if (!veiculoIdentifier || !clienteCpf) {
        return res.status(400).json({ message: 'Campos obrigatórios: veiculoPlaca, clienteCpf.' })
      }
      const venda = await this.vendasUsecase.reservarVeiculo(veiculoIdentifier, clienteCpf)
      return res.status(201).json(stripResponseIds(venda))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async listVendas(req, res) {
    try {
      const vendas = await this.vendasUsecase.listVendas()
      return res.status(200).json(stripResponseIdsFromCollection(vendas))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async cancelarVenda(req, res) {
    try {
      const codigo = String(req.params.codigo ?? req.body?.codigo ?? '').trim()
      if (!codigo || !/^VEN-/i.test(codigo)) {
        return res.status(400).json({ message: 'Código da venda inválido.' })
      }
      const venda = await this.vendasUsecase.cancelarVenda(codigo)
      return res.status(200).json(stripResponseIds(venda))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async confirmarPagamento(req, res) {
    try {
      const codigo = String(req.params.codigo ?? req.body?.codigo ?? '').trim()
      if (!codigo || !/^VEN-/i.test(codigo)) {
        return res.status(400).json({ message: 'Código da venda inválido.' })
      }
      const venda = await this.vendasUsecase.confirmarPagamento(codigo)
      return res.status(200).json(stripResponseIds(venda))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }
}

export { VendaController }
