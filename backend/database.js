const Database = require('better-sqlite3')

const databasePath = process.env.DATABASE_PATH || 'elshadday.db'
const db = new Database(databasePath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS cardapios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL UNIQUE,
    preco REAL NOT NULL,
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS opcoes_cardapio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardapio_id INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    nome TEXT NOT NULL,
    disponivel INTEGER DEFAULT 1,
    FOREIGN KEY (cardapio_id) REFERENCES cardapios(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    loja TEXT NOT NULL,
    codigo_vivendas TEXT NOT NULL,
    carne TEXT,
    guarnicao TEXT,
    observacao TEXT,
    preco REAL NOT NULL,
    status TEXT DEFAULT 'aguardando',
    codigo_rastreio TEXT,
    chave_idempotencia TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

console.log('Banco de dados conectado!')

module.exports = db
