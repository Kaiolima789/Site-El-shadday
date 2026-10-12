const { after, before, test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const Database = require('better-sqlite3')

const backendDir = path.resolve(__dirname, '..')
let tempDir
let databasePath
let baseUrl
let child
let token
let database
let stdout = ''

async function freePort() {
  const probe = net.createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', resolve)
  })
  const port = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  return port
}

async function aguardarServidor() {
  const inicio = Date.now()
  while (Date.now() - inicio < 10000) {
    if (child.exitCode !== null) throw new Error(`API encerrou: ${stdout}`)
    if (stdout.includes('Servidor rodando na porta')) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`API nÃ£o iniciou: ${stdout}`)
}

async function chamar(rota, opcoes = {}) {
  return fetch(`${baseUrl}${rota}`, {
    ...opcoes,
    headers: {
      ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opcoes.admin ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
  })
}

before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'el-shadday-test-'))
  databasePath = path.join(tempDir, 'test.db')
  const port = await freePort()
  baseUrl = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(port), DATABASE_PATH: databasePath, ADMIN_PASSWORD: 'senha-de-teste-123' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
  await aguardarServidor()
  database = new Database(databasePath)
})

after(async () => {
  if (database?.open) database.close()
  if (child && child.exitCode === null) {
    if (process.platform === 'win32') {
      child.kill()
      await new Promise((resolve) => child.once('exit', resolve))
    } else {
      child.kill('SIGTERM')
      await new Promise((resolve) => child.once('close', resolve))
      assert.match(stdout, /Servidor e banco de dados encerrados\./)
    }
  }
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
})

test('health check confirma que a API consegue consultar o banco', async () => {
  const resposta = await chamar('/health')
  assert.equal(resposta.status, 200)
  assert.deepEqual(await resposta.json(), { status: 'ok', database: 'ok' })
})

test('recusa origem desconhecida e rotas administrativas sem sessao', async () => {
  const cors = await fetch(`${baseUrl}/`, { headers: { Origin: 'https://origem-invasora.example' } })
  assert.equal(cors.status, 403)
  const pedidos = await chamar('/pedidos')
  assert.equal(pedidos.status, 401)
  const criar = await chamar('/cardapios', { method: 'POST', body: {} })
  assert.equal(criar.status, 401)
})

test('login rejeita senha errada e cria sessao para a senha configurada', async () => {
  const errada = await chamar('/admin/login', { method: 'POST', body: { senha: 'errada' } })
  assert.equal(errada.status, 401)
  const resposta = await chamar('/admin/login', { method: 'POST', body: { senha: 'senha-de-teste-123' } })
  assert.equal(resposta.status, 200)
  token = (await resposta.json()).token
  assert.equal(typeof token, 'string')
  assert.ok(token.length >= 32)
})

test('limita tentativas repetidas de senha e tamanho de requisicao', async () => {
  for (let i = 0; i < 8; i += 1) {
    const resposta = await chamar('/admin/login', { method: 'POST', body: { senha: 'incorreta' } })
    assert.equal(resposta.status, 401)
  }
  const bloqueada = await chamar('/admin/login', { method: 'POST', body: { senha: 'incorreta' } })
  assert.equal(bloqueada.status, 429)

  const grande = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campo: 'x'.repeat(33 * 1024) })
  })
  assert.equal(grande.status, 413)
})

test('validacao recusa cardapio invalido sem gravar dados', async () => {
  const resposta = await chamar('/cardapios', {
    method: 'POST', admin: true,
    body: { data: '2030-02-30', preco: -5, opcoes: [{ categoria: 'carne', nome: 'X' }] }
  })
  assert.equal(resposta.status, 400)
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM cardapios').get().total, 0)
})

test('criacao eh atomica: falha ao inserir opcao nao deixa cardapio pela metade', async () => {
  database.exec(`CREATE TRIGGER falhar_opcao BEFORE INSERT ON opcoes_cardapio
    WHEN NEW.nome = 'Falha de teste' BEGIN SELECT RAISE(ABORT, 'falha de teste'); END`)
  const resposta = await chamar('/cardapios', {
    method: 'POST', admin: true,
    body: { data: '2030-01-01', preco: 18, opcoes: [
      { categoria: 'carne', nome: 'Frango' },
      { categoria: 'guarnicao', nome: 'Falha de teste' }
    ] }
  })
  assert.equal(resposta.status, 500)
  assert.equal(database.prepare("SELECT COUNT(*) AS total FROM cardapios WHERE data='2030-01-01'").get().total, 0)
  database.exec('DROP TRIGGER falhar_opcao')
})

test('criacao, duplicidade e edicao preservam consistencia', async () => {
  const menu = { data: '2030-01-01', preco: 18, opcoes: [
    { categoria: 'carne', nome: 'Frango' },
    { categoria: 'guarnicao', nome: 'Arroz' }
  ] }
  const criado = await chamar('/cardapios', { method: 'POST', admin: true, body: menu })
  assert.equal(criado.status, 201)
  const id = (await criado.json()).id

  const duplicado = await chamar('/cardapios', { method: 'POST', admin: true, body: menu })
  assert.equal(duplicado.status, 409)
  assert.equal((await duplicado.json()).id, id)
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM cardapios').get().total, 1)
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM opcoes_cardapio').get().total, 2)

  database.exec(`CREATE TRIGGER falhar_edicao BEFORE INSERT ON opcoes_cardapio
    WHEN NEW.nome = 'Falha de teste' BEGIN SELECT RAISE(ABORT, 'falha de teste'); END`)
  const falhaEdicao = await chamar('/cardapios/2030-01-01', {
    method: 'PUT', admin: true,
    body: { preco: 25, opcoes: [{ categoria: 'carne', nome: 'Falha de teste' }] }
  })
  assert.equal(falhaEdicao.status, 500)
  const anterior = await chamar('/cardapios/2030-01-01')
  const dadosAnteriores = await anterior.json()
  assert.equal(dadosAnteriores.preco, 18)
  assert.deepEqual(dadosAnteriores.opcoes.map((opcao) => opcao.nome), ['Frango', 'Arroz'])
  database.exec('DROP TRIGGER falhar_edicao')

  const atualizado = await chamar('/cardapios/2030-01-01', {
    method: 'PUT', admin: true,
    body: { preco: 25, opcoes: [{ categoria: 'carne', nome: 'Bife' }] }
  })
  assert.equal(atualizado.status, 200)
  assert.equal((await (await chamar('/cardapios/2030-01-01')).json()).preco, 25)
})

test('API suporta volume de pedidos, pagina por cursor e consulta publica nao revela dados pessoais', async () => {
  const inserir = database.prepare(`INSERT INTO pedidos (nome, loja, codigo_vivendas, preco, status)
    VALUES (?, '', '', 18, 'aguardando')`)
  const inserirLote = database.transaction(() => {
    for (let i = 0; i < 5000; i += 1) inserir.run(`Cliente ${i}`)
  })
  inserirLote()

  const primeira = await chamar('/pedidos', { admin: true })
  assert.equal(primeira.status, 200)
  const primeiraPagina = await primeira.json()
  assert.equal(primeiraPagina.length, 100)
  assert.equal(primeira.headers.get('X-Has-More'), 'true')
  const cursor = primeira.headers.get('X-Next-Cursor')
  assert.ok(cursor)
  const segunda = await chamar(`/pedidos?limit=100&beforeId=${cursor}`, { admin: true })
  const segundaPagina = await segunda.json()
  assert.equal(segundaPagina.length, 100)
  assert.equal(segunda.headers.get('X-Has-More'), 'true')
  assert.equal(segundaPagina.some((pedido) => primeiraPagina.some((item) => item.id === pedido.id)), false)

  const ultima = await chamar('/pedidos?limit=100&beforeId=2', { admin: true })
  assert.equal((await ultima.json()).length, 1)
  assert.equal(ultima.headers.get('X-Has-More'), 'false')

  const pedido = database.prepare('SELECT id FROM pedidos LIMIT 1').get()
  const publico = await chamar(`/pedidos/${pedido.id}`)
  const dadosPublicos = await publico.json()
  assert.equal(publico.status, 200)
  assert.deepEqual(Object.keys(dadosPublicos).sort(), ['criado_em', 'id', 'status'])
})
