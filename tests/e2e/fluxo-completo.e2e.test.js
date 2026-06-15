/**
 * Teste End-to-End: Fluxo Completo da Plataforma de Revenda
 *
 * Cobre todos os requisitos de negócio:
 * 1. Cadastrar veículo para venda (marca, modelo, ano, cor, preço)
 * 2. Editar dados do veículo
 * 3. Permitir compra do veículo por pessoas cadastradas
 * 4. Listagem de veículos à venda, ordenada por preço (mais barato → mais caro)
 * 5. Listagem de veículos vendidos, ordenada por preço (mais barato → mais caro)
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { xss } from 'express-xss-sanitizer'
import cors from 'cors'
import { DuplicateResourceError } from '../../src/domain/errors/duplicate-resource-error.js'
import { ClienteController } from '../../src/infrastructure/controllers/cliente-controller.js'
import { VeiculoController } from '../../src/infrastructure/controllers/veiculo-controller.js'
import { VendaController } from '../../src/infrastructure/controllers/venda-controller.js'
import { ClientesUsecase } from '../../src/application/usecases/clientes-usecase.js'
import { VeiculosUsecase } from '../../src/application/usecases/veiculos-usecase.js'
import { VendasUsecase } from '../../src/application/usecases/vendas-usecase.js'

// ─── Mock Repositories (in-memory, stateful) ────────────────────────────────

class MockClientesRepository {
  constructor() {
    this.clientes = new Map()
    this.nextId = 1
  }

  async getClientes() {
    return Array.from(this.clientes.values())
  }

  async getClientesByCpf(cpf) {
    return this.clientes.get(cpf)
  }

  async createCliente(cliente) {
    if (this.clientes.has(cliente.cpf)) {
      throw new DuplicateResourceError('Cliente já cadastrado com esse CPF.')
    }
    const record = { id: this.nextId++, ...cliente }
    this.clientes.set(cliente.cpf, record)
    return record
  }
}

class MockVeiculosRepository {
  constructor() {
    this.veiculos = new Map()
    this.nextId = 1
  }

  async getVeiculosDisponiveis() {
    return Array.from(this.veiculos.values())
      .filter(v => v.status === 'DISPONIVEL')
      .sort((a, b) => a.preco - b.preco)
  }

  async getVeiculosVendidos() {
    return Array.from(this.veiculos.values())
      .filter(v => v.status === 'VENDIDO')
      .sort((a, b) => a.preco - b.preco)
  }

  async getVeiculoById(id) {
    return this.veiculos.get(id)
  }

  async createVeiculo(veiculo) {
    const record = { id: this.nextId++, ...veiculo, status: 'DISPONIVEL' }
    this.veiculos.set(record.id, record)
    return record
  }

  async updateVeiculo(id, updates) {
    const veiculo = this.veiculos.get(id)
    const updated = { ...veiculo, ...updates }
    this.veiculos.set(id, updated)
    return updated
  }

  async markAsVendido(id) {
    const veiculo = this.veiculos.get(id)
    this.veiculos.set(id, { ...veiculo, status: 'VENDIDO' })
  }
}

class MockVendasRepository {
  constructor() {
    this.vendas = []
    this.nextId = 1
  }

  async createVenda(venda) {
    const record = {
      id: this.nextId++,
      veiculoId: venda.veiculoId,
      clienteId: venda.clienteId,
      clienteCpf: venda.clienteCpf,
      preco: venda.preco,
      dataVenda: new Date().toISOString()
    }
    this.vendas.push(record)
    return record
  }
}

// ─── App Factory ─────────────────────────────────────────────────────────────

function createRevendaApp(clientesRepo, veiculosRepo, vendasRepo) {
  const clientesUsecase = new ClientesUsecase(clientesRepo)
  const veiculosUsecase = new VeiculosUsecase(veiculosRepo)
  const vendasUsecase = new VendasUsecase(vendasRepo, clientesRepo, veiculosRepo)

  const clienteController = new ClienteController(clientesUsecase)
  const veiculoController = new VeiculoController(veiculosUsecase)
  const vendaController = new VendaController(vendasUsecase)

  const app = express()
  app.use(express.json())
  app.use(cors())
  app.use(xss())
  app.disable('x-powered-by')

  app.get('/api/health', (req, res) => res.json({ status: 'healthy' }))

  app.get('/api/clientes', (req, res) => clienteController.listClientes(req, res))
  app.get('/api/clientes/:cpf', (req, res) => clienteController.getClienteByCpf(req, res))
  app.post('/api/clientes', (req, res) => clienteController.createCliente(req, res))

  app.get('/api/veiculos/disponiveis', (req, res) => veiculoController.listVeiculosDisponiveis(req, res))
  app.get('/api/veiculos/vendidos', (req, res) => veiculoController.listVeiculosVendidos(req, res))
  app.get('/api/veiculos/:id', (req, res) => veiculoController.getVeiculoById(req, res))
  app.post('/api/veiculos', (req, res) => veiculoController.createVeiculo(req, res))
  app.put('/api/veiculos/:id', (req, res) => veiculoController.updateVeiculo(req, res))

  app.post('/api/vendas', (req, res) => vendaController.comprarVeiculo(req, res))

  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('E2E – Fluxo Completo da Plataforma de Revenda', () => {
  let app
  let clientesRepo, veiculosRepo, vendasRepo
  let veiculoCorollaId, veiculoCivicId, veiculoHRVId

  beforeAll(() => {
    clientesRepo = new MockClientesRepository()
    veiculosRepo = new MockVeiculosRepository()
    vendasRepo = new MockVendasRepository()
    app = createRevendaApp(clientesRepo, veiculosRepo, vendasRepo)
  })

  // ── Health ──────────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    test('deve retornar status healthy', async () => {
      const res = await request(app).get('/api/health').expect(200)
      expect(res.body.status).toBe('healthy')
    })
  })

  // ── REQUISITO 3: Cadastro de cliente (pré-requisito para compra) ────────────
  describe('Cadastro de clientes', () => {
    test('deve cadastrar cliente com sucesso', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'Maria Silva', cpf: '12345678901', email: 'maria@email.com' })
        .expect(201)

      expect(res.body).toMatchObject({ nome: 'Maria Silva', cpf: '12345678901', email: 'maria@email.com' })
      expect(res.body.id).toBeDefined()
    })

    test('deve cadastrar segundo cliente com sucesso', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'João Santos', cpf: '98765432100', email: 'joao@email.com' })
        .expect(201)

      expect(res.body.cpf).toBe('98765432100')
    })

    test('deve rejeitar cadastro com CPF duplicado (409)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'Outro Nome', cpf: '12345678901', email: 'outro@email.com' })
        .expect(409)

      expect(res.body.message).toMatch(/já cadastrado/i)
    })

    test('deve rejeitar cadastro com CPF inválido (400)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'Cliente Teste', cpf: '123', email: 'teste@email.com' })
        .expect(400)

      expect(res.body.message).toMatch(/cpf/i)
    })

    test('deve rejeitar cadastro com e-mail inválido (400)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'Cliente Teste', cpf: '11122233344', email: 'email-invalido' })
        .expect(400)

      expect(res.body.message).toMatch(/e-mail/i)
    })

    test('deve rejeitar cadastro com nome muito curto (400)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nome: 'Jo', cpf: '11122233344', email: 'jo@email.com' })
        .expect(400)

      expect(res.body.message).toMatch(/nome/i)
    })

    test('deve buscar cliente pelo CPF', async () => {
      const res = await request(app)
        .get('/api/clientes/12345678901')
        .expect(200)

      expect(res.body).toMatchObject({ nome: 'Maria Silva', cpf: '12345678901' })
    })

    test('deve retornar 404 para CPF não cadastrado', async () => {
      await request(app).get('/api/clientes/00000000000').expect(404)
    })

    test('deve listar todos os clientes', async () => {
      const res = await request(app).get('/api/clientes').expect(200)
      expect(res.body.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── REQUISITO 1: Cadastro de veículos ───────────────────────────────────────
  describe('Cadastro de veículos', () => {
    test('deve cadastrar Toyota Corolla por R$85.000', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ marca: 'Toyota', modelo: 'Corolla', ano: 2022, cor: 'Branco', preco: 85000 })
        .expect(201)

      expect(res.body).toMatchObject({ marca: 'Toyota', modelo: 'Corolla', ano: 2022, cor: 'Branco', preco: 85000, status: 'DISPONIVEL' })
      expect(res.body.id).toBeDefined()
      veiculoCorollaId = res.body.id
    })

    test('deve cadastrar Honda Civic por R$75.000', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ marca: 'Honda', modelo: 'Civic', ano: 2021, cor: 'Prata', preco: 75000 })
        .expect(201)

      expect(res.body.status).toBe('DISPONIVEL')
      veiculoCivicId = res.body.id
    })

    test('deve cadastrar Honda HR-V por R$95.000', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ marca: 'Honda', modelo: 'HR-V', ano: 2023, cor: 'Preto', preco: 95000 })
        .expect(201)

      veiculoHRVId = res.body.id
    })

    test('deve rejeitar veículo sem marca (400)', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ modelo: 'Corolla', ano: 2022, cor: 'Branco', preco: 85000 })
        .expect(400)

      expect(res.body.message).toBeDefined()
    })

    test('deve rejeitar veículo com preço negativo (400)', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ marca: 'Toyota', modelo: 'Corolla', ano: 2022, cor: 'Branco', preco: -1000 })
        .expect(400)

      expect(res.body.message).toMatch(/preço/i)
    })

    test('deve rejeitar veículo com ano inválido (400)', async () => {
      const res = await request(app)
        .post('/api/veiculos')
        .send({ marca: 'Toyota', modelo: 'Corolla', ano: 1800, cor: 'Branco', preco: 85000 })
        .expect(400)

      expect(res.body.message).toMatch(/ano/i)
    })

    test('deve buscar veículo por ID', async () => {
      const res = await request(app)
        .get(`/api/veiculos/${veiculoCorollaId}`)
        .expect(200)

      expect(res.body.modelo).toBe('Corolla')
    })
  })

  // ── REQUISITO 4: Listagem de veículos à venda, ordenada por preço ───────────
  describe('Listagem de veículos disponíveis (ordenado por preço)', () => {
    test('deve listar veículos DISPONÍVEIS ordenados do mais barato ao mais caro', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)

      expect(res.body.length).toBe(3)
      // Civic R$75k, Corolla R$85k, HR-V R$95k
      expect(res.body[0].modelo).toBe('Civic')
      expect(res.body[0].preco).toBe(75000)
      expect(res.body[1].modelo).toBe('Corolla')
      expect(res.body[1].preco).toBe(85000)
      expect(res.body[2].modelo).toBe('HR-V')
      expect(res.body[2].preco).toBe(95000)

      // Garante que todos estão disponíveis
      for (const v of res.body) {
        expect(v.status).toBe('DISPONIVEL')
      }
    })

    test('deve garantir que a ordenação por preço está correta', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)
      const precos = res.body.map(v => v.preco)
      const sorted = [...precos].sort((a, b) => a - b)
      expect(precos).toEqual(sorted)
    })
  })

  // ── REQUISITO 2: Edição de dados do veículo ─────────────────────────────────
  describe('Edição de dados do veículo', () => {
    test('deve atualizar o preço do Corolla para R$70.000', async () => {
      const res = await request(app)
        .put(`/api/veiculos/${veiculoCorollaId}`)
        .send({ preco: 70000 })
        .expect(200)

      expect(res.body.preco).toBe(70000)
      expect(res.body.modelo).toBe('Corolla')
    })

    test('deve atualizar cor e modelo simultaneamente', async () => {
      const res = await request(app)
        .put(`/api/veiculos/${veiculoCivicId}`)
        .send({ cor: 'Azul', modelo: 'Civic Type R' })
        .expect(200)

      expect(res.body.cor).toBe('Azul')
      expect(res.body.modelo).toBe('Civic Type R')
    })

    test('deve rejeitar atualização sem campos válidos (400)', async () => {
      const res = await request(app)
        .put(`/api/veiculos/${veiculoCorollaId}`)
        .send({ campoInexistente: 'valor' })
        .expect(400)

      expect(res.body.message).toMatch(/nenhum campo/i)
    })

    test('deve rejeitar atualização de veículo inexistente (404)', async () => {
      await request(app)
        .put('/api/veiculos/99999')
        .send({ preco: 50000 })
        .expect(404)
    })

    test('listagem deve refletir novo preço do Corolla (agora mais barato que o Civic)', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)

      // Corolla R$70k, Civic Type R R$75k, HR-V R$95k
      expect(res.body[0].modelo).toBe('Corolla')
      expect(res.body[0].preco).toBe(70000)
      expect(res.body[1].modelo).toBe('Civic Type R')
    })
  })

  // ── REQUISITO 3: Compra de veículo (cliente deve estar cadastrado) ──────────
  describe('Compra de veículo', () => {
    test('deve rejeitar compra de cliente não cadastrado (404)', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoCorollaId, clienteCpf: '00000000000' })
        .expect(404)

      expect(res.body.message).toMatch(/cliente/i)
    })

    test('deve rejeitar compra com CPF inválido (400)', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoCorollaId, clienteCpf: '123' })
        .expect(400)

      expect(res.body.message).toMatch(/cpf/i)
    })

    test('deve rejeitar compra de veículo inexistente (404)', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: 99999, clienteCpf: '12345678901' })
        .expect(404)

      expect(res.body.message).toMatch(/veículo/i)
    })

    test('deve rejeitar compra sem campos obrigatórios (400)', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoCorollaId })
        .expect(400)

      expect(res.body.message).toBeDefined()
    })

    test('Maria deve comprar o Corolla com sucesso', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoCorollaId, clienteCpf: '12345678901' })
        .expect(201)

      expect(res.body).toMatchObject({
        veiculoId: veiculoCorollaId,
        clienteCpf: '12345678901',
        preco: 70000
      })
      expect(res.body.veiculo.status).toBe('VENDIDO')
      expect(res.body.cliente.nome).toBe('Maria Silva')
      expect(res.body.id).toBeDefined()
    })

    test('deve rejeitar segunda compra do mesmo veículo já vendido (422)', async () => {
      const res = await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoCorollaId, clienteCpf: '98765432100' })
        .expect(422)

      expect(res.body.message).toMatch(/disponível/i)
    })

    test('deve rejeitar edição de veículo já vendido (400)', async () => {
      const res = await request(app)
        .put(`/api/veiculos/${veiculoCorollaId}`)
        .send({ preco: 60000 })
        .expect(400)

      expect(res.body.message).toMatch(/vendido/i)
    })
  })

  // ── REQUISITO 4 (pós-venda): Listagem de veículos disponíveis ──────────────
  describe('Listagem de veículos disponíveis após venda', () => {
    test('deve retornar apenas 2 veículos disponíveis (Corolla foi vendido)', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)

      expect(res.body.length).toBe(2)
      const modelos = res.body.map(v => v.modelo)
      expect(modelos).not.toContain('Corolla')
    })

    test('deve manter ordenação por preço após a venda', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)

      // Civic Type R R$75k, HR-V R$95k
      expect(res.body[0].preco).toBe(75000)
      expect(res.body[1].preco).toBe(95000)
      const precos = res.body.map(v => v.preco)
      const sorted = [...precos].sort((a, b) => a - b)
      expect(precos).toEqual(sorted)
    })
  })

  // ── REQUISITO 5: Listagem de veículos vendidos, ordenada por preço ──────────
  describe('Listagem de veículos vendidos', () => {
    test('deve retornar o Corolla na lista de vendidos', async () => {
      const res = await request(app).get('/api/veiculos/vendidos').expect(200)

      expect(res.body.length).toBe(1)
      expect(res.body[0].modelo).toBe('Corolla')
      expect(res.body[0].status).toBe('VENDIDO')
      expect(res.body[0].preco).toBe(70000)
    })

    test('João compra o HR-V', async () => {
      await request(app)
        .post('/api/vendas')
        .send({ veiculoId: veiculoHRVId, clienteCpf: '98765432100' })
        .expect(201)
    })

    test('deve listar 2 veículos vendidos, ordenados por preço', async () => {
      const res = await request(app).get('/api/veiculos/vendidos').expect(200)

      expect(res.body.length).toBe(2)
      // Corolla R$70k deve vir antes do HR-V R$95k
      expect(res.body[0].modelo).toBe('Corolla')
      expect(res.body[0].preco).toBe(70000)
      expect(res.body[1].modelo).toBe('HR-V')
      expect(res.body[1].preco).toBe(95000)

      // Garante ordenação crescente
      const precos = res.body.map(v => v.preco)
      const sorted = [...precos].sort((a, b) => a - b)
      expect(precos).toEqual(sorted)
    })

    test('deve restar apenas 1 veículo disponível (Civic Type R)', async () => {
      const res = await request(app).get('/api/veiculos/disponiveis').expect(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0].modelo).toBe('Civic Type R')
    })
  })

  // ── Resumo do estado final ───────────────────────────────────────────────────
  describe('Estado final do sistema', () => {
    test('deve haver 2 clientes cadastrados', async () => {
      const res = await request(app).get('/api/clientes').expect(200)
      expect(res.body.length).toBe(2)
    })

    test('deve haver 1 veículo disponível e 2 vendidos', async () => {
      const [disponiveis, vendidos] = await Promise.all([
        request(app).get('/api/veiculos/disponiveis'),
        request(app).get('/api/veiculos/vendidos')
      ])
      expect(disponiveis.body.length).toBe(1)
      expect(vendidos.body.length).toBe(2)
    })
  })
})
