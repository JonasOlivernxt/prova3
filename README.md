# API Estoque

API REST de controle de estoque: cadastro de produtos e registro de entradas e saídas,
com cálculo de saldo e aviso de reposição. Feita em Node.js (ES Modules) com Express e PostgreSQL.

## Tecnologias

- Node.js 22, Express 4, ES Modules (`import`)
- PostgreSQL 16 (biblioteca `pg`, conexão por `DATABASE_URL`)
- Testes com o executor nativo do Node (`node:test`) e Supertest

## Como rodar

```bash
docker compose up -d   # sobe o PostgreSQL já com as tabelas
npm install
npm start              # http://localhost:3000
```

## Endpoints

| Método | Rota                       | Descrição                                          |
| ------ | -------------------------- | -------------------------------------------------- |
| GET    | `/health`                  | Verifica se a API está no ar                       |
| GET    | `/produtos`                | Lista os produtos com saldo                        |
| GET    | `/produtos/:id`            | Busca um produto                                   |
| POST   | `/produtos`                | Cadastra (`nome`, `sku`, `preco`, `estoqueMinimo`) |
| DELETE | `/produtos/:id`            | Remove o produto e o histórico                     |
| POST   | `/produtos/:id/movimentos` | Registra entrada ou saída (`tipo`, `quantidade`)   |
| GET    | `/produtos/:id/movimentos` | Histórico de movimentos                            |

## Testes

```bash
npm test
```

Os testes ficam em `tests/unit` (sem banco) e `tests/integration` (precisam do banco).

## Atividade

Faça um fork deste repositório e implemente o CI no GitHub Actions contemplando:

- análise estática de código
- análise de formatação (respeite o `.prettierrc` do projeto)
- análise estática de segurança
- build
- teste unitário, executado em Node.js 20 e 22
- teste de integração
- criação de imagem
- gatilho em Pull Request e também em push na branch main

Entregue o link do fork e do Pull Request com o pipeline aprovado.

**Bônus:** workflow de CD que publique a imagem após o merge.
