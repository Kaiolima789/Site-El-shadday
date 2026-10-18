const path = require('node:path')
const fs = require('node:fs/promises')
const db = require('./database')

async function criarBackup() {
  const backupDir = process.env.BACKUP_DIR || path.resolve('backups')
  const destinoDir = path.resolve(backupDir)
  const nomeArquivo = `elshadday-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
  const destino = path.join(destinoDir, nomeArquivo)

  await fs.mkdir(destinoDir, { recursive: true })
  await db.backup(destino)
  console.log(`Backup SQLite criado: ${destino}`)
}

criarBackup()
  .catch((erro) => {
    console.error('Falha ao criar backup SQLite:', erro)
    process.exitCode = 1
  })
  .finally(() => db.close())
