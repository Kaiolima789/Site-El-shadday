const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const { Pool } = require('pg')
const database = require('./database')

const sourcePath = process.env.DATABASE_SOURCE_PATH
const databaseUrl = process.env.DATABASE_URL
const tables = ['cardapios', 'opcoes_cardapio', 'pedidos']

async function migrar() {
  if (!databaseUrl) throw new Error('Defina DATABASE_URL para o PostgreSQL de destino.')
  if (!sourcePath) throw new Error('Defina DATABASE_SOURCE_PATH com o caminho do arquivo SQLite de origem.')
  const caminhoOrigem = path.resolve(sourcePath)
  if (!fs.existsSync(caminhoOrigem)) throw new Error(`Arquivo SQLite não encontrado: ${caminhoOrigem}`)
  if (process.env.CONFIRM_POSTGRES_IMPORT !== 'YES') {
    throw new Error('Defina CONFIRM_POSTGRES_IMPORT=YES após confirmar a origem e o banco PostgreSQL de destino.')
  }

  const origem = new Database(caminhoOrigem, { readonly: true, fileMustExist: true })
  const destino = new Pool({ connectionString: databaseUrl, max: 1 })
  try {
    await database.initialize()
    const existentes = await Promise.all(tables.map(async (table) => {
      const resultado = await destino.query(`SELECT COUNT(*)::integer AS total FROM ${table}`)
      return { table, total: resultado.rows[0].total }
    }))
    if (existentes.some(({ total }) => total !== 0)) {
      throw new Error(`O PostgreSQL não está vazio: ${existentes.map(({ table, total }) => `${table}=${total}`).join(', ')}. Importação cancelada.`)
    }

    const colunasDestino = new Map()
    for (const table of tables) {
      const resultado = await destino.query(
        'SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1',
        [table]
      )
      colunasDestino.set(table, new Set(resultado.rows.map((row) => row.column_name)))
    }

    await destino.query('BEGIN')
    const totais = {}
    for (const table of tables) {
      const linhas = origem.prepare(`SELECT * FROM ${table} ORDER BY id`).all()
      const colunas = linhas.length
        ? Object.keys(linhas[0]).filter((coluna) => colunasDestino.get(table).has(coluna))
        : []
      for (let offset = 0; offset < linhas.length; offset += 200) {
        const lote = linhas.slice(offset, offset + 200)
        const nomes = colunas.map((coluna) => `"${coluna}"`).join(', ')
        const valores = []
        const grupos = lote.map((linha) => `(${colunas.map((coluna) => {
          valores.push(linha[coluna])
          return `$${valores.length}`
        }).join(', ')})`)
        await destino.query(`INSERT INTO "${table}" (${nomes}) VALUES ${grupos.join(', ')}`, valores)
      }
      totais[table] = linhas.length
      if (colunasDestino.get(table).has('id')) {
        await destino.query(`
          SELECT setval(pg_get_serial_sequence('${table}', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1),
            EXISTS(SELECT 1 FROM "${table}"))
        `)
      }
      const contagemImportada = await destino.query(`SELECT COUNT(*)::integer AS total FROM "${table}"`)
      if (contagemImportada.rows[0].total !== linhas.length) {
        throw new Error(`A conferência da tabela ${table} falhou: esperados ${linhas.length}, encontrados ${contagemImportada.rows[0].total}.`)
      }
    }
    await destino.query('COMMIT')
    console.log(`Importação concluída de ${caminhoOrigem}: ${JSON.stringify(totais)}`)
  } catch (erro) {
    try { await destino.query('ROLLBACK') } catch {}
    throw erro
  } finally {
    origem.close()
    await destino.end()
    await database.close()
  }
}

migrar().catch((erro) => {
  console.error('Falha na migração SQLite → PostgreSQL:', erro.message)
  process.exitCode = 1
})
