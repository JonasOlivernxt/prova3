// Regras de negócio do estoque (funções puras, cobertas pelos testes unitários)

export function validarProduto(dados) {
  const erros = []
  const p = dados || {}

  if (typeof p.nome !== "string" || p.nome.trim().length < 2) {
    erros.push("O nome deve ter pelo menos 2 caracteres.")
  }
  if (typeof p.sku !== "string" || !/^[A-Z0-9-]{3,20}$/.test(p.sku)) {
    erros.push("O SKU deve ter de 3 a 20 caracteres: letras maiúsculas, números ou hífen.")
  }
  const preco = Number(p.preco)
  if (!Number.isFinite(preco) || preco < 0) {
    erros.push("O preço deve ser um número maior ou igual a zero.")
  }
  const minimo = p.estoqueMinimo === undefined ? 0 : Number(p.estoqueMinimo)
  if (!Number.isInteger(minimo) || minimo < 0) {
    erros.push("O estoque mínimo deve ser um número inteiro maior ou igual a zero.")
  }

  return { valido: erros.length === 0, erros }
}

export function validarMovimento(dados) {
  const erros = []
  const m = dados || {}

  if (m.tipo !== "entrada" && m.tipo !== "saida") {
    erros.push('O tipo deve ser "entrada" ou "saida".')
  }
  if (!Number.isInteger(m.quantidade) || m.quantidade <= 0) {
    erros.push("A quantidade deve ser um número inteiro maior que zero.")
  }

  return { valido: erros.length === 0, erros }
}

// Saldo = soma das entradas menos soma das saídas
export function calcularSaldo(movimentos) {
  return movimentos.reduce((saldo, m) => {
    return m.tipo === "entrada" ? saldo + m.quantidade : saldo - m.quantidade
  }, 0)
}

export function podeRetirar(saldo, quantidade) {
  return quantidade <= saldo
}

export function precisaRepor(saldo, estoqueMinimo) {
  return saldo <= estoqueMinimo
}
