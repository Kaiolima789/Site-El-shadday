const express = require('express')
const cors = require('cors')
const crypto = require('node:crypto')
const db = require('./database')

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
app.set('trust proxy', 1)

const allowedOrigins = new Set([
  'https://site-el-shadday.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
])

app.use(cors({
  exposedHeaders: ['X-Has-More', 'X-Next-Cursor'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origem não autorizada pelo CORS.'))
  }
}))
app.use(express.json({ limit: '32kb' }))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cache-Control', 'no-store')
  next()
})

const sessoesAdmin = new Map()
const tentativasLogin = new Map()
const tentativasPedidos = new Map()
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000
const MAX_ESTADOS_RATE_LIMIT = 10000
const MAX_SESSOES_ADMIN = 1000

function obterEstadoRateLimit(mapa, chave, agora, duracaoJanela) {
  let estado = mapa.get(chave)
  if (estado && agora - estado.inicio > duracaoJanela) {
    mapa.delete(chave)
    estado = null
  }

  if (!estado) {
    if (mapa.size >= MAX_ESTADOS_RATE_LIMIT) {
      const chavesRemover = Math.ceil(MAX_ESTADOS_RATE_LIMIT * 0.1)
      let removidas = 0
      for (const chaveAntiga of mapa.keys()) {
        mapa.delete(chaveAntiga)
        removidas += 1
        if (removidas >= chavesRemover) break
      }
    }
    estado = { quantidade: 0, inicio: agora }
  }

  // Mantém os estados recentemente usados no fim do mapa para limitar a memória.
  mapa.delete(chave)
  mapa.set(chave, estado)
  return estado
}

function limitarLogin(req, res, next) {
  const agora = Date.now()
  const chave = req.ip || req.socket.remoteAddress || 'desconhecido'
  const estado = obterEstadoRateLimit(tentativasLogin, chave, agora, 15 * 60 * 1000)
  if (estado.quantidade >= 8) {
    res.setHeader('Retry-After', '900')
    return res.status(429).json({ erro: 'Muitas tentativas. Tente novamente em 15 minutos.' })
  }
  estado.quantidade += 1
  tentativasLogin.set(chave, estado)
  next()
}

function limitarPedidos(req, res, next) {
  const agora = Date.now()
  const chave = req.ip || req.socket.remoteAddress || 'desconhecido'
  const estado = obterEstadoRateLimit(tentativasPedidos, chave, agora, 60 * 1000)
  if (estado.quantidade >= 30) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ erro: 'Muitos pedidos enviados deste dispositivo. Aguarde um minuto e tente novamente.' })
  }
  estado.quantidade += 1
  tentativasPedidos.set(chave, estado)
  next()
}

function exigirAdmin(req, res, next) {
  const token = req.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const expiraEm = token && sessoesAdmin.get(token)
  if (!expiraEm || expiraEm <= Date.now()) {
    if (token) sessoesAdmin.delete(token)
    return res.status(401).json({ erro: 'Sessão administrativa expirada. Entre novamente.' })
  }
  next()
}

app.post('/admin/login', limitarLogin, (req, res) => {
  const senhaConfigurada = process.env.ADMIN_PASSWORD
  if (!senhaConfigurada) {
    return res.status(503).json({ erro: 'A senha administrativa ainda não foi configurada no servidor.' })
  }
  if (senhaConfigurada.length < 16) {
    return res.status(503).json({ erro: 'Configure uma senha administrativa com pelo menos 16 caracteres.' })
  }

  const senhaEnviada = typeof req.body?.senha === 'string' ? req.body.senha : ''
  const hashConfigurado = crypto.createHash('sha256').update(senhaConfigurada).digest()
  const hashEnviado = crypto.createHash('sha256').update(senhaEnviada).digest()
  if (!crypto.timingSafeEqual(hashConfigurado, hashEnviado)) {
    return res.status(401).json({ erro: 'Senha incorreta.' })
  }

  tentativasLogin.delete(req.ip || req.socket.remoteAddress || 'desconhecido')
  for (const [sessao, expiraEm] of sessoesAdmin) {
    if (expiraEm <= Date.now()) sessoesAdmin.delete(sessao)
  }
  if (sessoesAdmin.size >= MAX_SESSOES_ADMIN) {
    sessoesAdmin.delete(sessoesAdmin.keys().next().value)
  }
  const token = crypto.randomBytes(32).toString('hex')
  sessoesAdmin.set(token, Date.now() + DURACAO_SESSAO_MS)
  res.json({ token, expiraEm: DURACAO_SESSAO_MS })
})

app.post('/admin/logout', exigirAdmin, (req, res) => {
  const token = req.get('Authorization').replace(/^Bearer\s+/i, '')
  sessoesAdmin.delete(token)
  res.status(204).end()
})

// ===== MIGRAÇÃO: colunas do cliente comum (roda sozinha, só adiciona se faltar) =====
const colunasPedidos = db
  .prepare('PRAGMA table_info(pedidos)')
  .all()
  .map((coluna) => coluna.name)

const novasColunas = [
  ['telefone', "TEXT DEFAULT ''"],
  ['tipo_entrega', "TEXT DEFAULT ''"],
  ['endereco', "TEXT DEFAULT ''"],
  ['origem', "TEXT DEFAULT 'vivendas'"],
  ['refrigerante_sabor', "TEXT DEFAULT ''"],
  ['refrigerante_tamanho', "TEXT DEFAULT ''"],
  ['agua_tipo', "TEXT DEFAULT ''"],
  ['bebida_quantidade', 'INTEGER DEFAULT 0'],
  ['preco_marmita', 'REAL'],
  ['preco_bebida', 'REAL'],
  ['valor_cobrar', 'REAL'],
  ['forma_pagamento', "TEXT DEFAULT ''"],
  ['troco_para', 'REAL'],
  ['quantidade_marmitas', 'INTEGER DEFAULT 1'],
  ['marmitas_json', "TEXT DEFAULT '[]'"],
  ['cpf_vivendas', "TEXT DEFAULT ''"],
  ['codigo_rastreio', 'TEXT'],
  ['chave_idempotencia', 'TEXT']
]

for (const [nomeColuna, definicao] of novasColunas) {
  if (!colunasPedidos.includes(nomeColuna)) {
    db.prepare(`ALTER TABLE pedidos ADD COLUMN ${nomeColuna} ${definicao}`).run()
    console.log(`Coluna "${nomeColuna}" adicionada na tabela pedidos.`)
  }
}

// Reconhece CPFs usados anteriormente no campo único "código ou CPF".
const pedidosVivendasAntigos = db.prepare(`
  SELECT id, codigo_vivendas FROM pedidos
  WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = ''
`).all()
const salvarCpfAntigo = db.prepare('UPDATE pedidos SET cpf_vivendas = ? WHERE id = ?')
for (const pedido of pedidosVivendasAntigos) {
  const cpf = String(pedido.codigo_vivendas || '').replace(/\D/g, '')
  if (cpf.length === 11) salvarCpfAntigo.run(cpf, pedido.id)
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio
  ON pedidos (codigo_rastreio)
  WHERE codigo_rastreio IS NOT NULL
`)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_chave_idempotencia
  ON pedidos (chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL
`)

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API El Shadday funcionando!'
  })
})

app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get()
    return res.json({ status: 'ok', database: 'ok' })
  } catch (erro) {
    console.error('Verificação do banco falhou:', erro)
    return res.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

function validarCardapio(body) {
  const data = typeof body?.data === 'string' ? body.data : ''
  const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    !Number.isNaN(Date.parse(`${data}T00:00:00Z`)) &&
    new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) === data
  const preco = Number(body?.preco)
  const opcoesRecebidas = body?.opcoes

  if (!dataValida) return { erro: 'Informe uma data válida para o cardápio.' }
  if (!Number.isFinite(preco) || preco <= 0 || preco > 1000) {
    return { erro: 'O preço deve ser maior que zero e menor ou igual a R$ 1.000,00.' }
  }
  if (!Array.isArray(opcoesRecebidas) || opcoesRecebidas.length < 1 || opcoesRecebidas.length > 40) {
    return { erro: 'Informe entre 1 e 40 opções para o cardápio.' }
  }

  const opcoes = []
  const chaves = new Set()
  for (const opcao of opcoesRecebidas) {
    const categoria = typeof opcao?.categoria === 'string' ? opcao.categoria.trim() : ''
    const nome = typeof opcao?.nome === 'string' ? opcao.nome.trim() : ''
    if (!['carne', 'guarnicao'].includes(categoria) || !nome || nome.length > 100) {
      return { erro: 'Cada opção precisa ter uma categoria válida e um nome de até 100 caracteres.' }
    }
    const chave = `${categoria}:${nome.toLocaleLowerCase('pt-BR')}`
    if (chaves.has(chave)) return { erro: 'O cardápio não pode ter opções repetidas.' }
    chaves.add(chave)
    opcoes.push({ categoria, nome })
  }
  return { data, preco, opcoes }
}

const criarCardapio = db.transaction(({ data, preco, opcoes }) => {
  const resultado = db.prepare('INSERT INTO cardapios (data, preco) VALUES (?, ?)').run(data, preco)
  const inserirOpcao = db.prepare(`
    INSERT INTO opcoes_cardapio (cardapio_id, categoria, nome)
    VALUES (?, ?, ?)
  `)
  for (const opcao of opcoes) inserirOpcao.run(resultado.lastInsertRowid, opcao.categoria, opcao.nome)
  return Number(resultado.lastInsertRowid)
})

const atualizarCardapio = db.transaction((id, preco, opcoes) => {
  db.prepare('UPDATE cardapios SET preco = ? WHERE id = ?').run(preco, id)
  db.prepare('DELETE FROM opcoes_cardapio WHERE cardapio_id = ?').run(id)
  const inserirOpcao = db.prepare(`
    INSERT INTO opcoes_cardapio (cardapio_id, categoria, nome)
    VALUES (?, ?, ?)
  `)
  for (const opcao of opcoes) inserirOpcao.run(id, opcao.categoria, opcao.nome)
})

app.post('/cardapios', exigirAdmin, (req, res) => {
  const validacao = validarCardapio(req.body)
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro })

  try {
    const id = criarCardapio(validacao)
    return res.status(201).json({ mensagem: 'Card\u00e1pio criado com sucesso!', id })
  } catch (erro) {
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existente = db.prepare('SELECT id FROM cardapios WHERE data = ?').get(validacao.data)
      return res.status(409).json({
        erro: 'J\u00e1 existe um card\u00e1pio para essa data. Ele foi carregado para edi\u00e7\u00e3o.',
        id: existente?.id
      })
    }
    console.error('Falha ao criar card\u00e1pio:', erro)
    return res.status(500).json({ erro: 'N\u00e3o foi poss\u00edvel salvar o card\u00e1pio. Seus dados continuam na tela; tente novamente.' })
  }
})

app.get('/cardapios/:data', (req, res) => {
  const { data } = req.params

  const cardapio = db.prepare(`
    SELECT *
    FROM cardapios
    WHERE data = ? AND ativo = 1
  `).get(data)

  if (!cardapio) {
    return res.status(404).json({
      erro: 'Nenhum cardápio encontrado para essa data.'
    })
  }

  const opcoes = db.prepare(`
    SELECT id, categoria, nome, disponivel
    FROM opcoes_cardapio
    WHERE cardapio_id = ? AND disponivel = 1
  `).all(cardapio.id)

  res.json({
    ...cardapio,
    opcoes
  })
})

app.put('/cardapios/:data', exigirAdmin, (req, res) => {
  const validacao = validarCardapio({ ...req.body, data: req.params.data })
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro })

  const cardapio = db.prepare('SELECT id FROM cardapios WHERE data = ?').get(validacao.data)
  if (!cardapio) return res.status(404).json({ erro: 'Card\u00e1pio n\u00e3o encontrado para essa data.' })

  try {
    atualizarCardapio(cardapio.id, validacao.preco, validacao.opcoes)
    return res.json({ mensagem: 'Card\u00e1pio atualizado com sucesso!' })
  } catch (erro) {
    console.error('Falha ao atualizar card\u00e1pio:', erro)
    return res.status(500).json({ erro: 'N\u00e3o foi poss\u00edvel atualizar o card\u00e1pio. A vers\u00e3o anterior foi preservada.' })
  }
})

function responderPedidoExistente(res, pedido) {
  return res.status(200).json({
    mensagem: 'Este pedido já foi recebido.',
    id: pedido.id,
    codigo_rastreio: pedido.codigo_rastreio,
    duplicado: true
  })
}

const PRECOS_BEBIDAS = new Map([
  ['lata', 5], ['600 ml', 7.5], ['600ml', 7.5], ['2 litros', 12], ['2l', 12],
  ['água sem gás', 3], ['agua sem gas', 3], ['água com gás', 3.5], ['agua com gas', 3.5]
])

function precosBebidasValidos(itens) {
  let total = 0
  for (const marmita of itens) {
    if (!Array.isArray(marmita?.bebidas)) continue
    for (const bebida of marmita.bebidas) {
      const quantidade = Number(bebida?.quantidade)
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 10) return { erro: 'A quantidade de uma bebida é inválida.' }
      const chave = bebida?.tipo === 'refrigerante'
        ? String(bebida?.tamanho || '').trim().toLocaleLowerCase('pt-BR')
        : bebida?.tipo === 'agua'
          ? String(bebida?.nome || '').trim().toLocaleLowerCase('pt-BR')
          : ''
      const unitario = PRECOS_BEBIDAS.get(chave)
      if (unitario === undefined) return { erro: 'Uma bebida do pedido não é válida.' }
      total += unitario * quantidade
    }
  }
  return { total: Math.round(total * 100) / 100 }
}

function dataLocalSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

app.post('/pedidos', limitarPedidos, (req, res) => {
  const chaveRecebida = req.get('Idempotency-Key')
  if (chaveRecebida && !/^[a-f0-9]{32}$/i.test(chaveRecebida)) {
    return res.status(400).json({ erro: 'A chave de envio do pedido está inválida.' })
  }
  const chaveIdempotencia = chaveRecebida?.toLowerCase() || null
  if (chaveIdempotencia) {
    const pedidoExistente = db.prepare(`
      SELECT id, codigo_rastreio
      FROM pedidos
      WHERE chave_idempotencia = ?
    `).get(chaveIdempotencia)
    if (pedidoExistente) return responderPedidoExistente(res, pedidoExistente)
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ erro: 'Os dados do pedido estão inválidos.' })
  }

  const limitesTexto = {
    nome: 100,
    loja: 100,
    codigo: 100,
    codigo_vivendas: 100,
    telefone: 40,
    tipo_entrega: 20,
    endereco: 300,
    origem: 30,
    carne: 500,
    guarnicao: 500,
    refrigerante_sabor: 600,
    refrigerante_tamanho: 300,
    agua_tipo: 600,
    forma_pagamento: 20,
    observacao: 1000
  }

  for (const [campo, limite] of Object.entries(limitesTexto)) {
    const valor = req.body[campo]
    if (valor === undefined || valor === null) continue
    if (typeof valor !== 'string' || valor.trim().length > limite) {
      return res.status(400).json({ erro: `O campo ${campo} está inválido ou excede o limite permitido.` })
    }
    req.body[campo] = valor.trim()
  }

  const origensValidas = ['cliente_comum', 'vivendas']
  if (req.body.origem && !origensValidas.includes(req.body.origem)) {
    return res.status(400).json({ erro: 'A origem do pedido é inválida.' })
  }

  const tiposEntregaValidos = ['entrega', 'retirada', 'loja']
  if (req.body.tipo_entrega && !tiposEntregaValidos.includes(req.body.tipo_entrega)) {
    return res.status(400).json({ erro: 'O tipo de entrega é inválido.' })
  }

  const precosRecebidos = ['preco', 'preco_marmita', 'preco_bebida', 'valor_cobrar']
  for (const campo of precosRecebidos) {
    const valor = req.body[campo]
    if (valor === undefined || valor === null) continue
    if ((typeof valor !== 'number' && typeof valor !== 'string') || String(valor).trim() === '') {
      return res.status(400).json({ erro: `O campo ${campo} deve conter um valor válido.` })
    }
    const numero = Number(valor)
    const minimo = campo === 'preco' ? 0.01 : 0
    if (!Number.isFinite(numero) || numero < minimo || numero > 1000) {
      return res.status(400).json({ erro: `O campo ${campo} deve estar entre R$ ${minimo.toFixed(2)} e R$ 1.000,00.` })
    }
  }

  if (req.body.bebida_quantidade !== undefined && req.body.bebida_quantidade !== null) {
    const quantidadeBebidas = Number(req.body.bebida_quantidade)
    if (!Number.isInteger(quantidadeBebidas) || quantidadeBebidas < 0 || quantidadeBebidas > 100) {
      return res.status(400).json({ erro: 'A quantidade de bebidas é inválida.' })
    }
  }

  let quantidadeMarmitas = Array.isArray(req.body.marmitas)
    ? req.body.marmitas.length
    : req.body.quantidade_marmitas === undefined
      ? 1
      : Number(req.body.quantidade_marmitas)
  if (req.body.marmitas !== undefined && !Array.isArray(req.body.marmitas)) {
    return res.status(400).json({ erro: 'A lista de marmitas está inválida.' })
  }
  if (!Number.isInteger(quantidadeMarmitas) || quantidadeMarmitas < 1 || quantidadeMarmitas > 20) {
    return res.status(400).json({ erro: 'A quantidade de marmitas deve ser entre 1 e 20.' })
  }

  const {
    nome,
    loja,
    codigo,
    telefone,
    tipo_entrega,
    endereco,
    origem,
    carne,
    guarnicao,
    refrigerante_sabor,
    refrigerante_tamanho,
    agua_tipo,
    bebida_quantidade,
    preco_marmita,
    preco_bebida,
    forma_pagamento,
    troco_para,
    observacao,
    preco
  } = req.body

  const ehClienteComum = origem === 'cliente_comum'
  let marmitasDetalhadas = []
  if (ehClienteComum) {
    const itensRecebidos = Array.isArray(req.body.marmitas) ? req.body.marmitas : null
    if (itensRecebidos) {
      for (const item of itensRecebidos) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return res.status(400).json({ erro: 'Uma das marmitas do pedido está inválida.' })
        }
        for (const campo of ['carne', 'guarnicao', 'refrigerante_sabor', 'refrigerante_tamanho', 'agua_tipo', 'observacao']) {
          if (item[campo] !== undefined && (typeof item[campo] !== 'string' || item[campo].length > 500)) {
            return res.status(400).json({ erro: `Os detalhes da marmita (${campo}) são inválidos.` })
          }
        }
      }
      marmitasDetalhadas = itensRecebidos.map((item) => ({
        carne: String(item.carne || '').trim(),
        guarnicao: String(item.guarnicao || '').trim(),
        observacao: String(item.observacao || '').trim(),
        refrigerante_sabor: String(item.refrigerante_sabor || '').trim(),
        refrigerante_tamanho: String(item.refrigerante_tamanho || '').trim(),
        agua_tipo: String(item.agua_tipo || '').trim(),
        bebida_quantidade: Number(item.bebida_quantidade) || 0,
        preco_marmita: Number(item.preco_marmita) || 0,
        preco_bebida: Number(item.preco_bebida) || 0
      }))
    } else {
      const quantidadeAntiga = Number(req.body.quantidade_marmitas) || 1
      marmitasDetalhadas = Array.from({ length: quantidadeAntiga }, (_, indice) => ({
        carne: indice === 0 ? String(carne || '') : String(carne || ''),
        guarnicao: indice === 0 ? String(guarnicao || '') : String(guarnicao || ''),
        refrigerante_sabor: indice === 0 ? String(refrigerante_sabor || '') : '',
        refrigerante_tamanho: indice === 0 ? String(refrigerante_tamanho || '') : '',
        agua_tipo: indice === 0 ? String(agua_tipo || '') : '',
        bebida_quantidade: indice === 0 ? Number(bebida_quantidade) || 0 : 0,
        preco_marmita: Number(preco_marmita) / quantidadeAntiga || 0,
        preco_bebida: indice === 0 ? Number(preco_bebida) || 0 : 0
      }))
    }
    quantidadeMarmitas = marmitasDetalhadas.length
  }
  const identificadorVivendas = String(req.body.codigo_vivendas || codigo || '').trim()
  const digitosIdentificador = identificadorVivendas.replace(/\D/g, '')
  const cpfVivendas = !ehClienteComum && digitosIdentificador.length === 11 ? digitosIdentificador : ''

  if (!ehClienteComum && quantidadeMarmitas !== 1) {
    return res.status(400).json({ erro: 'No convênio Vivendas, é permitido pedir apenas uma marmita por CPF.' })
  }

  if (!ehClienteComum && cpfVivendas) {
    const cpfJaUsado = db.prepare(`
      SELECT 1 FROM pedidos WHERE origem = 'vivendas' AND cpf_vivendas = ? LIMIT 1
    `).get(cpfVivendas)
    if (cpfJaUsado) return res.status(409).json({ erro: 'Este CPF já foi utilizado em um pedido Vivendas.' })
  } else if (!ehClienteComum && identificadorVivendas) {
    const codigoJaUsado = db.prepare(`
      SELECT 1 FROM pedidos
      WHERE origem = 'vivendas' AND COALESCE(cpf_vivendas, '') = ''
        AND codigo_vivendas = ? COLLATE NOCASE
      LIMIT 1
    `).get(identificadorVivendas)
    if (codigoJaUsado) return res.status(409).json({ erro: 'Este código já foi utilizado em um pedido Vivendas.' })
  }

  // Regra de pagamento:
  // - Vivendas: marmita é coberta pelo convênio; paga só a bebida (se houver).
  // - Cliente comum: paga marmita + bebidas + taxa de entrega.
  let valorMarmita = Number(preco_marmita)
  let valorBebida = Number(preco_bebida)

  if (Number.isNaN(valorMarmita)) {
    valorMarmita = Number(preco) || 18.0
  }
  if (Number.isNaN(valorBebida)) {
    valorBebida = 0.0
  }

  // Respeita o valor_cobrar enviado pelo frontend (que já inclui marmita + bebidas + taxa de entrega)
  let valorCobrar = Number(req.body.valor_cobrar)
  if (Number.isNaN(valorCobrar)) {
    const taxa = (tipo_entrega === 'entrega' && ehClienteComum) ? 4.0 : 0.0
    valorCobrar = ehClienteComum
      ? valorMarmita + valorBebida + taxa
      : valorBebida
  }

  const precosBebidas = precosBebidasValidos(Array.isArray(req.body.marmitas) ? req.body.marmitas : [])
  if (precosBebidas.erro) return res.status(400).json({ erro: precosBebidas.erro })
  valorBebida = precosBebidas.total
  const cardapioHoje = db.prepare('SELECT preco FROM cardapios WHERE data = ? AND ativo = 1').get(dataLocalSaoPaulo())
  valorMarmita = Number(cardapioHoje?.preco ?? 10) * (ehClienteComum ? marmitasDetalhadas.length : 1)
  if (ehClienteComum) {
    marmitasDetalhadas = marmitasDetalhadas.map((item, indice) => ({
      ...item,
      preco_marmita: Number(cardapioHoje?.preco ?? 10),
      preco_bebida: precosBebidasValidos([Array.isArray(req.body.marmitas) ? req.body.marmitas[indice] : {}]).total
    }))
  }
  const taxaEntrega = ehClienteComum && tipo_entrega === 'entrega'
    ? ({ 'Santa Maria Sul': 3, 'Santa Maria Norte': 5, 'Novo Gama': 7, Gama: 10, 'Demais Regiões': 15 }[String(req.body.regiao_entrega || '').trim()] ?? null)
    : 0
  if (taxaEntrega === null) return res.status(400).json({ erro: 'A região de entrega é inválida.' })
  valorCobrar = ehClienteComum ? valorMarmita + valorBebida + taxaEntrega : valorBebida
  const precoFinal = valorMarmita + valorBebida

  if (ehClienteComum) {
    if (!nome || !telefone || preco === undefined || preco === null) {
      return res.status(400).json({
        erro: 'Nome, telefone e preço são obrigatórios.'
      })
    }

    if (tipo_entrega === 'entrega' && !endereco) {
      return res.status(400).json({
        erro: 'Endereço é obrigatório para entrega.'
      })
    }
  } else {
    if (!nome || !loja || !codigo || preco === undefined || preco === null) {
      return res.status(400).json({
        erro: 'Nome, loja, código e preço são obrigatórios.'
      })
    }
  }

  // Pagamento é sempre na entrega/retirada. Só exige a forma se houver algo a cobrar.
  const FORMAS_VALIDAS = ['pix', 'debito', 'credito', 'dinheiro']
  const formaValida = FORMAS_VALIDAS.includes(forma_pagamento)

  if (valorCobrar > 0 && !formaValida) {
    return res.status(400).json({
      erro: 'Escolha a forma de pagamento.'
    })
  }

  // Troco (opcional, só para dinheiro): valor com que o cliente vai pagar
  let trocoPara = null

  if (
    forma_pagamento === 'dinheiro' &&
    troco_para !== null &&
    troco_para !== undefined &&
    String(troco_para).trim() !== ''
  ) {
    trocoPara = Number(String(troco_para).replace(',', '.'))

    if (!Number.isFinite(trocoPara) || trocoPara < valorCobrar) {
      return res.status(400).json({
        erro: 'O valor do troco deve ser maior ou igual ao valor a pagar.'
      })
    }
  }

  try {
    const codigoRastreio = crypto.randomBytes(24).toString('hex')
    const criarPedido = db.prepare(`
      INSERT INTO pedidos (
        nome,
        loja,
        codigo_vivendas,
        telefone,
        tipo_entrega,
        endereco,
        origem,
        carne,
        guarnicao,
        refrigerante_sabor,
        refrigerante_tamanho,
        agua_tipo,
        bebida_quantidade,
        preco_marmita,
        preco_bebida,
        valor_cobrar,
        forma_pagamento,
        troco_para,
        observacao,
        preco,
        quantidade_marmitas,
        marmitas_json,
        cpf_vivendas,
        status,
        codigo_rastreio,
        chave_idempotencia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const resultado = criarPedido.run(
      nome,
      ehClienteComum ? '' : loja,
      ehClienteComum ? '' : identificadorVivendas,
      ehClienteComum ? telefone : '',
      ehClienteComum ? (tipo_entrega || 'retirada') : '',
      ehClienteComum && tipo_entrega === 'entrega' ? endereco : '',
      ehClienteComum ? 'cliente_comum' : 'vivendas',
      carne,
      guarnicao,
      refrigerante_sabor || '',
      refrigerante_tamanho || '',
      agua_tipo || '',
      Number(bebida_quantidade) || 0,
      valorMarmita,
      valorBebida,
      valorCobrar,
      formaValida ? forma_pagamento : '',
      trocoPara,
      observacao || '',
      precoFinal,
      quantidadeMarmitas,
      ehClienteComum ? JSON.stringify(marmitasDetalhadas) : '[]',
      cpfVivendas,
      'aguardando',
      codigoRastreio,
      chaveIdempotencia
    )

    res.status(201).json({
      mensagem: 'Pedido enviado para aprovação!',
      id: resultado.lastInsertRowid,
      codigo_rastreio: codigoRastreio
    })

  } catch (erro) {
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE' && chaveIdempotencia) {
      const pedidoExistente = db.prepare(`
        SELECT id, codigo_rastreio
        FROM pedidos
        WHERE chave_idempotencia = ?
      `).get(chaveIdempotencia)
      if (pedidoExistente) return responderPedidoExistente(res, pedidoExistente)
    }
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao salvar pedido.'
    })
  }
})

app.get('/pedidos', exigirAdmin, (req, res) => {
  try {
    const limiteSolicitado = Number.parseInt(req.query.limit, 10)
    const beforeId = Number.parseInt(req.query.beforeId, 10)
    const limit = Number.isInteger(limiteSolicitado) ? Math.min(Math.max(limiteSolicitado, 1), 100) : 100
    const consulta = Number.isInteger(beforeId) && beforeId > 0
      ? db.prepare('SELECT * FROM pedidos WHERE id < ? ORDER BY id DESC LIMIT ?').all(beforeId, limit)
      : db.prepare('SELECT * FROM pedidos ORDER BY id DESC LIMIT ?').all(limit)
    const pedidos = consulta
    const ultimoId = pedidos[pedidos.length - 1]?.id
    const temMais = ultimoId ? Boolean(db.prepare('SELECT 1 FROM pedidos WHERE id < ? LIMIT 1').get(ultimoId)) : false
    res.setHeader('X-Has-More', String(temMais))
    if (temMais) res.setHeader('X-Next-Cursor', String(ultimoId))

    res.json(pedidos)

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao buscar pedidos.'
    })
  }
})

app.get('/pedidos/rastreio/:codigo', (req, res) => {
  try {
    const pedido = db.prepare(`
      SELECT id, status, criado_em
      FROM pedidos
      WHERE codigo_rastreio = ?
    `).get(req.params.codigo)

    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' })
    return res.json(pedido)
  } catch (erro) {
    console.error(erro)
    return res.status(500).json({ erro: 'Erro ao buscar pedido.' })
  }
})

// Mantém a consulta por ID apenas para pedidos antigos sem código secreto.
app.get('/pedidos/:id', (req, res) => {
  try {
    const pedido = db.prepare(`
      SELECT id, status, criado_em
      FROM pedidos
      WHERE id = ? AND codigo_rastreio IS NULL
    `).get(req.params.id)

    if (!pedido) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      })
    }

    res.json(pedido)

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao buscar pedido.'
    })
  }
})

app.put('/pedidos/:id/aprovar', exigirAdmin, (req, res) => {
  try {
    const resultado = db.prepare(`
      UPDATE pedidos
      SET status = 'em_preparo'
      WHERE id = ? AND status = 'aguardando'
    `).run(req.params.id)

    if (resultado.changes === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      })
    }

    res.json({
      mensagem: 'Pedido aprovado e enviado para preparo!'
    })

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao aprovar pedido.'
    })
  }
})

app.put('/pedidos/:id/recusar', exigirAdmin, (req, res) => {
  try {
    const resultado = db.prepare(`
      UPDATE pedidos
      SET status = 'recusado'
      WHERE id = ?
    `).run(req.params.id)

    if (resultado.changes === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      })
    }

    res.json({
      mensagem: 'Pedido recusado com sucesso!'
    })

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao recusar pedido.'
    })
  }
})

app.put('/pedidos/:id/preparo', exigirAdmin, (req, res) => {
  try {
    const resultado = db.prepare(`
      UPDATE pedidos
      SET status = 'em_preparo'
      WHERE id = ? AND status = 'aprovado'
    `).run(req.params.id)

    if (resultado.changes === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado ou não está aprovado.'
      })
    }

    res.json({
      mensagem: 'Pedido marcado como em preparo!'
    })

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao atualizar pedido.'
    })
  }
})

app.put('/pedidos/:id/pronto', exigirAdmin, (req, res) => {
  try {
    const resultado = db.prepare(`
      UPDATE pedidos
      SET status = 'pronto'
      WHERE id = ? AND status = 'em_preparo'
    `).run(req.params.id)

    if (resultado.changes === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado ou não está em preparo.'
      })
    }

    res.json({
      mensagem: 'Pedido marcado como pronto!'
    })

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao atualizar pedido.'
    })
  }
})

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro)
  if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'A solicita??o excede o tamanho permitido.' })
  if (String(erro.message || '').includes('CORS')) return res.status(403).json({ erro: 'Origem n\u00e3o autorizada.' })
  console.error('Erro n\u00e3o tratado na API:', erro)
  return res.status(500).json({ erro: 'Erro interno do servidor.' })
})

process.on('uncaughtException', (erro) => {
  console.error('Erro n\u00e3o capturado; encerrando para rein\u00edcio seguro:', erro)
  process.exit(1)
})

process.on('unhandledRejection', (razao) => {
  console.error('Rejei\u00e7\u00e3o n\u00e3o tratada; encerrando para rein\u00edcio seguro:', razao)
  process.exit(1)
})

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${server.address().port}`)
})

let encerrando = false
function encerrarServidor(sinal) {
  if (encerrando) return
  encerrando = true
  console.log(`Recebido ${sinal}; encerrando servidor com seguranca.`)

  const limiteEncerramento = setTimeout(() => {
    console.error('Tempo limite de encerramento excedido.')
    process.exit(1)
  }, 10000)
  limiteEncerramento.unref()

  server.close((erro) => {
    if (erro) {
      console.error('Erro ao encerrar servidor:', erro)
      process.exit(1)
    }
    db.close()
    console.log('Servidor e banco de dados encerrados.')
    process.exit(0)
  })
}

process.on('SIGTERM', () => encerrarServidor('SIGTERM'))
process.on('SIGINT', () => encerrarServidor('SIGINT'))

server.on('close', () => {
  console.log('Servidor foi fechado!')
})
