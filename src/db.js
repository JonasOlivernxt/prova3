import pg from "pg"

// A conexão vem da variável DATABASE_URL (veja .env.example)
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/estoque",
})

export default pool
