import { ClienteController } from './cliente-controller.js'
import { VeiculoController } from './veiculo-controller.js'
import { VendaController } from './venda-controller.js'
import { ClientesUsecase } from '../../application/usecases/clientes-usecase.js'
import { VeiculosUsecase } from '../../application/usecases/veiculos-usecase.js'
import { VendasUsecase } from '../../application/usecases/vendas-usecase.js'
import { ClientesRepository } from '../../application/gateways/clientes-repository.js'
import { VeiculosRepository } from '../../application/gateways/veiculos-repository.js'
import { VendasRepository } from '../../application/gateways/vendas-repository.js'
import { queryBuilderFactory } from '../datasource/query-builder-factory.js'

function controllersFactory() {
  const queryBuilder = queryBuilderFactory()

  const clientesRepository = new ClientesRepository(queryBuilder)
  const clientesUsecase = new ClientesUsecase(clientesRepository)
  const clienteController = new ClienteController(clientesUsecase)

  const veiculosRepository = new VeiculosRepository(queryBuilder)
  const veiculosUsecase = new VeiculosUsecase(veiculosRepository)
  const veiculoController = new VeiculoController(veiculosUsecase)

  const vendasRepository = new VendasRepository(queryBuilder)
  const vendasUsecase = new VendasUsecase(vendasRepository, clientesRepository, veiculosRepository)
  const vendaController = new VendaController(vendasUsecase)

  return { clienteController, veiculoController, vendaController }
}

export { controllersFactory }
