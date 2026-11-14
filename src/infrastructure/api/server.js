import 'dotenv/config'
import { xss } from 'express-xss-sanitizer'
import express from 'express'
import cors from 'cors'
import { controllersFactory } from '../controllers/controllers-factory.js'
import { Logger } from '../logger.js'

const logger = new Logger()
const app = express()

app.use(cors())
app.use(express.json())
app.use(xss())
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

const { clienteController, veiculoController, vendaController } = controllersFactory()

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// Clientes
app.get('/api/clientes', async (req, res) => { await clienteController.listClientes(req, res) })
app.get('/api/clientes/:cpf', async (req, res) => { await clienteController.getClienteByCpf(req, res) })
app.post('/api/clientes', async (req, res) => { await clienteController.createCliente(req, res) })

// Veículos
app.get('/api/veiculos/disponiveis', async (req, res) => { await veiculoController.listVeiculosDisponiveis(req, res) })
app.get('/api/veiculos/reservados', async (req, res) => { await veiculoController.listVeiculosReservados(req, res) })
app.get('/api/veiculos/vendidos', async (req, res) => { await veiculoController.listVeiculosVendidos(req, res) })
app.get('/api/veiculos/:placa', async (req, res) => { await veiculoController.getVeiculoById(req, res) })
app.post('/api/veiculos', async (req, res) => { await veiculoController.createVeiculo(req, res) })
app.put('/api/veiculos/:placa', async (req, res) => { await veiculoController.updateVeiculo(req, res) })

// Vendas
app.get('/api/vendas', async (req, res) => { await vendaController.listVendas(req, res) })
app.post('/api/vendas/reservar', async (req, res) => { await vendaController.reservarVeiculo(req, res) })
app.post('/api/vendas/:codigo/cancelar', async (req, res) => { await vendaController.cancelarVenda(req, res) })
app.post('/api/vendas/:codigo/confirmar-pagamento', async (req, res) => { await vendaController.confirmarPagamento(req, res) })

app.listen(3000, () => { logger.info('Servidor de revenda rodando na porta 3000') })
