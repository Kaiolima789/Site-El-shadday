import { useState, useEffect } from 'react'
import './AdminCardapio.css'

const API_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://site-el-shadday.onrender.com'

const PROTEINAS_SUGERIDAS = [
  'Churrasco',
  'Frango Grelhado',
  'Linguiça Artesanal',
  'Frango Cozido'
]

const GUARNICOES_FIXAS = [
  'Arroz',
  'Feijão',
  'Feijão Tropeiro',
  'Macarrão',
  'Leguminosas',
  'Farofa',
  'Salada (Alface e tomate)',
  'Vinagrete',
  'Maionese'
]

function dataHojeFormatada() {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

function dataHojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function AdminCardapio({ voltar, pedidos }) {
  const [data, setData] = useState(dataHojeISO())
  const [preco, setPreco] = useState('18.00')

  const [opcoes, setOpcoes] = useState({
    carne: ['Churrasco', 'Frango Grelhado'],
    guarnicao: ['Arroz', 'Feijão', 'Farofa', 'Salada (Alface e tomate)']
  })

  const [novoItem, setNovoItem] = useState({
    carne: '',
    guarnicao: ''
  })

  const [modoEdicao, setModoEdicao] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    verificarCardapio(dataHojeISO())
  }, [])

  async function verificarCardapio(dataEscolhida) {
    if (!dataEscolhida) return

    try {
      const resposta = await fetch(
        `${API_URL}/cardapios/${dataEscolhida}`
      )

      if (resposta.status === 404) {
        setModoEdicao(false)
        setMensagem('Novo cardápio para esta data.')
        return
      }

      if (!resposta.ok) {
        throw new Error('Erro ao consultar cardápio')
      }

      const dados = await resposta.json()
      setModoEdicao(true)
      setMensagem('Cardápio encontrado. Você está editando.')
      setPreco(String(dados.preco || '18.00'))

      const novasOpcoes = {
        carne: [],
        guarnicao: []
      }

      dados.opcoes.forEach((opcao) => {
        if (novasOpcoes[opcao.categoria]) {
          novasOpcoes[opcao.categoria].push(opcao.nome)
        }
      })

      setOpcoes(novasOpcoes)
    } catch (erro) {
      console.error(erro)
      setMensagem('Modo offline / Não foi possível carregar do servidor.')
    }
  }

  async function salvarCardapio() {
    try {
      const opcoesFormatadas = Object.entries(opcoes).flatMap(
        ([categoria, itens]) =>
          itens.map((nome) => ({
            categoria,
            nome
          }))
      )

      const metodo = modoEdicao ? 'PUT' : 'POST'
      const url = modoEdicao
        ? `${API_URL}/cardapios/${data}`
        : `${API_URL}/cardapios`

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data,
          preco: Number(preco),
          opcoes: opcoesFormatadas
        })
      })

      const resultado = await resposta.json()

      if (!resposta.ok) {
        alert(resultado.erro || 'Erro ao salvar cardápio')
        return
      }

      alert(
        modoEdicao
          ? 'Cardápio atualizado e publicado com sucesso!'
          : 'Cardápio criado e publicado com sucesso!'
      )

      verificarCardapio(data)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível salvar o cardápio.')
    }
  }

  function adicionarItem(categoria) {
    const nome = novoItem[categoria].trim()
    if (!nome) return

    if (opcoes[categoria].includes(nome)) {
      alert('Esse item já está na lista!')
      return
    }

    setOpcoes((prev) => ({
      ...prev,
      [categoria]: [...prev[categoria], nome]
    }))

    setNovoItem((prev) => ({
      ...prev,
      [categoria]: ''
    }))
  }

  function removerItem(categoria, nome) {
    setOpcoes((prev) => ({
      ...prev,
      [categoria]: prev[categoria].filter((item) => item !== nome)
    }))
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-esquerda">
          <h1>EL SHADDAY • PAINEL ADMIN</h1>
        </div>

        <div className="admin-header-direita">
          <label className="admin-status-toggle">
            <span className="status-dot-verde">●</span>
            <span>Restaurante Aberto</span>
            <input type="checkbox" defaultChecked />
            <span className="toggle-switch"></span>
          </label>

          <button onClick={voltar} className="admin-sair-btn">
            Voltar
          </button>
        </div>
      </header>

      <div className="admin-abas-nav">
        <button className="admin-aba-btn admin-aba-ativa">
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn" onClick={pedidos}>
          Pedidos Recebidos
        </button>
      </div>

      <main className="admin-conteudo">
        <div className="admin-cardapio-bloco">
          <div className="admin-bloco-topo">
            <div>
              <h2>Cardápio do Dia</h2>
              <p>Cadastre as carnes e guarnições disponíveis para hoje.</p>
            </div>

            <div className="admin-data-campo">
              <label>Data:</label>
              <input
                type="date"
                value={data}
                onChange={(e) => {
                  setData(e.target.value)
                  verificarCardapio(e.target.value)
                }}
              />
            </div>
          </div>

          {mensagem && <div className="admin-mensagem-aviso">{mensagem}</div>}

          <div className="admin-preco-campo">
            <label>Preço da Marmita Tradicional (R$):</label>
            <input
              type="number"
              step="0.50"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>

          <div className="admin-secao-opcoes">
            <h3>1. Opções de Carnes / Proteínas</h3>
            <div className="admin-chips-grade">
              {opcoes.carne.map((item) => (
                <span className="admin-chip" key={item}>
                  {item}
                  <button
                    type="button"
                    onClick={() => removerItem('carne', item)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="admin-add-linha">
              <input
                type="text"
                placeholder="Nova opção de carne (ex: Peixe Frito)"
                value={novoItem.carne}
                onChange={(e) =>
                  setNovoItem((prev) => ({ ...prev, carne: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarItem('carne')}
              />
              <button
                type="button"
                className="admin-add-btn"
                onClick={() => adicionarItem('carne')}
              >
                + Adicionar
              </button>
            </div>
          </div>

          <div className="admin-secao-opcoes">
            <h3>2. Opções de Guarnições</h3>
            <div className="admin-chips-grade">
              {opcoes.guarnicao.map((item) => (
                <span className="admin-chip" key={item}>
                  {item}
                  <button
                    type="button"
                    onClick={() => removerItem('guarnicao', item)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="admin-add-linha">
              <input
                type="text"
                placeholder="Nova guarnição (ex: Mandioca Frita)"
                value={novoItem.guarnicao}
                onChange={(e) =>
                  setNovoItem((prev) => ({ ...prev, guarnicao: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarItem('guarnicao')}
              />
              <button
                type="button"
                className="admin-add-btn"
                onClick={() => adicionarItem('guarnicao')}
              >
                + Adicionar
              </button>
            </div>
          </div>

          <button
            type="button"
            className="admin-salvar-btn"
            onClick={salvarCardapio}
          >
            💾 Salvar Cardápio e Publicar
          </button>
        </div>
      </main>
    </div>
  )
}

export default AdminCardapio