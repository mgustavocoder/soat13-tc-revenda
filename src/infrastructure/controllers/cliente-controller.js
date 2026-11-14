import { CustomError } from '../api/custom-error.js'
import { stripResponseIds, stripResponseIdsFromCollection } from '../api/response-sanitizer.js'
import { Cliente } from '../../domain/entities/cliente.js'

class ClienteController {
  constructor(clientesUsecase) {
    this.clientesUsecase = clientesUsecase
  }

  async listClientes(req, res) {
    try {
      const clientes = await this.clientesUsecase.listClientes()
      return res.status(200).json(stripResponseIdsFromCollection(clientes))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async getClienteByCpf(req, res) {
    try {
      const { cpf } = req.params
      const cliente = await this.clientesUsecase.getClienteByCpf(cpf)
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente não encontrado.' })
      }
      return res.status(200).json(stripResponseIds(cliente))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }

  async createCliente(req, res) {
    try {
      const { nome, cpf, email } = req.body
      if (!nome || !cpf || !email) {
        return res.status(400).json({ message: 'Campos obrigatórios: nome, cpf, email.' })
      }
      const cliente = await this.clientesUsecase.createCliente(new Cliente(nome, cpf, email))
      return res.status(201).json(stripResponseIds(cliente))
    } catch (error) {
      CustomError.handleControllerError(error, res)
    }
  }
}

export { ClienteController }
