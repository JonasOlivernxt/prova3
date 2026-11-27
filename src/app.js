import express from "express"
import pool from "./db.js"
import {
  validarProduto,
  validarMovimento,
  calcularSaldo,
  podeRetirar,
  precisaRepor,
} from "./estoque.js"

const app = express()
app.use(express.json())

// Express 4: repassa erros de funções async para o tratador de erros
const rota = (fn) => (req, res, next) => fn(req, res).catch(next)

async function buscarProduto(id) {
  const produto = await pool.query("SELECT * FROM produtos WHERE id = $1", [id])
  if (produto.rows.length === 0) return null
  const movimentos = await pool.query(
    "SELECT tipo, quantidade FROM movimentos WHERE produto_id = $1",
    [id],
  )
  const p = produto.rows[0]
  const saldo = calcularSaldo(movimentos.rows)
  return {
    ...p,
    preco: Number(p.preco),
    saldo,
    precisaRepor: precisaRepor(saldo, p.estoque_minimo),
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.get(
  "/produtos",
  rota(async (req, res) => {
    const { rows } = await pool.query("SELECT id FROM produtos ORDER BY id")
    const produtos = []
    for (const { id } of rows) produtos.push(await buscarProduto(id))
    res.json(produtos)
  }),
)

app.get(
  "/produtos/:id",
  rota(async (req, res) => {
    const produto = await buscarProduto(Number(req.params.id))
    if (!produto) return res.status(404).json({ erros: ["Produto não encontrado."] })
    res.json(produto)
  }),
)

app.post(
  "/produtos",
  rota(async (req, res) => {
    const { valido, erros } = validarProduto(req.body)
    if (!valido) return res.status(400).json({ erros })

    const { nome, sku, preco, estoqueMinimo = 0 } = req.body
    try {
      const { rows } = await pool.query(
        "INSERT INTO produtos (nome, sku, preco, estoque_minimo) VALUES ($1, $2, $3, $4) RETURNING id",
        [nome.trim(), sku, preco, estoqueMinimo],
      )
      res.status(201).json(await buscarProduto(rows[0].id))
    } catch (erro) {
      if (erro.code === "23505") {
        return res.status(409).json({ erros: ["Já existe um produto com esse SKU."] })
      }
      throw erro
    }
  }),
)

app.delete(
  "/produtos/:id",
  rota(async (req, res) => {
    const resultado = await pool.query("DELETE FROM produtos WHERE id = $1", [
      Number(req.params.id),
    ])
    if (resultado.rowCount === 0) {
      return res.status(404).json({ erros: ["Produto não encontrado."] })
    }
    res.status(204).send()
  }),
)

app.post(
  "/produtos/:id/movimentos",
  rota(async (req, res) => {
    const produto = await buscarProduto(Number(req.params.id))
    if (!produto) return res.status(404).json({ erros: ["Produto não encontrado."] })

    const { valido, erros } = validarMovimento(req.body)
    if (!valido) return res.status(400).json({ erros })

    const { tipo, quantidade } = req.body
    if (tipo === "saida" && !podeRetirar(produto.saldo, quantidade)) {
      return res.status(409).json({ erros: [`Saldo insuficiente: há ${produto.saldo} unidades.`] })
    }

    await pool.query("INSERT INTO movimentos (produto_id, tipo, quantidade) VALUES ($1, $2, $3)", [
      produto.id,
      tipo,
      quantidade,
    ])
    res.status(201).json(await buscarProduto(produto.id))
  }),
)

app.get(
  "/produtos/:id/movimentos",
  rota(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, tipo, quantidade, criado_em FROM movimentos WHERE produto_id = $1 ORDER BY id",
      [Number(req.params.id)],
    )
    res.json(rows)
  }),
)

app.use((req, res) => {
  res.status(404).json({ erros: ["Rota não encontrada."] })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ erros: ["Erro interno do servidor."] })
})

export default app
