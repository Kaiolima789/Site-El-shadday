const { Pool } = require('pg')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL Ã© obrigatÃ³ria. Configure a conexÃ£o PostgreSQL antes de iniciar a API.')
}

const pool = new Pool({ connectionString: databaseUrl, max: 10 })
pool.on('error', (erro) => {
  console.error('Erro inesperado no pool PostgreSQL:', erro)
})

function placeholders(sql) {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

function normalizeRows(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString().replace('T', ' ').slice(0, 19) : value
  ])))
}

async function get(sql, params = []) {
  const result = await pool.query(placeholders(sql), params)
  return normalizeRows(result.rows)[0]
}

async function all(sql, params = []) {
  const result = await pool.query(placeholders(sql), params)
  return normalizeRows(result.rows)
}

async function run(sql, params = []) {
  const result = await pool.query(placeholders(sql), params)
  return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id }
}

async function transaction(operations) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const results = []
    for (const { sql, params = [] } of operations) {
      const values = typeof params === 'function' ? params(results) : params
      const result = await client.query(placeholders(sql), values)
      results.push({ changes: result.rowCount, lastInsertRowid: result.rows[0]?.id })
    }
    await client.query('COMMIT')
    return results
  } catch (erro) {
    await client.query('ROLLBACK')
    throw erro
  } finally {
    client.release()
  }
}

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cardapios (
      id SERIAL PRIMARY KEY,
      data TEXT NOT NULL UNIQUE,
      preco DOUBLE PRECISION NOT NULL,
      ativo INTEGER DEFAULT 1,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS opcoes_cardapio (
      id SERIAL PRIMARY KEY,
      cardapio_id INTEGER NOT NULL REFERENCES cardapios(id),
      categoria TEXT NOT NULL,
      nome TEXT NOT NULL,
      disponivel INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      loja TEXT NOT NULL,
      codigo_vivendas TEXT NOT NULL,
      carne TEXT,
      guarnicao TEXT,
      observacao TEXT,
      preco DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'aguardando',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      expira_em BIGINT NOT NULL
    );
  `)

  const colunasPedidos = [
    ['telefone', "TEXT DEFAULT ''"], ['tipo_entrega', "TEXT DEFAULT ''"],
    ['endereco', "TEXT DEFAULT ''"], ['origem', "TEXT DEFAULT 'vivendas'"],
    ['refrigerante_sabor', "TEXT DEFAULT ''"], ['refrigerante_tamanho', "TEXT DEFAULT ''"],
    ['agua_tipo', "TEXT DEFAULT ''"], ['bebida_quantidade', 'INTEGER DEFAULT 0'],
    ['preco_marmita', 'DOUBLE PRECISION'], ['preco_bebida', 'DOUBLE PRECISION'],
    ['valor_cobrar', 'DOUBLE PRECISION'], ['forma_pagamento', "TEXT DEFAULT ''"],
    ['troco_para', 'DOUBLE PRECISION'], ['quantidade_marmitas', 'INTEGER DEFAULT 1'],
    ['marmitas_json', "TEXT DEFAULT '[]'"], ['cpf_vivendas', "TEXT DEFAULT ''"],
    ['codigo_rastreio', 'TEXT'], ['chave_idempotencia', 'TEXT'], ['pronto_em', 'TIMESTAMP']
  ]

  for (const [nome, definicao] of colunasPedidos) {
    await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ${nome} ${definicao}`)
  }

  await pool.query(`
    UPDATE pedidos
    SET pronto_em = CURRENT_TIMESTAMP
    WHERE status = 'pronto' AND pronto_em IS NULL;
    UPDATE pedidos
    SET cpf_vivendas = regexp_replace(codigo_vivendas, '[^0-9]', '', 'g')
    WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = ''
      AND length(regexp_replace(codigo_vivendas, '[^0-9]', '', 'g')) = 11;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio
      ON pedidos (codigo_rastreio) WHERE codigo_rastreio IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_chave_idempotencia
      ON pedidos (chave_idempotencia) WHERE chave_idempotencia IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_pedidos_cpf_vivendas
      ON pedidos (cpf_vivendas) WHERE origem = 'vivendas' AND cpf_vivendas <> '';
    CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_vivendas_lower
      ON pedidos (lower(codigo_vivendas)) WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = '';
  `)
  console.log('Banco de dados PostgreSQL conectado!')
}

async function close() {
  await pool.end()
}

module.exports = { kind: 'postgres', initialize, get, all, run, transaction, close }
