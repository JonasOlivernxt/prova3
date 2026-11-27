import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  validarProduto,
  validarMovimento,
  calcularSaldo,
  podeRetirar,
  precisaRepor,
} from "../../src/estoque.js"

describe("validarProduto", () => {
  test("aceita produto válido", () => {
    const r = validarProduto({ nome: "Caneta azul", sku: "CAN-001", preco: 2.5 })
    assert.deepEqual(r, { valido: true, erros: [] })
  })

  test("recusa nome curto", () => {
    assert.equal(validarProduto({ nome: "A", sku: "CAN-001", preco: 1 }).valido, false)
  })

  test("recusa SKU com letra minúscula", () => {
    assert.equal(validarProduto({ nome: "Caneta", sku: "can-001", preco: 1 }).valido, false)
  })

  test("recusa preço negativo", () => {
    assert.equal(validarProduto({ nome: "Caneta", sku: "CAN-001", preco: -1 }).valido, false)
  })

  test("recusa estoque mínimo fracionado", () => {
    const r = validarProduto({ nome: "Caneta", sku: "CAN-001", preco: 1, estoqueMinimo: 1.5 })
    assert.equal(r.valido, false)
  })
})

describe("validarMovimento", () => {
  test("aceita entrada e saída", () => {
    assert.equal(validarMovimento({ tipo: "entrada", quantidade: 10 }).valido, true)
    assert.equal(validarMovimento({ tipo: "saida", quantidade: 1 }).valido, true)
  })

  test("recusa tipo desconhecido", () => {
    assert.equal(validarMovimento({ tipo: "ajuste", quantidade: 1 }).valido, false)
  })

  test("recusa quantidade zero", () => {
    assert.equal(validarMovimento({ tipo: "entrada", quantidade: 0 }).valido, false)
  })
})

describe("calcularSaldo", () => {
  test("sem movimentos o saldo é zero", () => {
    assert.equal(calcularSaldo([]), 0)
  })

  test("soma entradas e desconta saídas", () => {
    const movimentos = [
      { tipo: "entrada", quantidade: 10 },
      { tipo: "saida", quantidade: 3 },
      { tipo: "entrada", quantidade: 5 },
    ]
    assert.equal(calcularSaldo(movimentos), 12)
  })
})

describe("regras de retirada e reposição", () => {
  test("só retira se houver saldo", () => {
    assert.equal(podeRetirar(5, 5), true)
    assert.equal(podeRetirar(5, 6), false)
  })

  test("avisa reposição no estoque mínimo", () => {
    assert.equal(precisaRepor(3, 3), true)
    assert.equal(precisaRepor(4, 3), false)
  })
})
