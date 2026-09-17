import { useState } from 'react'
import './AdminCardapio.css'

const GUARNICOES_FIXAS = [
  'Arroz',
  'Feijão',
  'Feijão Tropeiro',
  'Macarrão',
  'Legumes',
  'Farofa',
  'Salada (Alface e tomate)',
  'Vinagrete',
  'Maionese'
]

function AdminCardapio({ voltar, pedidos }) {
  const [data, setData] = useState('')
  const [preco, setPreco] = useState('')

  const [opcoes, setOpcoes] = useState({
    carne: [],
    guarnicao: []
  })

  const [novaOpcao, setNovaOpcao] = useState({
    carne: '',
    guarnicao: ''
  })

  const [modoEdicao, setModoEdicao] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function verificarCardapio(dataEscolhida) {
    if (!dataEscolhida) return

    try {
      const resposta = await fetch(
        `http://localhost:3000/cardapios/${dataEscolhida}`
      )

      if (resposta.status === 404) {
        setModoEdicao(false)
        setMensagem('Nenhum cardápio cadastrado para esta data.')
        setOpcoes({ carne: [], guarnicao: [] })
        return
      }

      if (!resposta.ok) {
        throw new Error('Erro ao consultar cardápio')
      }

      const dados = await resposta.json()
      setModoEdicao(true)
      setMensagem('Cardápio encontrado. Você está editando.')
      setPreco(dados.preco)

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
      setMensagem('Não foi possível consultar o cardápio.')
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
        ? `http://localhost:3000/cardapios/${data}`
        : 'http://localhost:3000/cardapios'

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
          ? 'Cardápio atualizado com sucesso!'
          : 'Cardápio criado com sucesso!'
      )

      setModoEdicao(true)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  function adicionarOpcao(categoria) {
    const nome = novaOpcao[categoria].trim()

    if (!nome) return

    if (opcoes[categoria].includes(nome)) {
      setNovaOpcao({
        ...novaOpcao,
        [categoria]: ''
      })
      return
    }

    setOpcoes({
      ...opcoes,
      [categoria]: [...opcoes[categoria], nome]
    })

    setNovaOpcao({
      ...novaOpcao,
      [categoria]: ''
    })
  }

  function removerOpcao(categoria, index) {
    setOpcoes({
      ...opcoes,
      [categoria]: opcoes[categoria].filter(
        (_, i) => i !== index
      )
    })
  }

  function alternarCarne() {}

  function alternarGuarnicao(nome) {
    setOpcoes((atual) => {
      const jaSelecionada = atual.guarnicao.includes(nome)
      return {
        ...atual,
        guarnicao: jaSelecionada
          ? atual.guarnicao.filter((item) => item !== nome)
          : [...atual.guarnicao, nome]
      }
    })
  }

  return (
    <div className="admin-page">
 <button
      className="admin-voltar"
      onClick={voltar}
    >
      ← Voltar
    </button>
      <header className="admin-header">
        <div>
          <span>EL SHADDAY</span>
          <h1>PAINEL DO RESTAURANTE</h1>
        </div>
      </header>
      
<div className="admin-menu">

  <button
    className="admin-menu-btn"
    onClick={() => {
      document.querySelector('.admin-card').scrollIntoView({
        behavior: 'smooth'
      })
    }}
  >
    🍽️ GERENCIAR CARDÁPIO
  </button>

  <button
    className="admin-menu-btn"
    onClick={pedidos}
  >
    📋 PEDIDOS RECEBIDOS
  </button>

</div>
      <main className="admin-content">

        <section className="admin-card">

          <h2>📋 Criar cardápio</h2>

          <p className="admin-subtitulo">
            Prepare o cardápio que estará disponível para os clientes.
          </p>

          <div className="campo">
            <label>Data do cardápio</label>

            <input
              type="date"
              value={data}
              onChange={(e) => {
                const novaData = e.target.value
                setData(novaData)
                verificarCardapio(novaData)
              }}
            />

            {mensagem && (
              <p className="mensagem-admin">
                {mensagem}
              </p>
            )}
          </div>

          <div className="campo">
            <label>Preço da marmita</label>

            <input
              type="number"
              step="0.01"
              placeholder="18.00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>

          <div className="categorias-admin">

            {/* CARNE */}
            <div className="categoria-admin">
              <h3>🍗 CARNE</h3>
              <p className="categoria-info">O cliente poderá escolher até 2 tipos.</p>
              <div className="adicionar-opcao">
                <input
                  type="text"
                  placeholder="Adicionar carne"
                  value={novaOpcao.carne}
                  onChange={(e) =>
                    setNovaOpcao({
                      ...novaOpcao,
                      carne: e.target.value
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => adicionarOpcao('carne')}
                >
                  +
                </button>
              </div>
              <div className="lista-opcoes">
                {opcoes.carne.map((opcao, index) => (
                  <div className="opcao-admin" key={index}>
                    <span>✓ {opcao}</span>
                    <button
                      type="button"
                      onClick={() => removerOpcao('carne', index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* GUARNIÇÕES */}
            <div className="categoria-admin">
              <h3>🥗 GUARNIÇÕES</h3>
              <p className="categoria-info">
                Toque para ligar/desligar as opções do dia. Dá pra adicionar outras que não estão na lista.
              </p>

              <div className="guarnicao-fixa-lista">
                {GUARNICOES_FIXAS.map((nome) => {
                  const selecionada = opcoes.guarnicao.includes(nome)
                  return (
                    <button
                      type="button"
                      key={nome}
                      className={
                        selecionada
                          ? 'guarnicao-chip guarnicao-chip-ativa'
                          : 'guarnicao-chip'
                      }
                      onClick={() => alternarGuarnicao(nome)}
                    >
                      {selecionada ? '✓ ' : '+ '}
                      {nome}
                    </button>
                  )
                })}
              </div>

              <div className="adicionar-opcao adicionar-opcao-guarnicao">
                <input
                  type="text"
                  placeholder="Adicionar outra guarnição"
                  value={novaOpcao.guarnicao}
                  onChange={(e) =>
                    setNovaOpcao({
                      ...novaOpcao,
                      guarnicao: e.target.value
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => adicionarOpcao('guarnicao')}
                >
                  +
                </button>
              </div>

              <div className="lista-opcoes">
                {opcoes.guarnicao.map((opcao, index) => (
                  <div className="opcao-admin" key={index}>
                    <span>✓ {opcao}</span>
                    <button
                      type="button"
                      onClick={() => removerOpcao('guarnicao', index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <button
  className="salvar-cardapio-btn"
  onClick={salvarCardapio}
>
  SALVAR CARDÁPIO
</button>

        </section>

      </main>

    </div>
  )
}

export default AdminCardapio