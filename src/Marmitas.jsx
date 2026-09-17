import { useEffect, useState } from 'react'
import './Marmitas.css'

// Fotos ilustrativas de cada categoria (Unsplash, uso livre)
const FOTOS = {
  carne: 'https://images.unsplash.com/photo-1762631934518-f75e233413ca?auto=format&fit=crop&w=300&q=70',
  guarnicao: 'https://images.unsplash.com/photo-1594470603337-2e8778fda2be?auto=format&fit=crop&w=300&q=70'
}

const MAX_CARNES = 2

function Marmitas({ voltar, continuar }) {
  const [carne, setCarne] = useState([])
  const [guarnicao, setGuarnicao] = useState([])

  const [cardapio, setCardapio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const itensEscolhidos = carne.length + guarnicao.length

  useEffect(() => {
    async function carregarCardapio() {
      try {
        setCarregando(true)
        setErro('')

        const hoje = new Date()

        const ano = hoje.getFullYear()
        const mes = String(hoje.getMonth() + 1).padStart(2, '0')
        const dia = String(hoje.getDate()).padStart(2, '0')

        const dataHoje = `${ano}-${mes}-${dia}`

        const resposta = await fetch(
          `http://localhost:3000/cardapios/${dataHoje}`
        )

        if (!resposta.ok) {
          throw new Error('Nenhum cardápio disponível para hoje.')
        }

        const dados = await resposta.json()

        setCardapio(dados)

      } catch (erro) {
        console.error(erro)
        setErro(erro.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarCardapio()
  }, [])

  if (carregando) {
    return (
      <div className="marmitas-page">
        <h2>Carregando cardápio...</h2>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="marmitas-page">
        <h2>Cardápio indisponível</h2>
        <p>{erro}</p>

        <button onClick={voltar}>
          ← Voltar
        </button>
      </div>
    )
  }

  function opcoesPorCategoria(categoria) {
    if (!cardapio) return []

    return cardapio.opcoes.filter(
      (opcao) => opcao.categoria === categoria
    )
  }

  function limparEscolhas() {
    setCarne([])
    setGuarnicao([])
  }

  function alternarCarne(nome) {
    setCarne((atual) => {
      const jaSelecionada = atual.includes(nome)

      if (jaSelecionada) {
        return atual.filter((item) => item !== nome)
      }

      if (atual.length >= MAX_CARNES) {
        return atual
      }

      return [...atual, nome]
    })
  }

  function alternarGuarnicao(nome) {
    setGuarnicao((atual) =>
      atual.includes(nome)
        ? atual.filter((item) => item !== nome)
        : [...atual, nome]
    )
  }

  return (
    <div className="marmitas-page">

      {/* CABEÇALHO */}
      <header className="marmitas-header">

        <button
          className="voltar-btn"
          onClick={voltar}
        >
          ←
        </button>

        <div className="marmitas-logo">
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

        <button className="carrinho-btn">
          🛒
          {itensEscolhidos > 0 && (
            <span className="carrinho-badge">{itensEscolhidos}</span>
          )}
        </button>

      </header>


      {/* TÍTULO */}
      <section className="titulo-marmita">

        <h2>MONTE SUA MARMITA</h2>

        <p>
          Escolha as opções de hoje
        </p>

      </section>


      {/* CARNE */}
      <section className="escolha">

        <div className="escolha-icon">
          🍗
        </div>

        <div className="escolha-conteudo">

          <h3>1. ESCOLHA A CARNE ({carne.length}/{MAX_CARNES})</h3>

          {opcoesPorCategoria('carne').map((opcao) => {
            const selecionada = carne.includes(opcao.nome)
            const desabilitada = !selecionada && carne.length >= MAX_CARNES

            return (
              <label
                key={opcao.id}
                className={desabilitada ? 'opcao-desabilitada' : ''}
              >
                <input
                  type="checkbox"
                  checked={selecionada}
                  disabled={desabilitada}
                  onChange={() => alternarCarne(opcao.nome)}
                />

                {opcao.nome}
              </label>
            )
          })}

        </div>

        <img className="escolha-foto" src={FOTOS.carne} alt="Carne" />

      </section>


      {/* GUARNIÇÃO */}
      <section className="escolha">

        <div className="escolha-icon">
          🥗
        </div>

        <div className="escolha-conteudo">

          <h3>2. ESCOLHA AS GUARNIÇÕES</h3>

          {opcoesPorCategoria('guarnicao').map((opcao) => (
            <label key={opcao.id}>
              <input
                type="checkbox"
                checked={guarnicao.includes(opcao.nome)}
                onChange={() => alternarGuarnicao(opcao.nome)}
              />

              {opcao.nome}
            </label>
          ))}

        </div>

        <img className="escolha-foto" src={FOTOS.guarnicao} alt="Guarnição" />

      </section>


      {/* RESUMO */}
      <section className="resumo">

        <h3>RESUMO DO SEU PEDIDO</h3>

        <div className="resumo-itens">

          <span>
            🍗 {carne.length > 0 ? carne.join(', ') : 'Carne não escolhida'}
          </span>

          <span>
            🥗 {guarnicao.length > 0 ? guarnicao.join(', ') : 'Guarnição não escolhida'}
          </span>

        </div>


        <button
          className="continuar-btn"
          onClick={() =>
            continuar({
              carne: carne.join(', '),
              guarnicao: guarnicao.join(', '),
              preco: cardapio.preco
            })
          }
        >
          CONTINUAR →
        </button>

        <button
          className="limpar-btn"
          onClick={limparEscolhas}
        >
          ↻ LIMPAR ESCOLHAS
        </button>

      </section>

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="nav-inferior">

        <button onClick={voltar} className="nav-item">
          <span>🏠</span>
          Início
        </button>

        <button className="nav-item nav-item-ativo">
          <span>🍱</span>
          Marmitas
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: pedidos para consumir no local.')}
        >
          <span>🏪</span>
          No Local
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: acompanhamento de pedidos por aqui.')}
        >
          <span>📋</span>
          Pedidos
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: seu perfil.')}
        >
          <span>👤</span>
          Perfil
        </button>

      </nav>

    </div>
  )
}

export default Marmitas