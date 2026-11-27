// Testes de integração: chamam a API (supertest) e gravam no PostgreSQL de verdade.
// Precisam do banco rodando com as tabelas criadas (db/migrations).
import { test, describe, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import app from "../../src/app.js"
import pool from "../../src/db.js"

const caneta = { nome: "Caneta azul", sku: "CAN-001", preco: 2.5, estoqueMinimo: 5 }

beforeEach(async () => {
  await pool.query("TRUNCATE movimentos, produtos RESTART IDENTITY")
})

after(async () => {
  await pool.end()
})

describe("API de estoque", () => {
  test("GET /health responde ok", async () => {
    const res = await request(app).get("/health")
    assert.equal(res.status, 200)
    assert.equal(res.body.status, "ok")
  })

  test("POST /produtos cadastra com saldo zero e pedido de reposição", async () => {
    const res = await request(app).post("/produtos").send(caneta)
    assert.equal(res.status, 201)
    assert.equal(res.body.saldo, 0)
    assert.equal(res.body.precisaRepor, true)
  })

  test("POST /produtos inválido retorna 400 e SKU repetido retorna 409", async () => {
    assert.equal((await request(app).post("/produtos").send({ nome: "X" })).status, 400)
    await request(app).post("/produtos").send(caneta)
    assert.equal((await request(app).post("/produtos").send(caneta)).status, 409)
  })

  test("entradas e saídas atualizam o saldo", async () => {
    await request(app).post("/produtos").send(caneta)
    await request(app).post("/produtos/1/movimentos").send({ tipo: "entrada", quantidade: 20 })
    const res = await request(app)
      .post("/produtos/1/movimentos")
      .send({ tipo: "saida", quantidade: 8 })
    assert.equal(res.status, 201)
    assert.equal(res.body.saldo, 12)
    assert.equal(res.body.precisaRepor, false)
  })

  test("saída maior que o saldo retorna 409", async () => {
    await request(app).post("/produtos").send(caneta)
    await request(app).post("/produtos/1/movimentos").send({ tipo: "entrada", quantidade: 2 })
    const res = await request(app)
      .post("/produtos/1/movimentos")
      .send({ tipo: "saida", quantidade: 3 })
    assert.equal(res.status, 409)
  })

  test("GET /produtos lista e GET /produtos/:id retorna 404 se não existir", async () => {
    await request(app).post("/produtos").send(caneta)
    const lista = await request(app).get("/produtos")
    assert.equal(lista.body.length, 1)
    assert.equal((await request(app).get("/produtos/99")).status, 404)
  })

  test("GET /produtos/:id/movimentos lista o histórico", async () => {
    await request(app).post("/produtos").send(caneta)
    await request(app).post("/produtos/1/movimentos").send({ tipo: "entrada", quantidade: 4 })
    const res = await request(app).get("/produtos/1/movimentos")
    assert.equal(res.body.length, 1)
    assert.equal(res.body[0].tipo, "entrada")
  })

  test("DELETE /produtos/:id remove o produto e o histórico", async () => {
    await request(app).post("/produtos").send(caneta)
    assert.equal((await request(app).delete("/produtos/1")).status, 204)
    assert.equal((await request(app).delete("/produtos/1")).status, 404)
  })
})
