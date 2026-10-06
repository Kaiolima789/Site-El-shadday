import { useEffect, useState } from 'react'
import './Marmitas.css'

// Fotos ilustrativas de cada categoria (Unsplash, uso livre)
const FOTOS = {
  carne: 'https://images.unsplash.com/photo-1762631934518-f75e233413ca?auto=format&fit=crop&w=300&q=70',
  guarnicao: 'https://images.unsplash.com/photo-1594470603337-2e8778fda2be?auto=format&fit=crop&w=300&q=70'
}

const MAX_CARNES = 2
const MAX_QUANTIDADE_BEBIDA = 10

// ===== VALORES PADRÃO DE BEBIDA =====
// Usados como fallback SOMENTE quando o cardápio do dia (Admin) ainda não
// tiver essas opções cadastradas. Se o Admin configurar preços/sabores
// próprios, eles têm prioridade sobre esses valores fixos.
const REFRIGERANTE_TAMANHOS_PADRAO = [
  { id: 'padrao-tam-lata', nome: 'Lata', preco: 5.0 },
  { id: 'padrao-tam-600ml', nome: '600 ml', preco: 7.5 },
  { id: 'padrao-tam-2l', nome: '2 Litros', preco: 12.0 }
]

const REFRIGERANTE_SABORES_PADRAO = [
  { id: 'padrao-sabor-coca', nome: 'Coca-Cola' },
  { id: 'padrao-sabor-fanta-laranja', nome: 'Fanta Laranja' },
  { id: 'padrao-sabor-fanta-uva', nome: 'Fanta Uva' },
  { id: 'padrao-sabor-sprite', nome: 'Sprite' }
]

const AGUA_TIPOS_PADRAO = [
  { id: 'padrao-agua-comgas', nome: 'Água com gás', preco: 3.5 },
  { id: 'padrao-agua-semgas', nome: 'Água sem gás', preco: 3.0 }
]

// ===== ÍCONES (SVG inline, estilo outline, sem emoji e sem cor fixa) =====
// Usam stroke="currentColor" de propósito: assim herdam a cor do texto
// ao redor (vinho no estado normal, branco quando o item está selecionado),
// sem precisar de CSS extra por ícone.

function IconeSemBebida({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" />
    </svg>
  )
}

function IconeCopo({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1.2 11.3a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 8Z" />
      <path d="M5 8h14" />
      <path d="M14.5 3.2l1 4.8" />
      <path d="M14.5 3.2h2.3" />
    </svg>
  )
}

function IconeAgua({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c4 5 7 8.6 7 12a7 7 0 0 1-14 0c0-3.4 3-7 7-12Z" />
    </svg>
  )
}

function IconeLata({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
    </svg>
  )
}

function IconeGarrafa({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2h4v3.4l2 2.4V20a1.6 1.6 0 0 1-1.6 1.6H9.6A1.6 1.6 0 0 1 8 20V7.8l2-2.4V2Z" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  )
}

// Ícone de "editar/digitar" para o card de sabor personalizado
function IconeEditar({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

// Mesmo ícone de garrafa para 600ml e 2 Litros — só o tamanho do SVG muda,
// pra manter o estilo idêntico e não parecer produto diferente.
function iconeTamanho(nome) {
  const n = nome.toLowerCase()
  if (n.includes('lata')) return <IconeLata size={26} />
  if (n.includes('litro')) return <IconeGarrafa size={30} />
  return <IconeGarrafa size={24} />
}

function Marmitas({ voltar, continuar }) {
  const [carne, setCarne] = useState([])
  const [guarnicao, setGuarnicao] = useState([])

  // ===== BEBIDA =====
  const [bebidaTipo, setBebidaTipo] = useState(null) // null | 'refrigerante' | 'agua'
  const [refrigeranteSabor, setRefrigeranteSabor] = useState('')
  const [refrigeranteTamanho, setRefrigeranteTamanho] = useState(null) // { nome, preco }
  const [aguaTipo, setAguaTipo] = useState(null) // { nome, preco }
  const [saborPersonalizadoAtivo, setSaborPersonalizadoAtivo] = useState(false)
  const [quantidadeBebida, setQuantidadeBebida] = useState(1)

  const [cardapio, setCardapio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const itensEscolhidos =
    carne.length + guarnicao.length + (bebidaTipo ? 1 : 0)

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

  // Retorna as opções do cardápio de hoje para a categoria pedida.
  // Para as categorias de bebida, se o Admin ainda não tiver cadastrado
  // nada, cai nos valores padrão definidos no topo do arquivo.
  function opcoesPorCategoria(categoria) {
    const doCardapio = cardapio
      ? cardapio.opcoes.filter((opcao) => opcao.categoria === categoria)
      : []

    if (doCardapio.length > 0) {
      return doCardapio
    }

    if (categoria === 'refrigerante_tamanho') return REFRIGERANTE_TAMANHOS_PADRAO
    if (categoria === 'refrigerante_sabor') return REFRIGERANTE_SABORES_PADRAO
    if (categoria === 'agua') return AGUA_TIPOS_PADRAO

    return doCardapio
  }

  function limparEscolhas() {
    setCarne([])
    setGuarnicao([])
    setBebidaTipo(null)
    setRefrigeranteSabor('')
    setRefrigeranteTamanho(null)
    setAguaTipo(null)
    setSaborPersonalizadoAtivo(false)
    setQuantidadeBebida(1)
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

  function selecionarBebidaTipo(tipo) {
    setBebidaTipo((atual) => (atual === tipo ? null : tipo))
    setRefrigeranteSabor('')
    setRefrigeranteTamanho(null)
    setAguaTipo(null)
    setSaborPersonalizadoAtivo(false)
    setQuantidadeBebida(1)
  }

  function selecionarSaborDaLista(nome) {
    setSaborPersonalizadoAtivo(false)
    setRefrigeranteSabor(nome)
  }

  function selecionarSaborPersonalizado() {
    setSaborPersonalizadoAtivo(true)
    setRefrigeranteSabor('')
  }

  function alterarQuantidade(delta) {
    setQuantidadeBebida((atual) =>
      Math.min(MAX_QUANTIDADE_BEBIDA, Math.max(1, atual + delta))
    )
  }

  // preço unitário da bebida escolhida (0 se nada selecionado ainda)
  const precoUnitarioBebida =
    bebidaTipo === 'refrigerante' && refrigeranteTamanho
      ? refrigeranteTamanho.preco
      : bebidaTipo === 'agua' && aguaTipo
      ? aguaTipo.preco
      : 0

  const precoBebida = precoUnitarioBebida * quantidadeBebida

  const precoTotal = (cardapio?.preco || 0) + precoBebida

  // bebida incompleta = escolheu o tipo mas não terminou de escolher sabor/tamanho/tipo
  // (no caso de sabor personalizado, exige que o texto não esteja vazio)
  const bebidaIncompleta =
    (bebidaTipo === 'refrigerante' && (!refrigeranteSabor.trim() || !refrigeranteTamanho)) ||
    (bebidaTipo === 'agua' && !aguaTipo)

  // Mostra o seletor de quantidade só quando a bebida já está totalmente definida
  const bebidaDefinida =
    (bebidaTipo === 'refrigerante' && refrigeranteSabor.trim() && refrigeranteTamanho) ||
    (bebidaTipo === 'agua' && aguaTipo)

  function textoResumoBebida() {
    if (bebidaTipo === 'refrigerante') {
      if (!refrigeranteSabor.trim() || !refrigeranteTamanho) {
        return 'Refrigerante (escolha sabor e tamanho)'
      }
      return `${quantidadeBebida}x ${refrigeranteTamanho.nome} • ${refrigeranteSabor}`
    }

    if (bebidaTipo === 'agua') {
      if (!aguaTipo) return 'Água (escolha o tipo)'
      return `${quantidadeBebida}x ${aguaTipo.nome}`
    }

    return 'Sem bebida'
  }

  function seletorQuantidade() {
    return (
      <div className="bebida-quantidade">
        <span className="bebida-subtitulo bebida-quantidade-titulo">Quantidade:</span>

        <div className="quantidade-stepper">
          <button
            type="button"
            onClick={() => alterarQuantidade(-1)}
            disabled={quantidadeBebida <= 1}
          >
            −
          </button>

          <span className="quantidade-valor">{quantidadeBebida}</span>

          <button
            type="button"
            onClick={() => alterarQuantidade(1)}
            disabled={quantidadeBebida >= MAX_QUANTIDADE_BEBIDA}
          >
            +
          </button>
        </div>

        <span className="bebida-quantidade-subtotal">
          Subtotal: R$ {Number(precoBebida).toFixed(2)}
        </span>
      </div>
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


      {/* BEBIDA */}
      <section className="escolha escolha-bebida">

        <div className="escolha-icon">
          <IconeCopo size={24} />
        </div>

        <div className="escolha-conteudo">

          <h3>3. BEBIDA (opcional)</h3>

          <p className="bebida-legenda">Escolha sua bebida:</p>

          <div className="bebida-tipo-botoes">
            <button
              type="button"
              className={bebidaTipo === null ? 'bebida-tipo-ativo' : ''}
              onClick={() => selecionarBebidaTipo(null)}
            >
              <span className="bebida-tipo-icone">
                <IconeSemBebida />
              </span>
              Sem bebida
            </button>

            <button
              type="button"
              className={bebidaTipo === 'refrigerante' ? 'bebida-tipo-ativo' : ''}
              onClick={() => selecionarBebidaTipo('refrigerante')}
            >
              <span className="bebida-tipo-icone">
                <IconeCopo />
              </span>
              Refrigerante
            </button>

            <button
              type="button"
              className={bebidaTipo === 'agua' ? 'bebida-tipo-ativo' : ''}
              onClick={() => selecionarBebidaTipo('agua')}
            >
              <span className="bebida-tipo-icone">
                <IconeAgua />
              </span>
              Água
            </button>
          </div>

          {/* TAMANHO + SABOR DO REFRIGERANTE */}
          {bebidaTipo === 'refrigerante' && (
            <div className="bebida-detalhe">

              <p className="bebida-subtitulo">Escolha o tamanho:</p>

              <div className="bebida-cartoes">
                {opcoesPorCategoria('refrigerante_tamanho').map((opcao) => {
                  const selecionado = refrigeranteTamanho?.nome === opcao.nome

                  return (
                    <button
                      type="button"
                      key={opcao.id}
                      className={
                        selecionado ? 'bebida-cartao bebida-cartao-ativo' : 'bebida-cartao'
                      }
                      onClick={() =>
                        setRefrigeranteTamanho({
                          nome: opcao.nome,
                          preco: opcao.preco
                        })
                      }
                    >
                      {selecionado && <span className="bebida-check">✓</span>}
                      <span className="bebida-cartao-icone">
                        {iconeTamanho(opcao.nome)}
                      </span>
                      <span className="bebida-cartao-nome">{opcao.nome}</span>
                      <span className="bebida-cartao-preco">
                        R$ {Number(opcao.preco).toFixed(2)}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="bebida-info">
                O valor da bebida é definido pelo tamanho, e é o mesmo para todos os sabores.
              </div>

              <p className="bebida-subtitulo">Escolha o sabor:</p>

              <div className="bebida-sabores">
                {opcoesPorCategoria('refrigerante_sabor').map((opcao) => {
                  const selecionado =
                    !saborPersonalizadoAtivo && refrigeranteSabor === opcao.nome

                  return (
                    <button
                      type="button"
                      key={opcao.id}
                      className={
                        selecionado
                          ? 'bebida-sabor-cartao bebida-sabor-ativo'
                          : 'bebida-sabor-cartao'
                      }
                      onClick={() => selecionarSaborDaLista(opcao.nome)}
                    >
                      {selecionado && <span className="bebida-check">✓</span>}
                      <span className="bebida-sabor-icone">
                        <IconeCopo size={15} />
                      </span>
                      {opcao.nome}
                    </button>
                  )
                })}

                {/* OPÇÃO: sabor digitado pelo cliente */}
                <button
                  type="button"
                  className={
                    saborPersonalizadoAtivo
                      ? 'bebida-sabor-cartao bebida-sabor-ativo'
                      : 'bebida-sabor-cartao'
                  }
                  onClick={selecionarSaborPersonalizado}
                >
                  {saborPersonalizadoAtivo && <span className="bebida-check">✓</span>}
                  <span className="bebida-sabor-icone">
                    <IconeEditar size={15} />
                  </span>
                  Outro sabor
                </button>
              </div>

              {saborPersonalizadoAtivo && (
                <input
                  type="text"
                  className="bebida-sabor-input"
                  placeholder="Digite o sabor desejado (ex: Guaraná, Sprite Zero...)"
                  value={refrigeranteSabor}
                  onChange={(e) => setRefrigeranteSabor(e.target.value)}
                  maxLength={40}
                  autoFocus
                />
              )}

              {bebidaDefinida && seletorQuantidade()}

            </div>
          )}

          {/* TIPO DE ÁGUA */}
          {bebidaTipo === 'agua' && (
            <div className="bebida-detalhe">

              <div className="bebida-cartoes">
                {opcoesPorCategoria('agua').map((opcao) => {
                  const selecionado = aguaTipo?.nome === opcao.nome

                  return (
                    <button
                      type="button"
                      key={opcao.id}
                      className={
                        selecionado ? 'bebida-cartao bebida-cartao-ativo' : 'bebida-cartao'
                      }
                      onClick={() =>
                        setAguaTipo({
                          nome: opcao.nome,
                          preco: opcao.preco
                        })
                      }
                    >
                      {selecionado && <span className="bebida-check">✓</span>}
                      <span className="bebida-cartao-icone">
                        <IconeAgua size={26} />
                      </span>
                      <span className="bebida-cartao-nome">{opcao.nome}</span>
                      <span className="bebida-cartao-preco">
                        R$ {Number(opcao.preco).toFixed(2)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {bebidaDefinida && seletorQuantidade()}

            </div>
          )}

        </div>

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

          <span className="resumo-item-bebida">
            <IconeCopo size={14} />
            {textoResumoBebida()}
          </span>

        </div>

        <p className="resumo-total">
          Total: R$ {Number(precoTotal).toFixed(2)}
        </p>

        <button
          className="continuar-btn"
          disabled={bebidaIncompleta}
          onClick={() =>
            continuar({
              carne: carne.join(', '),
              guarnicao: guarnicao.join(', '),
              refrigerante_sabor:
                bebidaTipo === 'refrigerante' ? refrigeranteSabor.trim() : '',
              refrigerante_tamanho:
                bebidaTipo === 'refrigerante' && refrigeranteTamanho
                  ? refrigeranteTamanho.nome
                  : '',
              agua_tipo: bebidaTipo === 'agua' && aguaTipo ? aguaTipo.nome : '',
              bebida_quantidade: bebidaTipo ? quantidadeBebida : 0,
              // Valores separados: o servidor usa pra calcular o que cobrar
              // (Vivendas paga só a bebida; cliente comum paga tudo)
              preco_marmita: cardapio?.preco || 0,
              preco_bebida: precoBebida,
              preco: precoTotal
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
