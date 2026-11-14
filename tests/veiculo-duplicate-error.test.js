import { describe, expect, test } from '@jest/globals'
import { DuplicateResourceError } from '../src/domain/errors/duplicate-resource-error.js'
import { VeiculosRepository } from '../src/application/gateways/veiculos-repository.js'

describe('VeiculosRepository', () => {
  test('lança DuplicateResourceError quando a placa já existe', async () => {
    const queryBuilder = () => ({
      insert: async () => {
        const error = new Error('Duplicate entry')
        error.code = 'ER_DUP_ENTRY'
        throw error
      }
    })

    const repository = new VeiculosRepository(queryBuilder)

    await expect(repository.createVeiculo({
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2022,
      cor: 'Branco',
      placa: 'ABC1D23',
      preco: 85000
    })).rejects.toBeInstanceOf(DuplicateResourceError)
  })
})
