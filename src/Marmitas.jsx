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

// ===== ÍCONES VETORIAIS (SVG OUTLINE NÍTIDOS) =====

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
      <path d="m6 8 1.75 12.28A2 2 0 0 0 9.73 22h4.54a2 2 0 0 0 1.98-1.72L18 8" />
      <path d="M5 8h14" />
      <path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
      <path d="m12 8 1-6h2" />
    </svg>
  )
}

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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function IconeLixeira({ size = 15 }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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

  // Lista de bebidas adicionadas
  const [bebidas, setBebidas] = useState([])

  // Seletor de abas: começa em 'nenhuma' (Sem bebida)
  const [abaBebida, setAbaBebida] = useState('nenhuma') // 'nenhuma' | 'refrigerante' | 'agua'
  const [refriTamanhoSel, setRefriTamanhoSel] = useState(REFRIGERANTE_TAMANHOS_PADRAO[1]) // Padrão 600 ml
  const [refriSaborSel, setRefriSaborSel] = useState('Fanta Laranja')
  const [saborCustomAtivo, setSaborCustomAtivo] = useState(false)
  const [saborCustomTexto, setSaborCustomTexto] = useState('')
  const [aguaSel, setAguaSel] = useState(AGUA_TIPOS_PADRAO[0])

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
      } catch (err) {
        console.error(err)
        setErro(err.message)
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
        // falha silenciosa em background
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
          ← Voltar para a página inicial
        </button>
      </div>
    )
  }

  function opcoesPorCategoria(categoria) {
    const doCardapio = (cardapio && Array.isArray(cardapio.opcoes))
      ? cardapio.opcoes.filter((opcao) => opcao && opcao.categoria === categoria)
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
    setBebidas([])
    setAbaBebida('nenhuma')
    setSaborCustomAtivo(false)
    setSaborCustomTexto('')
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

  function adicionarRefrigerante() {
    const saborFinal = saborCustomAtivo ? saborCustomTexto.trim() : refriSaborSel

    if (!saborFinal) {
      alert('Selecione ou digite o sabor do refrigerante.')
      return
    }

    if (!refriTamanhoSel) {
      alert('Selecione o tamanho do refrigerante.')
      return
    }

    const idUnico = `refri-${refriTamanhoSel.nome}-${saborFinal}`
    const precoUnitario = Number(refriTamanhoSel.preco)

    setBebidas((atuais) => {
      const existente = atuais.find((b) => b.id === idUnico)
      if (existente) {
        return atuais.map((b) =>
          b.id === idUnico
            ? { ...b, quantidade: Math.min(MAX_QUANTIDADE_BEBIDA, b.quantidade + 1) }
            : b
        )
      }
      return [
        ...atuais,
        {
          id: idUnico,
          tipo: 'refrigerante',
          nome: `${refriTamanhoSel.nome} • ${saborFinal}`,
          sabor: saborFinal,
          tamanho: refriTamanhoSel.nome,
          preco: precoUnitario,
          quantidade: 1
        }
      ]
    })

    if (saborCustomAtivo) {
      setSaborCustomTexto('')
      setSaborCustomAtivo(false)
    }
  }

  function adicionarAgua() {
    if (!aguaSel) return

    const idUnico = `agua-${aguaSel.nome}`
    const precoUnitario = Number(aguaSel.preco)

    setBebidas((atuais) => {
      const existente = atuais.find((b) => b.id === idUnico)
      if (existente) {
        return atuais.map((b) =>
          b.id === idUnico
            ? { ...b, quantidade: Math.min(MAX_QUANTIDADE_BEBIDA, b.quantidade + 1) }
            : b
        )
      }
      return [
        ...atuais,
        {
          id: idUnico,
          tipo: 'agua',
          nome: aguaSel.nome,
          sabor: '',
          tamanho: 'Garrafa',
          preco: precoUnitario,
          quantidade: 1
        }
      ]
    })
  }

  function alterarQtdBebida(id, delta) {
    setBebidas((atuais) =>
      atuais
        .map((b) => {
          if (b.id === id) {
            const novaQtd = b.quantidade + delta
            return novaQtd > 0 ? { ...b, quantidade: Math.min(MAX_QUANTIDADE_BEBIDA, novaQtd) } : null
          }
          return b
        })
        .filter(Boolean)
    )
  }

  function removerBebida(id) {
    setBebidas((atuais) => atuais.filter((b) => b.id !== id))
  }

  // ===== CÁLCULOS MATEMÁTICOS CORRETOS E REATIVOS =====
  const precoMarmita = (cardapio && cardapio.preco !== undefined && cardapio.preco !== null)
    ? Number(cardapio.preco)
    : 10.0

  const totalBebidas = bebidas.reduce(
    (acc, item) => acc + Number(item.preco) * Number(item.quantidade),
    0
  )
  const totalGeral = precoMarmita + totalBebidas
  const totalBebidasQtd = bebidas.reduce((acc, item) => acc + item.quantidade, 0)

  function tentarContinuar() {
    if (carne.length === 0) {
      alert('Por favor, selecione pelo menos uma opção de proteína para sua marmita.')
      return
    }

    const nomesRefris = bebidas
      .filter((b) => b.tipo === 'refrigerante')
      .map((b) => `${b.quantidade}x ${b.sabor} (${b.tamanho})`)
      .join(', ')

    const nomesAguas = bebidas
      .filter((b) => b.tipo === 'agua')
      .map((b) => `${b.quantidade}x ${b.nome}`)
      .join(', ')

    continuar({
      carne: carne.join(', '),
      guarnicao: guarnicao.join(', '),
      refrigerante_sabor: nomesRefris,
      refrigerante_tamanho: bebidas
        .filter((b) => b.tipo === 'refrigerante')
        .map((b) => b.tamanho)
        .join(', '),
      agua_tipo: nomesAguas,
      bebida_quantidade: totalBebidasQtd,
      bebidas: bebidas,
      preco_marmita: precoMarmita,
      preco_bebida: totalBebidas,
      preco: totalGeral,
      valor_cobrar: totalGeral
    })
  }

  return (
    <div className="marmitas-page">

      {/* CABEÇALHO */}
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

        {/* PASSO 1: PROTEÍNA */}
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
                    key={opcao.id || opcao.nome}
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

        {/* PASSO 2: GUARNIÇÕES */}
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
                    key={opcao.id || opcao.nome}
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

        {/* PASSO 3: BEBIDAS */}
        <section className="escolha escolha-bebida">
          <div className="escolha-cabecalho">
            <div className="escolha-icon">
              <IconeBebida size={18} />
            </div>
            <h3>3. Escolha sua bebida (opcional)</h3>
          </div>

          <div className="escolha-conteudo">

            {/* SELETOR DE ABA: SEM BEBIDA, REFRIGERANTE OU ÁGUA */}
            <div className="bebida-abas">
              <button
                type="button"
                className={`bebida-aba-btn ${abaBebida === 'nenhuma' ? 'bebida-aba-ativa' : ''}`}
                onClick={() => {
                  setAbaBebida('nenhuma')
                  setBebidas([])
                }}
              >
                Sem bebida
              </button>

              <button
                type="button"
                className={`bebida-aba-btn ${abaBebida === 'refrigerante' ? 'bebida-aba-ativa' : ''}`}
                onClick={() => setAbaBebida('refrigerante')}
              >
                Refrigerante
              </button>

              <button
                type="button"
                className={`bebida-aba-btn ${abaBebida === 'agua' ? 'bebida-aba-ativa' : ''}`}
                onClick={() => setAbaBebida('agua')}
              >
                Água
              </button>
            </div>

            {/* PAINEL SEM BEBIDA */}
            {abaBebida === 'nenhuma' && (
              <div className="bebida-sem-escolha-bloco">
                <p>✓ Nenhuma bebida selecionada para este pedido.</p>
                <span>Caso deseje adicionar, clique nas abas <strong>Refrigerante</strong> ou <strong>Água</strong> acima.</span>
              </div>
            )}

            {/* PAINEL REFRIGERANTE */}
            {abaBebida === 'refrigerante' && (
              <div className="bebida-montador">
                <p className="bebida-subtitulo">1. Escolha o tamanho:</p>
                <div className="bebida-tamanhos-grid">
                  {opcoesPorCategoria('refrigerante_tamanho').map((opcao) => {
                    const ativo = refriTamanhoSel?.nome === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id || opcao.nome}
                        className={`bebida-tamanho-card ${ativo ? 'bebida-tamanho-ativo' : ''}`}
                        onClick={() => setRefriTamanhoSel(opcao)}
                      >
                        {opcao.nome} • R$ {Number(opcao.preco).toFixed(2).replace('.', ',')}
                      </button>
                    )
                  })}
                </div>

                <p className="bebida-subtitulo">2. Escolha o sabor:</p>
                <div className="bebida-sabores">
                  {opcoesPorCategoria('refrigerante_sabor').map((opcao) => {
                    const ativo = !saborCustomAtivo && refriSaborSel === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id || opcao.nome}
                        className={`bebida-sabor-chip ${ativo ? 'bebida-sabor-ativo' : ''}`}
                        onClick={() => {
                          setSaborCustomAtivo(false)
                          setRefriSaborSel(opcao.nome)
                        }}
                      >
                        {ativo ? `✓ ${opcao.nome}` : opcao.nome}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className={`bebida-sabor-chip bebida-sabor-custom ${saborCustomAtivo ? 'bebida-sabor-ativo' : ''}`}
                    onClick={() => {
                      setSaborCustomAtivo(true)
                      setRefriSaborSel('')
                    }}
                  >
                    + Outro sabor
                  </button>
                </div>

                {saborCustomAtivo && (
                  <input
                    type="text"
                    className="bebida-sabor-input"
                    placeholder="Digite o sabor (ex: Sprite Zero, Guaraná Jesus...)"
                    value={saborCustomTexto}
                    onChange={(e) => setSaborCustomTexto(e.target.value)}
                    maxLength={40}
                    autoFocus
                  />
                )}

                <button
                  type="button"
                  className="adicionar-bebida-btn"
                  onClick={adicionarRefrigerante}
                >
                  + Adicionar Refrigerante (R$ {Number(refriTamanhoSel?.preco || 5).toFixed(2).replace('.', ',')})
                </button>
              </div>
            )}

            {/* PAINEL ÁGUA */}
            {abaBebida === 'agua' && (
              <div className="bebida-montador">
                <p className="bebida-subtitulo">Escolha o tipo de água:</p>
                <div className="bebida-tamanhos-grid">
                  {opcoesPorCategoria('agua').map((opcao) => {
                    const ativo = aguaSel?.nome === opcao.nome

                    return (
                      <button
                        type="button"
                        key={opcao.id || opcao.nome}
                        className={`bebida-tamanho-card ${ativo ? 'bebida-tamanho-ativo' : ''}`}
                        onClick={() => setAguaSel(opcao)}
                      >
                        {opcao.nome} • R$ {Number(opcao.preco).toFixed(2).replace('.', ',')}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="adicionar-bebida-btn"
                  onClick={adicionarAgua}
                >
                  + Adicionar {aguaSel?.nome || 'Água'} (R$ {Number(aguaSel?.preco || 3).toFixed(2).replace('.', ',')})
                </button>
              </div>
            )}

            {/* LISTA DE BEBIDAS ADICIONADAS */}
            {bebidas.length > 0 ? (
              <div className="bebidas-selecionadas-bloco">
                <h4 className="bebidas-selecionadas-titulo">Bebidas no seu pedido:</h4>

                <div className="bebidas-lista">
                  {bebidas.map((item) => (
                    <div className="bebida-item-linha" key={item.id}>
                      <div className="bebida-item-info">
                        <span className="bebida-item-nome">{item.nome}</span>
                        <span className="bebida-item-preco">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="bebida-item-acoes">
                        <div className="quantidade-stepper">
                          <button
                            type="button"
                            onClick={() => alterarQtdBebida(item.id, -1)}
                            title="Diminuir"
                          >
                            −
                          </button>
                          <span className="quantidade-valor">{item.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => alterarQtdBebida(item.id, 1)}
                            disabled={item.quantidade >= MAX_QUANTIDADE_BEBIDA}
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="bebida-remover-btn"
                          onClick={() => removerBebida(item.id)}
                          title="Remover"
                        >
                          <IconeLixeira size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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
              {carne.length === 0 && (
                <span className="resumo-pill-tag resumo-pill-pendente">
                  Proteína não escolhida
                </span>
              )}
            </div>

            {/* SE NÃO HOUVER BEBIDA, EXIBE O R$ 0,00 */}
            {bebidas.length === 0 && (
              <div className="resumo-linha resumo-linha-bebida">
                <span className="resumo-linha-titulo">Bebida: Sem bebida</span>
                <span className="resumo-linha-valor">R$ 0,00</span>
              </div>
            )}

            {/* LISTA DE TODAS AS BEBIDAS ADICIONADAS */}
            {bebidas.length > 0 && (
              <div className="resumo-bebidas-lista">
                {bebidas.map((b) => (
                  <div className="resumo-linha resumo-linha-bebida" key={b.id}>
                    <span className="resumo-linha-titulo">
                      {b.quantidade} x {b.nome}
                    </span>
                    <span className="resumo-linha-valor">
                      + R$ {(b.preco * b.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="resumo-divisor"></div>

            {/* TOTAL CORRETAMENTE CALCULADO: MARMITA + BEBIDAS */}
            <div className="resumo-linha-total">
              <span>Total: R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <button
            type="button"
            className="continuar-btn"
            onClick={tentarContinuar}
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