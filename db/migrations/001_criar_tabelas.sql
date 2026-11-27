CREATE TABLE IF NOT EXISTS produtos (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(120)  NOT NULL,
  sku             VARCHAR(20)   NOT NULL UNIQUE,
  preco           NUMERIC(10,2) NOT NULL,
  estoque_minimo  INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS movimentos (
  id          SERIAL PRIMARY KEY,
  produto_id  INTEGER     NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo        VARCHAR(7)  NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade  INTEGER     NOT NULL CHECK (quantidade > 0),
  criado_em   TIMESTAMP   NOT NULL DEFAULT NOW()
);
