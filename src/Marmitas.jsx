import { useEffect, useState } from 'react'
import './Marmitas.css'

function Marmitas({ voltar }) {
  const [arroz, setArroz] = useState('')
  const [feijao, setFeijao] = useState('')
  const [proteina, setProteina] = useState('')
  const [guarnicao, setGuarnicao] = useState('')

  const [cardapio, setCardapio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/cardapios/2026-08-15')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Cardápio não encontrado')
        }

        return res.json()
      })
      .then((dados) => {
        setCardapio(dados)
        setCarregando(false)
      })
      .catch((erro) => {
        console.error(erro)
        setErro('Não foi possível carregar o cardápio.')
        setCarregando(false)
      })
  }, [])

  function opcoesPorCategoria(categoria) {
    if (!cardapio) return []

    return cardapio.opcoes.filter(
      (opcao) => opcao.categoria === categoria
    )
  }

  function limparEscolhas() {
    setArroz('')
    setFeijao('')
    setProteina('')
    setGuarnicao('')
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
        </button>

      </header>


      {/* TÍTULO */}
      <section className="titulo-marmita">

        <h2>MONTE SUA MARMITA</h2>

        <p>
          Escolha as opções de hoje
        </p>

      </section>


      {/* ARROZ */}
      <section className="escolha">

        <div className="escolha-icon">
          🍚
        </div>

        <div className="escolha-conteudo">

          <h3>1. ESCOLHA O ARROZ</h3>

          {opcoesPorCategoria('arroz').map((opcao) => (
            <label key={opcao.id}>
              <input
                type="radio"
                name="arroz"
                value={opcao.nome}
                checked={arroz === opcao.nome}
                onChange={(e) => setArroz(e.target.value)}
              />

              {opcao.nome}
            </label>
          ))}

        </div>

      </section>


      {/* FEIJÃO */}
      <section className="escolha">

        <div className="escolha-icon">
          🫘
        </div>

        <div className="escolha-conteudo">

          <h3>2. ESCOLHA O FEIJÃO</h3>

          {opcoesPorCategoria('feijao').map((opcao) => (
            <label key={opcao.id}>
              <input
                type="radio"
                name="feijao"
                value={opcao.nome}
                checked={feijao === opcao.nome}
                onChange={(e) => setFeijao(e.target.value)}
              />

              {opcao.nome}
            </label>
          ))}

        </div>

      </section>


      {/* PROTEÍNA */}
      <section className="escolha">

        <div className="escolha-icon">
          🍗
        </div>

        <div className="escolha-conteudo">

          <h3>3. ESCOLHA A PROTEÍNA</h3>

          {opcoesPorCategoria('proteina').map((opcao) => (
            <label key={opcao.id}>
              <input
                type="radio"
                name="proteina"
                value={opcao.nome}
                checked={proteina === opcao.nome}
                onChange={(e) => setProteina(e.target.value)}
              />

              {opcao.nome}
            </label>
          ))}

        </div>

      </section>


      {/* GUARNIÇÃO */}
      <section className="escolha">

        <div className="escolha-icon">
          🥗
        </div>

        <div className="escolha-conteudo">

          <h3>4. ESCOLHA A GUARNIÇÃO</h3>

          {opcoesPorCategoria('guarnicao').map((opcao) => (
            <label key={opcao.id}>
              <input
                type="radio"
                name="guarnicao"
                value={opcao.nome}
                checked={guarnicao === opcao.nome}
                onChange={(e) => setGuarnicao(e.target.value)}
              />

              {opcao.nome}
            </label>
          ))}

        </div>

      </section>


      {/* RESUMO */}
      <section className="resumo">

        <h3>RESUMO DO SEU PEDIDO</h3>

        <div className="resumo-itens">

          <span>
            🍚 {arroz || 'Arroz não escolhido'}
          </span>

          <span>
            🫘 {feijao || 'Feijão não escolhido'}
          </span>

          <span>
            🍗 {proteina || 'Proteína não escolhida'}
          </span>

          <span>
            🥗 {guarnicao || 'Guarnição não escolhida'}
          </span>

        </div>


        <button className="continuar-btn">
          CONTINUAR →
        </button>


        <button
          className="limpar-btn"
          onClick={limparEscolhas}
        >
          ↻ LIMPAR ESCOLHAS
        </button>

      </section>

    </div>
  )
}

export default Marmitas
