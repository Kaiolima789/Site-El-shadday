import { useEffect, useState } from 'react'
import './Marmitas.css'

const MAX_CARNES = 2
const MAX_QUANTIDADE_BEBIDA = 10

// ===== VALORES PADRÃO DE BEBIDA =====
const REFRIGERANTE_TAMANHOS_PADRAO = [
  { id: 'padrao-tam-lata', nome: 'Lata', preco: 5.0 },
  { id: 'padrao-tam-600ml', nome: '600 ml', preco: 7.5 },
  { id: 'padrao-tam-2l', nome: '2 Litros', preco: 12.0 }
]

const REFRIGERANTE_SABORES_PADRAO = [
  { id: 'padrao-sabor-coca', nome: 'Coca-Cola' },
  { id: 'padrao-sabor-guarana', nome: 'Guaraná' },
  { id: 'padrao-sabor-fanta-laranja', nome: 'Fanta Laranja' },
  { id: 'padrao-sabor-fanta-uva', nome: 'Fanta Uva' },
  { id: 'padrao-sabor-sprite', nome: 'Sprite' }
]

const AGUA_TIPOS_PADRAO = [
  { id: 'padrao-agua-semgas', nome: 'Água sem gás', preco: 3.0 },
  { id: 'padrao-agua-comgas', nome: 'Água com gás', preco: 3.5 }
]

// ===== ÍCONES VETORIAIS (SOLUÇÃO B: GEOMETRIA LIMPA E NÍTIDA) =====

// Seta voltar
function IconeVoltar({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

// 1. Proteína (Garfo e Faca elegantes — símbolo universal da refeição principal)
function IconeProteina({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2v20" />
      <path d="M18 2a3 3 0 0 0-3 3v5a2 2 0 0 0 2 2h2" />
      <path d="M6 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
      <path d="M8 10v12" />
    </svg>
  )
}

// 2. Guarnições (Folha fresca de manjericão — símbolo clássico de salada e acompanhamentos)
function IconeGuarnicao({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  )
}

// 3. Bebida (Copo geométrico com canudo)
function IconeBebida({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 8h10l-1.5 13H8.5L7 8Z" />
      <path d="M5 8h14" />
      <path d="M15 2l-3 6" />
    </svg>
  )
}

// 4. Resumo (Recibo / Comanda)
function IconeRecibo({ size = 18 }) {
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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function dataHojeLocal() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function Marmitas({ voltar, continuar, irParaAdmin }) {
  const [carne, setCarne] = useState([])
  const [guarnicao, setGuarnicao] = useState([])

  // ===== BEBIDA =====
  const [bebidaTipo, setBebidaTipo] = useState(null)
  const [refrigeranteSabor, setRefrigeranteSabor] = useState('')
  const [refrigeranteTamanho, setRefrigeranteTamanho] = useState(null)
  const [aguaTipo, setAguaTipo] = useState(null)
  const [saborPersonalizadoAtivo, setSaborPersonalizadoAtivo] = useState(false)
  const [quantidadeBebida, setQuantidadeBebida] = useState(1)

  const [cardapio, setCardapio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarCardapio() {
      try {
        setCarregando(true)
        setErro('')

        const dataHoje = dataHojeLocal()
        const resposta = await fetch(`http://localhost:3000/cardapios/${dataHoje}`)

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

    const intervalo = setInterval(async () => {
      try {
        const resposta = await fetch(`http://localhost:3000/cardapios/${dataHojeLocal()}`)
        if (resposta.ok) {
          setCardapio(await resposta.json())
        }
      } catch (e) {
        // falha silenciosa em segundo plano
      }
    }, 15000)

    return () => clearInterval(intervalo)
  }, [])

  if (carregando) {
    return (
      <div className="marmitas-page marmitas-carregando">
        <h2>Carregando cardápio...</h2>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="marmitas-page marmitas-erro">
        <h2>Cardápio indisponível</h2>
        <p>{erro}</p>
        <button onClick={voltar} className="voltar-erro-btn">
          ← Voltar para a tela inicial
        </button>
      </div>
    )
  }

  function opcoesPorCategoria(categoria) {
    const doCardapio = cardapio
      ? cardapio.opcoes.filter((opcao) => opcao.categoria === categoria)
      : []

    if (doCardapio.length > 0) return doCardapio

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

  const precoUnitarioBebida = Number(
    bebidaTipo === 'refrigerante' && refrigeranteTamanho
      ? refrigeranteTamanho.preco
      : bebidaTipo === 'agua' && aguaTipo
      ? aguaTipo.preco
      : 0
  ) || 0

  const precoBebida = precoUnitarioBebida * quantidadeBebida
  const precoMarmita = Number(cardapio?.preco) || 0
  const precoTotal = precoMarmita + precoBebida

  const bebidaIncompleta =
    (bebidaTipo === 'refrigerante' && (!refrigeranteSabor.trim() || !refrigeranteTamanho)) ||
    (bebidaTipo === 'agua' && !aguaTipo)

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

  return (
    <div className="marmitas-page">

      {/* CABEÇALHO COM SETA DE VOLTAR PARA A HOME */}
      <header className="marmitas-header">
        <button
          type="button"
          className="marmitas-voltar-btn"
          onClick={voltar}
          title="Voltar para a página inicial"
        >
          <IconeVoltar size={18} />
          <span>Voltar</span>
        </button>

        <div className="marmitas-logo">
          <h1>EL SHADDAY - RESTAURANTE</h1>
        </div>

        <div className="marmitas-header-dir">
          {irParaAdmin ? (
            <button onClick={irParaAdmin} className="admin-link">
              Admin
            </button>
          ) : (
            <a href="#admin" onClick={(e) => { e.preventDefault(); if (voltar) voltar(); }} className="admin-link">
              Admin
            </a>
          )}
        </div>
      </header>

      {/* TÍTULO PRINCIPAL */}
      <section className="titulo-marmita">
        <h2>Monte sua Marmita</h2>
        <p>Escolha as opções de hoje</p>
      </section>

      {/* CONTAINER CENTRAL DOS CARDS */}
      <main className="marmitas-container">

        {/* PASSO 1: PROTEÍNA (Garfo e Faca elegantes) */}
        <section className="escolha">
          <div className="escolha-cabecalho">
            <div className="escolha-icon">
              <IconeProteina size={18} />
            </div>
            <h3>1. Escolha a sua proteína ({carne.length}/{MAX_CARNES})</h3>
          </div>

          <div className="escolha-conteudo">
            <div className="opcoes-lista">
              {opcoesPorCategoria('carne').map((opcao) => {
                const selecionada = carne.includes(opcao.nome)
                const desabilitada = !selecionada && carne.length >= MAX_CARNES

                return (
                  <label
                    key={opcao.id}
                    className={`opcao-item ${selecionada ? 'opcao-item-selecionada' : ''} ${desabilitada ? 'opcao-desabilitada' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      disabled={desabilitada}
                      onChange={() => alternarCarne(opcao.nome)}
                    />
                    <span>{opcao.nome}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </section>

        {/* PASSO 2: GUARNIÇÕES (Folha de tempero/manjericão fresca) */}
        <section className="escolha">
          <div className="escolha-cabecalho">
            <div className="escolha-icon">
              <IconeGuarnicao size={18} />
            </div>
            <h3>2. Escolha as guarnições</h3>
          </div>

          <div className="escolha-conteudo">
            <div className="opcoes-grid-guarnicoes">
              {opcoesPorCategoria('guarnicao').map((opcao) => {
                const selecionada = guarnicao.includes(opcao.nome)
                return (
                  <label
                    key={opcao.id}
                    className={`opcao-item ${selecionada ? 'opcao-item-selecionada' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => alternarGuarnicao(opcao.nome)}
                    />
                    <span>{opcao.nome}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </section>

        {/* PASSO 3: BEBIDA (Copo geométrico com canudo) */}
        <section className="escolha escolha-bebida">
          <div className="escolha-cabecalho">
            <div className="escolha-icon">
              <IconeBebida size={18} />
            </div>
            <h3>3. Escolha sua bebida (opcional)</h3>
          </div>

          <div className="escolha-conteudo">
            <div className="bebida-tipo-botoes">
              <button
                type="button"
                className={bebidaTipo === null ? 'bebida-tipo-ativo' : ''}
                onClick={() => selecionarBebidaTipo(null)}
              >
                Sem bebida
              </button>

              <button
                type="button"
                className={bebidaTipo === 'refrigerante' ? 'bebida-tipo-ativo' : ''}
                onClick={() => selecionarBebidaTipo('refrigerante')}
              >
                Refrigerante
              </button>

              <button
                type="button"
                className={bebidaTipo === 'agua' ? 'bebida-tipo-ativo' : ''}
                onClick={() => selecionarBebidaTipo('agua')}
              >
                Água
              </button>
            </div>

            {/* TAMANHO + SABOR DO REFRIGERANTE */}
            {bebidaTipo === 'refrigerante' && (
              <div className="bebida-detalhe">
                <div className="bebida-tamanhos-grid">
                  {opcoesPorCategoria('refrigerante_tamanho').map((opcao) => {
                    const selecionado = refrigeranteTamanho?.nome === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id}
                        className={`bebida-tamanho-card ${selecionado ? 'bebida-tamanho-ativo' : ''}`}
                        onClick={() =>
                          setRefrigeranteTamanho({
                            nome: opcao.nome,
                            preco: opcao.preco
                          })
                        }
                      >
                        {opcao.nome} • R$ {Number(opcao.preco).toFixed(2).replace('.', ',')}
                      </button>
                    )
                  })}
                </div>

                <div className="bebida-sabores">
                  {opcoesPorCategoria('refrigerante_sabor').map((opcao) => {
                    const selecionado =
                      !saborPersonalizadoAtivo && refrigeranteSabor === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id}
                        className={`bebida-sabor-chip ${selecionado ? 'bebida-sabor-ativo' : ''}`}
                        onClick={() => selecionarSaborDaLista(opcao.nome)}
                      >
                        {selecionado ? `✓ ${opcao.nome}` : opcao.nome}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className={`bebida-sabor-chip bebida-sabor-custom ${saborPersonalizadoAtivo ? 'bebida-sabor-ativo' : ''}`}
                    onClick={selecionarSaborPersonalizado}
                  >
                    + Outro sabor
                  </button>
                </div>

                {saborPersonalizadoAtivo && (
                  <input
                    type="text"
                    className="bebida-sabor-input"
                    placeholder="Digite o sabor desejado (ex: Fanta Uva, Sprite Zero...)"
                    value={refrigeranteSabor}
                    onChange={(e) => setRefrigeranteSabor(e.target.value)}
                    maxLength={40}
                    autoFocus
                  />
                )}

                {bebidaDefinida && (
                  <div className="bebida-quantidade">
                    <span className="bebida-quantidade-titulo">Quantidade:</span>
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
                  </div>
                )}
              </div>
            )}

            {/* TIPO DE ÁGUA */}
            {bebidaTipo === 'agua' && (
              <div className="bebida-detalhe">
                <div className="bebida-tamanhos-grid">
                  {opcoesPorCategoria('agua').map((opcao) => {
                    const selecionado = aguaTipo?.nome === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id}
                        className={`bebida-tamanho-card ${selecionado ? 'bebida-tamanho-ativo' : ''}`}
                        onClick={() =>
                          setAguaTipo({
                            nome: opcao.nome,
                            preco: opcao.preco
                          })
                        }
                      >
                        {opcao.nome} • R$ {Number(opcao.preco).toFixed(2).replace('.', ',')}
                      </button>
                    )
                  })}
                </div>

                {bebidaDefinida && (
                  <div className="bebida-quantidade">
                    <span className="bebida-quantidade-titulo">Quantidade:</span>
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
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RESUMO DO SEU PEDIDO */}
        <section className="resumo">
          <div className="resumo-cabecalho">
            <IconeRecibo size={18} />
            <h3>Resumo do seu pedido</h3>
          </div>

          <div className="resumo-extrato">
            <div className="resumo-linha">
              <span className="resumo-linha-titulo">Marmita Tradicional</span>
              <span className="resumo-linha-valor">
                R$ {precoMarmita.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="resumo-pills">
              {carne.length > 0 && (
                <span className="resumo-pill-tag">{carne.join(', ')}</span>
              )}
              {guarnicao.length > 0 && (
                <span className="resumo-pill-tag">{guarnicao.join(', ')}</span>
              )}
              {carne.length === 0 && guarnicao.length === 0 && (
                <span className="resumo-pill-tag resumo-pill-pendente">
                  Nenhum item selecionado
                </span>
              )}
            </div>

            {bebidaDefinida && (
              <div className="resumo-linha resumo-linha-bebida">
                <span className="resumo-linha-titulo">
                  Bebida: {textoResumoBebida()}
                </span>
                <span className="resumo-linha-valor">
                  R$ {Number(precoBebida).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            <div className="resumo-divisor"></div>

            <div className="resumo-linha-total">
              <span>Total: R$ {Number(precoTotal).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

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
                preco_marmita: precoMarmita,
                preco_bebida: precoBebida,
                preco: precoTotal
              })
            }
          >
            Continuar Pedido →
          </button>

          <button
            type="button"
            className="limpar-btn"
            onClick={limparEscolhas}
          >
            Limpar escolhas
          </button>
        </section>

      </main>

    </div>
  )
}

export default Marmitas