import { describe, expect, test } from '@jest/globals'
import { stripResponseIds, stripResponseIdsFromCollection } from '../src/infrastructure/api/response-sanitizer.js'

describe('response sanitizer', () => {
  test('remove ids de objetos de consulta e de payloads aninhados', () => {
    const cliente = { id: 7, nome: 'Maria', cpf: '12345678901', email: 'maria@email.com' }
    const veiculo = { id: 12, placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla', preco: 85000 }
    const venda = {
      id: 3,
      codigo: 'VEN-123',
      veiculoId: 12,
      clienteId: 7,
      veiculoPlaca: 'ABC1D23',
      clienteCpf: '12345678901',
      veiculo: { id: 12, placa: 'ABC1D23', status: 'RESERVADO' },
      cliente: { id: 7, nome: 'Maria', cpf: '12345678901' }
    }

    expect(stripResponseIds(cliente)).toEqual({ nome: 'Maria', cpf: '12345678901', email: 'maria@email.com' })
    expect(stripResponseIds(veiculo)).toEqual({ placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla', preco: 85000 })
    expect(stripResponseIds(venda)).toEqual({
      codigo: 'VEN-123',
      veiculoPlaca: 'ABC1D23',
      clienteCpf: '12345678901',
      veiculo: { placa: 'ABC1D23', status: 'RESERVADO' },
      cliente: { nome: 'Maria', cpf: '12345678901' }
    })
    expect(stripResponseIdsFromCollection([cliente, veiculo, venda])).toEqual([
      { nome: 'Maria', cpf: '12345678901', email: 'maria@email.com' },
      { placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla', preco: 85000 },
      {
        codigo: 'VEN-123',
        veiculoPlaca: 'ABC1D23',
        clienteCpf: '12345678901',
        veiculo: { placa: 'ABC1D23', status: 'RESERVADO' },
        cliente: { nome: 'Maria', cpf: '12345678901' }
      }
    ])
  })
})
