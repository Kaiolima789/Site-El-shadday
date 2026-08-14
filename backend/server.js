const express = require('express')
const cors = require('cors')
const db = require('./database')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API El Shadday funcionando!'
  })
})

app.post('/cardapios', (req, res) => {
  const { data, preco, opcoes } = req.body

  if (!data || !preco || !opcoes) {
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})