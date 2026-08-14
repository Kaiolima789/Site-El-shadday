const Database = require('better-sqlite3')

const db = new Database('elshadday.db')

db.pragma('journal_mode = WAL')

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

console.log('Banco de dados conectado!')

module.exports = db