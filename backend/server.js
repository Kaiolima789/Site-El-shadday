const express = require('express')
const cors = require('cors')
const db = require('./database')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

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
  ['troco_para', 'REAL']
]

for (const [nomeColuna, definicao] of novasColunas) {
  if (!colunasPedidos.includes(nomeColuna)) {
    db.prepare(`ALTER TABLE pedidos ADD COLUMN ${nomeColuna} ${definicao}`).run()
    console.log(`Coluna "${nomeColuna}" adicionada na tabela pedidos.`)
  }
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API El Shadday funcionando!'
  })
})

app.post('/cardapios', (req, res) => {
  const { data, preco, opcoes } = req.body

  if (!data || !preco || !Array.isArray(opcoes)) {
    return res.status(400).json({
      erro: 'Data, preço e opções são obrigatórios.'
    })
  }

  try {
    const criarCardapio = db.prepare(`
      INSERT INTO cardapios (data, preco)
      VALUES (?, ?)
    `)

    const resultado = criarCardapio.run(data, preco)

    const cardapioId = resultado.lastInsertRowid

    const adicionarOpcao = db.prepare(`
      INSERT INTO opcoes_cardapio
      (cardapio_id, categoria, nome)
      VALUES (?, ?, ?)
    `)

    for (const opcao of opcoes) {
      adicionarOpcao.run(
        cardapioId,
        opcao.categoria,
        opcao.nome
      )
    }

    res.status(201).json({
      mensagem: 'Cardápio criado com sucesso!',
      id: cardapioId
    })

  } catch (erro) {

    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        erro: 'Já existe um cardápio para essa data.'
      })
    }

    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao criar cardápio.'
    })
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

app.put('/cardapios/:data', (req, res) => {
  const { data } = req.params
  const { preco, opcoes } = req.body

  if (!preco || !Array.isArray(opcoes)) {
    return res.status(400).json({
      erro: 'Preço e opções são obrigatórios.'
    })
  }

  try {
    const cardapio = db.prepare(`
      SELECT id
      FROM cardapios
      WHERE data = ?
    `).get(data)

    if (!cardapio) {
      return res.status(404).json({
        erro: 'Cardápio não encontrado para essa data.'
      })
    }

    const atualizarPreco = db.prepare(`
      UPDATE cardapios
      SET preco = ?
      WHERE id = ?
    `)

    atualizarPreco.run(preco, cardapio.id)

    db.prepare(`
      DELETE FROM opcoes_cardapio
      WHERE cardapio_id = ?
    `).run(cardapio.id)

    const adicionarOpcao = db.prepare(`
      INSERT INTO opcoes_cardapio
      (cardapio_id, categoria, nome)
      VALUES (?, ?, ?)
    `)

    for (const opcao of opcoes) {
      adicionarOpcao.run(
        cardapio.id,
        opcao.categoria,
        opcao.nome
      )
    }

    res.json({
      mensagem: 'Cardápio atualizado com sucesso!'
    })

  } catch (erro) {
    console.error(erro)
    res.status(500).json({
      erro: 'Erro ao atualizar cardápio.'
    })
  }
})

app.post('/pedidos', (req, res) => {
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

  const precoFinal = Number(preco) || valorCobrar || (valorMarmita + valorBebida)

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

    if (Number.isNaN(trocoPara) || trocoPara < valorCobrar) {
      return res.status(400).json({
        erro: 'O valor do troco deve ser maior ou igual ao valor a pagar.'
      })
    }
  }

  try {
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
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const resultado = criarPedido.run(
      nome,
      ehClienteComum ? '' : loja,
      ehClienteComum ? '' : codigo,
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
      'aguardando'
    )

    res.status(201).json({
      mensagem: 'Pedido enviado para aprovação!',
      id: resultado.lastInsertRowid
    })

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao salvar pedido.'
    })
  }
})

app.get('/pedidos', (req, res) => {
  try {
    const pedidos = db.prepare(`
      SELECT *
      FROM pedidos
      ORDER BY criado_em DESC
    `).all()

    res.json(pedidos)

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao buscar pedidos.'
    })
  }
})

app.get('/pedidos/:id', (req, res) => {
  try {
    const pedido = db.prepare(`
      SELECT *
      FROM pedidos
      WHERE id = ?
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

app.put('/pedidos/:id/aprovar', (req, res) => {
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

app.put('/pedidos/:id/recusar', (req, res) => {
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

app.put('/pedidos/:id/preparo', (req, res) => {
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

app.put('/pedidos/:id/pronto', (req, res) => {
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

process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada em:', promise, 'razão:', reason)
})

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})

server.on('close', () => {
  console.log('Servidor foi fechado!')
})
