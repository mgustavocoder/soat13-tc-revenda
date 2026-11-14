import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { createApp as createClientesApp } from '../../soat13-tc-revenda-clientes/src/app.js'
import { createApp as createVeiculosApp } from '../../soat13-tc-revenda-veiculos/src/app.js'
import { createApp as createVendasApp } from '../../soat13-tc-revenda-vendas/src/app.js'

describe('contratos HTTP entre os microserviços', () => {
  it('clientes expõe busca interna por CPF', async () => {
    const app = createClientesApp({
      db: {
        execute: async () => [[{
          id: 1,
          nome: 'Maria Silva',
          cpf: '12345678901',
          email: 'maria@email.com'
        }]]
      }
    })

    const response = await request(app).get('/internal/clientes/12345678901')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ cpf: '12345678901', nome: 'Maria Silva' })
  })

  it('veículos expõe alteração de status por API', async () => {
    let status = 'DISPONIVEL'
    const app = createVeiculosApp({
      db: {
        execute: async (sql, params) => {
          if (sql.startsWith('SELECT')) {
            return [[{
              id: 7,
              placa: 'ABC1D23',
              marca: 'Toyota',
              modelo: 'Corolla',
              ano: 2024,
              cor: 'Branco',
              preco: 85000,
              status
            }]]
          }
          status = params[0]
          return [{ affectedRows: 1 }]
        }
      }
    })

    const response = await request(app)
      .patch('/internal/veiculos/ABC1D23/status')
      .send({ status: 'RESERVADO' })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('RESERVADO')
    expect(status).toBe('RESERVADO')
  })

  it('vendas enfileira a reserva e retorna o status de processamento', async () => {
    const sale = {
      id: 11,
      codigo: 'VEN-1234ABCD',
      veiculo_placa: 'ABC1D23',
      cliente_cpf: '12345678901',
      data_venda: '2026-11-02T00:00:00.000Z',
      preco: null,
      status: 'RESERVA_PROCESSANDO'
    }
    let message
    const app = createVendasApp({
      db: {
        execute: async (sql, params) => {
          if (sql.startsWith('INSERT')) {
            sale.codigo = params[0]
            return [{ insertId: 11 }]
          }
          if (sql.startsWith('SELECT id, codigo')) return [[sale]]
          throw new Error(`SQL não esperado: ${sql}`)
        }
      },
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/sales',
      sqsClient: { send: async (command) => { message = command.input } },
      fetchImpl: async () => { throw new Error('A reserva deve ser processada pelo worker') }
    })

    const response = await request(app)
      .post('/api/vendas/reservar')
      .send({ veiculoPlaca: 'ABC1D23', clienteCpf: '12345678901' })

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      clienteCpf: '12345678901',
      veiculoPlaca: 'ABC1D23',
      status: 'RESERVA_PROCESSANDO'
    })
    expect(JSON.parse(message.MessageBody)).toEqual({
      tipo: 'RESERVAR_VEICULO',
      codigo: response.body.codigo
    })
  })
})
