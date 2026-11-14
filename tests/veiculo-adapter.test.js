import { describe, expect, test } from '@jest/globals'
import { VeiculoAdapter } from '../src/application/gateways/adapters/veiculo-adapter.js'

describe('VeiculoAdapter', () => {
  test('toVeiculo deve incluir a placa do veículo na resposta', () => {
    const row = {
      id: 1,
      veiculo_placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2022,
      cor: 'Branco',
      preco: 85000,
      status: 'DISPONIVEL'
    }

    expect(VeiculoAdapter.toVeiculo(row)).toMatchObject({
      id: 1,
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2022,
      cor: 'Branco',
      preco: 85000,
      status: 'DISPONIVEL'
    })
  })
})
