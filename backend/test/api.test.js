const { after, before, describe, test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const net = require('node:net')
const path = require('node:path')
const { Pool } = require('pg')

const backendDir = path.resolve(__dirname, '..')
const databaseUrl = process.env.TEST_DATABASE_URL
const schema = `test_${require('node:crypto').randomBytes(8).toString('hex')}`
let adminPool
let database
let baseUrl
let child
let token
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
  while (Date.now() - inicio < 15000) {
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

describe('API PostgreSQL', { skip: !databaseUrl && 'Defina TEST_DATABASE_URL para rodar a suíte de integração PostgreSQL.' }, () => {
  before(async () => {
    adminPool = new Pool({ connectionString: databaseUrl })
    await adminPool.query(`CREATE SCHEMA "${schema}"`)
    const isolatedUrl = new URL(databaseUrl)
    isolatedUrl.searchParams.set('options', `-c search_path=${schema}`)
    const testDatabaseUrl = isolatedUrl.toString()
    database = new Pool({ connectionString: testDatabaseUrl })

    await database.query(`
      CREATE TABLE pedidos (
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
      INSERT INTO pedidos (nome, loja, codigo_vivendas, preco, status)
      VALUES ('Pedido antigo', '', '', 18, 'aguardando');
    `)

    const port = await freePort()
    baseUrl = `http://127.0.0.1:${port}`
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendDir,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: String(port),
        DATABASE_URL: testDatabaseUrl,
        ADMIN_PASSWORD: 'senha-de-teste-123456'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
    await aguardarServidor()
  })

  after(async () => {
    if (child && child.exitCode === null) {
      child.kill()
      await new Promise((resolve) => child.once('exit', resolve))
    }
    await database?.end()
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await adminPool.end()
    }
  })

  test('health check confirma a conexÃ£o PostgreSQL', async () => {
    const resposta = await chamar('/health')
    assert.equal(resposta.status, 200)
    assert.deepEqual(await resposta.json(), { status: 'ok', database: 'postgres' })
  })

  test('migra pedidos existentes adicionando as colunas necessÃ¡rias', async () => {
    const colunas = await database.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'pedidos'
    `, [schema])
    const nomes = colunas.rows.map((coluna) => coluna.column_name)
    assert.ok(nomes.includes('codigo_rastreio'))
    assert.ok(nomes.includes('chave_idempotencia'))
    const pedidoAntigo = await database.query('SELECT nome, codigo_rastreio FROM pedidos WHERE id = 1')
    assert.deepEqual(pedidoAntigo.rows[0], { nome: 'Pedido antigo', codigo_rastreio: null })
  })

  test('recusa origem desconhecida e rotas administrativas sem sessao', async () => {
    const cors = await fetch(`${baseUrl}/`, { headers: { Origin: 'https://origem-invasora.example' } })
    assert.equal(cors.status, 403)
    const preflight = await fetch(`${baseUrl}/pedidos`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,idempotency-key'
      }
    })
    assert.equal(preflight.status, 204)
    assert.match(preflight.headers.get('Access-Control-Allow-Headers'), /idempotency-key/i)
    assert.equal((await chamar('/pedidos')).status, 401)
    assert.equal((await chamar('/cardapios', { method: 'POST', body: {} })).status, 401)
  })

  test('login rejeita senha errada e cria sessao com a senha configurada', async () => {
    const errada = await chamar('/admin/login', { method: 'POST', body: { senha: 'errada' } })
    assert.equal(errada.status, 401)
    const resposta = await chamar('/admin/login', { method: 'POST', body: { senha: 'senha-de-teste-123456' } })
    assert.equal(resposta.status, 200)
    token = (await resposta.json()).token
    assert.equal(typeof token, 'string')
    assert.ok(token.length >= 32)
  })

  test('limita tentativas repetidas de senha e tamanho de requisicao', async () => {
    for (let i = 0; i < 8; i += 1) {
      assert.equal((await chamar('/admin/login', { method: 'POST', body: { senha: 'incorreta' } })).status, 401)
    }
    assert.equal((await chamar('/admin/login', { method: 'POST', body: { senha: 'incorreta' } })).status, 429)
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
    assert.equal(Number((await database.query('SELECT COUNT(*) AS total FROM cardapios')).rows[0].total), 0)
  })

  test('validacao de pedidos rejeita campos malformados e valores negativos', async () => {
    const resposta = await chamar('/pedidos', {
      method: 'POST',
      body: {
        origem: 'vivendas', nome: { inesperado: true }, telefone: '61999999999',
        loja: 'Centro', codigo: '123', preco: 18, preco_marmita: 18,
        preco_bebida: 0, valor_cobrar: -5
      }
    })
    assert.equal(resposta.status, 400)
    assert.equal(Number((await database.query('SELECT COUNT(*) AS total FROM pedidos')).rows[0].total), 1)
  })

  test('pedido Vivendas vÃ¡lido salva telefone e suporta idempotencia', async () => {
    const chaveIdempotencia = 'ab'.repeat(16)
    const resposta = await chamar('/pedidos', {
      method: 'POST',
      headers: { 'Idempotency-Key': chaveIdempotencia },
      body: {
        origem: 'vivendas', nome: 'Cliente Teste', telefone: '(61) 99999-9999',
        loja: 'Centro', codigo: '123', tipo_entrega: 'loja', carne: 'Frango',
        guarnicao: 'Arroz', preco: 18, preco_marmita: 18, preco_bebida: 0,
        valor_cobrar: 0, bebida_quantidade: 0, forma_pagamento: ''
      }
    })
    assert.equal(resposta.status, 201)
    const pedidoCriado = await resposta.json()
    const { id, codigo_rastreio: codigo } = pedidoCriado
    const salvo = await database.query('SELECT nome, telefone, codigo_rastreio, chave_idempotencia FROM pedidos WHERE id = $1', [id])
    assert.deepEqual(salvo.rows[0], {
      nome: 'Cliente Teste', telefone: '(61) 99999-9999',
      codigo_rastreio: codigo, chave_idempotencia: chaveIdempotencia
    })
    assert.match(codigo, /^[a-f0-9]{48}$/)

    const repetido = await chamar('/pedidos', {
      method: 'POST', headers: { 'Idempotency-Key': chaveIdempotencia }, body: {}
    })
    const pedidoRepetido = await repetido.json()
    assert.equal(repetido.status, 200)
    assert.equal(pedidoRepetido.duplicado, true)
    assert.equal(pedidoRepetido.id, id)
    assert.equal(pedidoRepetido.codigo_rastreio, codigo)
    assert.equal(Number((await database.query('SELECT COUNT(*) AS total FROM pedidos')).rows[0].total), 2)

    const rastreio = await chamar(`/pedidos/rastreio/${codigo}`)
    assert.equal(rastreio.status, 200)
    assert.deepEqual(Object.keys(await rastreio.json()).sort(), ['criado_em', 'id', 'status'])
    assert.equal((await chamar(`/pedidos/${id}`)).status, 404)
  })

  test('criacao de cardapio e edicao sao atomicas', async () => {
    await database.query(`ALTER TABLE opcoes_cardapio ADD CONSTRAINT teste_falha_opcao CHECK (nome <> 'Falha de teste')`)
    const falhaCriacao = await chamar('/cardapios', {
      method: 'POST', admin: true,
      body: { data: '2030-01-01', preco: 18, opcoes: [
        { categoria: 'carne', nome: 'Frango' }, { categoria: 'guarnicao', nome: 'Falha de teste' }
      ] }
    })
    assert.equal(falhaCriacao.status, 500)
    assert.equal(Number((await database.query("SELECT COUNT(*) AS total FROM cardapios WHERE data = '2030-01-01'")).rows[0].total), 0)
    await database.query('ALTER TABLE opcoes_cardapio DROP CONSTRAINT teste_falha_opcao')

    const menu = { data: '2030-01-01', preco: 18, opcoes: [
      { categoria: 'carne', nome: 'Frango' }, { categoria: 'guarnicao', nome: 'Arroz' }
    ] }
    const criado = await chamar('/cardapios', { method: 'POST', admin: true, body: menu })
    assert.equal(criado.status, 201)
    const id = (await criado.json()).id
    const duplicado = await chamar('/cardapios', { method: 'POST', admin: true, body: menu })
    assert.equal(duplicado.status, 409)
    assert.equal((await duplicado.json()).id, id)
    assert.equal(Number((await database.query('SELECT COUNT(*) AS total FROM opcoes_cardapio')).rows[0].total), 2)

    await database.query(`ALTER TABLE opcoes_cardapio ADD CONSTRAINT teste_falha_edicao CHECK (nome <> 'Falha de teste')`)
    const falhaEdicao = await chamar('/cardapios/2030-01-01', {
      method: 'PUT', admin: true,
      body: { preco: 25, opcoes: [{ categoria: 'carne', nome: 'Falha de teste' }] }
    })
    assert.equal(falhaEdicao.status, 500)
    const anterior = await (await chamar('/cardapios/2030-01-01')).json()
    assert.equal(anterior.preco, 18)
    assert.deepEqual(anterior.opcoes.map((opcao) => opcao.nome), ['Frango', 'Arroz'])
    await database.query('ALTER TABLE opcoes_cardapio DROP CONSTRAINT teste_falha_edicao')

    const atualizado = await chamar('/cardapios/2030-01-01', {
      method: 'PUT', admin: true,
      body: { preco: 25, opcoes: [{ categoria: 'carne', nome: 'Bife' }] }
    })
    assert.equal(atualizado.status, 200)
    assert.equal((await (await chamar('/cardapios/2030-01-01')).json()).preco, 25)
  })

  test('pagina milhares de pedidos e nÃ£o revela dados pessoais no rastreio', async () => {
    await database.query(`
      INSERT INTO pedidos (nome, loja, codigo_vivendas, preco, status)
      SELECT 'Cliente ' || n, '', '', 18, 'aguardando' FROM generate_series(1, 5000) AS n
    `)
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

    const pedido = await database.query('SELECT id FROM pedidos WHERE codigo_rastreio IS NULL LIMIT 1')
    const publico = await chamar(`/pedidos/${pedido.rows[0].id}`)
    const dadosPublicos = await publico.json()
    assert.equal(publico.status, 200)
    assert.deepEqual(Object.keys(dadosPublicos).sort(), ['criado_em', 'id', 'status'])
  })
})
