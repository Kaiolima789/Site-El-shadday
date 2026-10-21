const Database = require('better-sqlite3')

const databasePath = process.env.DATABASE_PATH || 'elshadday.db'
const isPostgres = Boolean(process.env.DATABASE_URL)
const sqlite = isPostgres ? null : new Database(databasePath)
const pool = isPostgres
  ? new (require('pg').Pool)({ connectionString: process.env.DATABASE_URL, max: 10 })
  : null

if (sqlite) {
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('busy_timeout = 5000')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cardapios (
      id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL UNIQUE,
      preco REAL NOT NULL, ativo INTEGER DEFAULT 1, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS opcoes_cardapio (
      id INTEGER PRIMARY KEY AUTOINCREMENT, cardapio_id INTEGER NOT NULL,
      categoria TEXT NOT NULL, nome TEXT NOT NULL, disponivel INTEGER DEFAULT 1,
      FOREIGN KEY (cardapio_id) REFERENCES cardapios(id)
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, loja TEXT NOT NULL,
      codigo_vivendas TEXT NOT NULL, carne TEXT, guarnicao TEXT, observacao TEXT,
      preco REAL NOT NULL, status TEXT DEFAULT 'aguardando', codigo_rastreio TEXT,
      chave_idempotencia TEXT, quantidade_marmitas INTEGER DEFAULT 1,
      marmitas_json TEXT DEFAULT '[]', cpf_vivendas TEXT DEFAULT '',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP, pronto_em DATETIME
    );
  `)
}

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
  if (sqlite) return sqlite.prepare(sql).get(...params)
  const result = await pool.query(placeholders(sql), params)
  return normalizeRows(result.rows)[0]
}

async function all(sql, params = []) {
  if (sqlite) return sqlite.prepare(sql).all(...params)
  const result = await pool.query(placeholders(sql), params)
  return normalizeRows(result.rows)
}

async function run(sql, params = []) {
  if (sqlite) {
    const statement = sqlite.prepare(sql)
    if (/\bRETURNING\b/i.test(sql)) {
      const row = statement.get(...params)
      return { changes: 1, lastInsertRowid: Number(row?.id) }
    }
    const result = statement.run(...params)
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  }
  const result = await pool.query(placeholders(sql), params)
  return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id }
}

async function transaction(operations) {
  if (sqlite) {
    return sqlite.transaction(() => {
      const results = []
      for (const { sql, params = [] } of operations) {
        const valores = typeof params === 'function' ? params(results) : params
        const statement = sqlite.prepare(sql)
        const resultado = /\bRETURNING\b/i.test(sql)
          ? { row: statement.get(...valores) }
          : { result: statement.run(...valores) }
        results.push({
          changes: resultado.result?.changes ?? 1,
          lastInsertRowid: Number(resultado.row?.id ?? resultado.result?.lastInsertRowid)
        })
      }
      return results
    })()
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const results = []
    for (const { sql, params = [] } of operations) {
      const valores = typeof params === 'function' ? params(results) : params
      const resultado = await client.query(placeholders(sql), valores)
      results.push({ changes: resultado.rowCount, lastInsertRowid: resultado.rows[0]?.id })
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

const colunasPedidos = [
  ['telefone', "TEXT DEFAULT ''"], ['tipo_entrega', "TEXT DEFAULT ''"],
  ['endereco', "TEXT DEFAULT ''"], ['origem', "TEXT DEFAULT 'vivendas'"],
  ['refrigerante_sabor', "TEXT DEFAULT ''"], ['refrigerante_tamanho', "TEXT DEFAULT ''"],
  ['agua_tipo', "TEXT DEFAULT ''"], ['bebida_quantidade', 'INTEGER DEFAULT 0'],
  ['preco_marmita', 'REAL'], ['preco_bebida', 'REAL'], ['valor_cobrar', 'REAL'],
  ['forma_pagamento', "TEXT DEFAULT ''"], ['troco_para', 'REAL'],
  ['quantidade_marmitas', 'INTEGER DEFAULT 1'], ['marmitas_json', "TEXT DEFAULT '[]'"],
  ['cpf_vivendas', "TEXT DEFAULT ''"], ['codigo_rastreio', 'TEXT'],
  ['chave_idempotencia', 'TEXT'], ['pronto_em', 'DATETIME']
]

async function initialize() {
  if (sqlite) {
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    sqlite.pragma('busy_timeout = 5000')
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS cardapios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL UNIQUE,
        preco REAL NOT NULL, ativo INTEGER DEFAULT 1, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS opcoes_cardapio (
        id INTEGER PRIMARY KEY AUTOINCREMENT, cardapio_id INTEGER NOT NULL,
        categoria TEXT NOT NULL, nome TEXT NOT NULL, disponivel INTEGER DEFAULT 1,
        FOREIGN KEY (cardapio_id) REFERENCES cardapios(id)
      );
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, loja TEXT NOT NULL,
        codigo_vivendas TEXT NOT NULL, carne TEXT, guarnicao TEXT, observacao TEXT,
        preco REAL NOT NULL, status TEXT DEFAULT 'aguardando', codigo_rastreio TEXT,
        chave_idempotencia TEXT, quantidade_marmitas INTEGER DEFAULT 1,
        marmitas_json TEXT DEFAULT '[]', cpf_vivendas TEXT DEFAULT '',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY, expira_em INTEGER NOT NULL
      );
    `)
    const existentes = new Set(sqlite.prepare('PRAGMA table_info(pedidos)').all().map((coluna) => coluna.name))
    for (const [nome, definicao] of colunasPedidos) {
      if (!existentes.has(nome)) sqlite.exec(`ALTER TABLE pedidos ADD COLUMN ${nome} ${definicao}`)
    }
    sqlite.exec("UPDATE pedidos SET pronto_em = CURRENT_TIMESTAMP WHERE status = 'pronto' AND pronto_em IS NULL")
    const pedidosAntigos = sqlite.prepare(`
      SELECT id, codigo_vivendas FROM pedidos
      WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = ''
    `).all()
    const atualizarCpf = sqlite.prepare('UPDATE pedidos SET cpf_vivendas = ? WHERE id = ?')
    for (const pedido of pedidosAntigos) {
      const cpf = String(pedido.codigo_vivendas || '').replace(/\D/g, '')
      if (cpf.length === 11) atualizarCpf.run(cpf, pedido.id)
    }
    sqlite.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio
        ON pedidos (codigo_rastreio) WHERE codigo_rastreio IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_chave_idempotencia
        ON pedidos (chave_idempotencia) WHERE chave_idempotencia IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_pedidos_cpf_vivendas
        ON pedidos (cpf_vivendas) WHERE origem = 'vivendas' AND cpf_vivendas <> '';
      CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_vivendas_lower
        ON pedidos (lower(codigo_vivendas)) WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = '';
    `)
    console.log('Banco de dados SQLite conectado!')
    return
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cardapios (
      id SERIAL PRIMARY KEY, data TEXT NOT NULL UNIQUE, preco DOUBLE PRECISION NOT NULL,
      ativo INTEGER DEFAULT 1, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS opcoes_cardapio (
      id SERIAL PRIMARY KEY, cardapio_id INTEGER NOT NULL REFERENCES cardapios(id),
      categoria TEXT NOT NULL, nome TEXT NOT NULL, disponivel INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY, nome TEXT NOT NULL, loja TEXT NOT NULL, codigo_vivendas TEXT NOT NULL,
      carne TEXT, guarnicao TEXT, observacao TEXT, preco DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'aguardando', codigo_rastreio TEXT, chave_idempotencia TEXT,
      quantidade_marmitas INTEGER DEFAULT 1, marmitas_json TEXT DEFAULT '[]',
      cpf_vivendas TEXT DEFAULT '', criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      telefone TEXT DEFAULT '', tipo_entrega TEXT DEFAULT '', endereco TEXT DEFAULT '',
      origem TEXT DEFAULT 'vivendas', refrigerante_sabor TEXT DEFAULT '',
      refrigerante_tamanho TEXT DEFAULT '', agua_tipo TEXT DEFAULT '', bebida_quantidade INTEGER DEFAULT 0,
      preco_marmita DOUBLE PRECISION, preco_bebida DOUBLE PRECISION, valor_cobrar DOUBLE PRECISION,
      forma_pagamento TEXT DEFAULT '', troco_para DOUBLE PRECISION, pronto_em TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY, expira_em BIGINT NOT NULL
    );
  `)
  for (const [nome, definicao] of colunasPedidos) {
    const tipoDefault = definicao.replace(/\s+DEFAULT\s+.+$/i, '')
    const defaultValue = definicao.match(/\s+DEFAULT\s+(.+)$/i)?.[1]
    await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ${nome} ${tipoDefault}${defaultValue ? ` DEFAULT ${defaultValue}` : ''}`)
  }
  await pool.query("UPDATE pedidos SET pronto_em = CURRENT_TIMESTAMP WHERE status = 'pronto' AND pronto_em IS NULL")
  await pool.query(`
    UPDATE pedidos SET cpf_vivendas = regexp_replace(codigo_vivendas, '[^0-9]', '', 'g')
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
  if (sqlite) sqlite.close()
  else await pool.end()
}

async function backup(destination) {
  if (!sqlite) throw new Error('O backup SQLite só pode ser executado quando o backend usa SQLite.')
  return sqlite.backup(destination)
}

module.exports = {
  kind: isPostgres ? 'postgres' : 'sqlite',
  initialize, get, all, run, transaction, close, backup,
  prepare: sqlite ? sqlite.prepare.bind(sqlite) : null,
  exec: sqlite ? sqlite.exec.bind(sqlite) : null,
  pragma: sqlite ? sqlite.pragma.bind(sqlite) : null
}
