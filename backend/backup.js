const path = require('node:path')
const fs = require('node:fs/promises')

async function criarBackup({ db, databasePath = process.env.DATABASE_PATH || 'elshadday.db' }) {
  if (!db) throw new Error('A conexão SQLite é obrigatória para criar o backup.')

  const caminhoBanco = path.resolve(databasePath)
  const diretorioBackups = path.resolve(
    process.env.BACKUP_DIR || path.join(path.dirname(caminhoBanco), 'backups')
  )
  await fs.mkdir(diretorioBackups, { recursive: true })

  const dataHora = new Date().toISOString().replace(/[:.]/g, '-')
  const destino = path.join(diretorioBackups, `elshadday-${dataHora}.db`)
  await db.backup(destino)

  const limiteRetencao = Date.now() - 30 * 24 * 60 * 60 * 1000
  const arquivos = await fs.readdir(diretorioBackups, { withFileTypes: true })
  await Promise.all(arquivos
    .filter((arquivo) => arquivo.isFile() && /^elshadday-.*\.db$/.test(arquivo.name))
    .map(async (arquivo) => {
      const arquivoPath = path.join(diretorioBackups, arquivo.name)
      const info = await fs.stat(arquivoPath)
      if (info.mtimeMs < limiteRetencao) await fs.unlink(arquivoPath)
    }))

  return destino
}

module.exports = { criarBackup }

if (require.main === module) {
  const db = require('./database')
  criarBackup({ db })
    .then((destino) => console.log(`Backup SQLite criado: ${destino}`))
    .catch((erro) => {
      console.error('Falha ao criar backup SQLite:', erro)
      process.exitCode = 1
    })
    .finally(() => db.close())
}
