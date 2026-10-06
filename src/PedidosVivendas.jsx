import { useEffect, useState } from 'react'
import './PedidosVivendas.css'
import './PedidosOrigem.css'
import { rotuloPagamento, textoTroco } from './formasPagamento'

// O SQLite salva criado_em em UTC (CURRENT_TIMESTAMP).
// Aqui convertemos pro horário local do navegador antes de exibir.
function formatarHora(criadoEm) {
  if (!criadoEm) return ''

  const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')

  if (Number.isNaN(dataUtc.getTime())) return ''

  return dataUtc.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Retorna a data (YYYY-MM-DD) local do navegador a partir do criado_em em UTC
function dataLocalDoPedido(criadoEm) {
  if (!criadoEm) return ''

  const d = new Date(criadoEm.replace(' ', 'T') + 'Z')

  if (Number.isNaN(d.getTime())) return ''

  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

// Data de hoje (YYYY-MM-DD) no horário local do navegador
function hojeLocal() {
  const agora = new Date()

  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

// Formata YYYY-MM-DD pra exibição (Hoje / Ontem / DD/MM)
function formatarDataSelecionada(dataStr) {
  if (dataStr === hojeLocal()) return 'Hoje'

  const [ano, mes, dia] = dataStr.split('-')

  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  const ontemStr = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`

  if (dataStr === ontemStr) return 'Ontem'

  return `${dia}/${mes}`
}

function mudarDia(dataStr, delta) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)

  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + delta)

  const novoAno = data.getFullYear()
  const novoMes = String(data.getMonth() + 1).padStart(2, '0')
  const novoDia = String(data.getDate()).padStart(2, '0')

  return `${novoAno}-${novoMes}-${novoDia}`
}

// Rótulo de exibição para cada status do pedido
function rotuloStatus(status) {
  const rotulos = {
    aguardando: 'AGUARDANDO APROVAÇÃO',
    aprovado: 'APROVADO',
    em_preparo: 'EM PREPARO',
    pronto: 'PRONTO',
    recusado: 'RECUSADO'
  }

  return rotulos[status] || status.toUpperCase()
}

// Monta a linha de bebida do pedido (refrigerante ou água), ou null se não houver
function textoBebida(pedido) {
  const qtd = Number(pedido.bebida_quantidade) > 1
    ? `${pedido.bebida_quantidade}x `
    : ''

  if (pedido.refrigerante_sabor || pedido.refrigerante_tamanho) {
    const partes = [pedido.refrigerante_sabor, pedido.refrigerante_tamanho].filter(Boolean)
    return `🥤 ${qtd}${partes.join(' - ')}`
  }

  if (pedido.agua_tipo) {
    return `💧 ${qtd}${pedido.agua_tipo}`
  }

  return null
}

// Carne: usa o campo novo (carne); cai pro campo antigo (proteina) se o pedido for de antes da mudança
function textoCarne(pedido) {
  return pedido.carne || pedido.proteina || ''
}

// ===== ORIGEM DO PEDIDO =====
// Pedidos antigos (sem origem) contam como Vivendas.
function ehClienteComum(pedido) {
  return pedido.origem === 'cliente_comum'
}

function rotuloOrigem(pedido) {
  return ehClienteComum(pedido) ? 'CLIENTE COMUM' : 'VIVENDAS'
}

function formatarReais(valor) {
  return `R$ ${Number(valor || 0).toFixed(2)}`
}

function rotuloEntrega(pedido) {
  return pedido.tipo_entrega === 'entrega' ? 'Entrega' : 'Retirada no local'
}

// Texto do que deve ser cobrado do cliente
// - Vivendas: marmita paga pelo código, cobra só a bebida
// - Cliente comum: cobra marmita + bebida
function textoCobranca(pedido) {
  const semValorSeparado =
    pedido.valor_cobrar === null || pedido.valor_cobrar === undefined

  // Pedido antigo, de antes da regra de pagamento
  if (semValorSeparado) {
    return `Valor: ${formatarReais(pedido.preco)}`
  }

  if (ehClienteComum(pedido)) {
    return `Cobrar do cliente: ${formatarReais(pedido.valor_cobrar)}`
  }

  if (Number(pedido.valor_cobrar) > 0) {
    return `Cobrar do cliente: ${formatarReais(pedido.valor_cobrar)} (só a bebida)`
  }

  return 'Nada a cobrar — marmita paga pelo código Vivendas'
}

function PedidosVivendas({ voltar }) {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('aguardando')
  const [dataSelecionada, setDataSelecionada] = useState(hojeLocal())

  async function carregarPedidos(mostrarErro = true) {
    try {
      const resposta = await fetch('http://localhost:3000/pedidos')

      if (!resposta.ok) {
        throw new Error('Erro ao buscar pedidos')
      }

      const dados = await resposta.json()

      setPedidos(dados)
    } catch (erro) {
      console.error(erro)
      if (mostrarErro) {
        alert('Não foi possível carregar os pedidos.')
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarPedidos()

    // Atualiza a lista automaticamente a cada 10s,
    // sem mostrar alert se falhar em segundo plano
    const intervalo = setInterval(() => {
      carregarPedidos(false)
    }, 10000)

    return () => clearInterval(intervalo)
  }, [])

  async function aprovarPedido(pedido) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/pedidos/${pedido.id}/aprovar`,
        {
          method: 'PUT'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao aprovar pedido.')
        return
      }

      imprimirPedido({ ...pedido, status: 'aprovado' })

      carregarPedidos()

    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function recusarPedido(id) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/pedidos/${id}/recusar`,
        {
          method: 'PUT'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao recusar pedido.')
        return
      }

      alert('Pedido recusado!')

      carregarPedidos()

    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarEmPreparo(id) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/pedidos/${id}/preparo`,
        {
          method: 'PUT'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar pedido.')
        return
      }

      carregarPedidos()

    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarPronto(id) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/pedidos/${id}/pronto`,
        {
          method: 'PUT'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar pedido.')
        return
      }

      carregarPedidos()

    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  function imprimirPedido(pedido) {
    const janela = window.open('', '_blank', 'width=320,height=600')

    if (!janela) {
      alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.')
      return
    }

    const bebida = textoBebida(pedido)
    const carne = textoCarne(pedido)
    const comum = ehClienteComum(pedido)

    // Bloco de identificação: muda conforme a origem do pedido
    const blocoCliente = comum
      ? `
          <p><strong>Cliente:</strong> ${pedido.nome}</p>
          <p><strong>Tel:</strong> ${pedido.telefone || ''}</p>
          <p><strong>${rotuloEntrega(pedido)}</strong></p>
          ${
            pedido.tipo_entrega === 'entrega' && pedido.endereco
              ? `<p><strong>End:</strong> ${pedido.endereco}</p>`
              : ''
          }
        `
      : `
          <p><strong>Cliente:</strong> ${pedido.nome}</p>
          <p><strong>Loja:</strong> ${pedido.loja}</p>
          <p><strong>Código:</strong> ${pedido.codigo_vivendas}</p>
        `

    // Bloco de pagamento: Vivendas paga só a bebida; cliente comum paga tudo
    const semValorSeparado =
      pedido.valor_cobrar === null || pedido.valor_cobrar === undefined

    let blocoPagamento

    if (semValorSeparado) {
      blocoPagamento = `<p class="total">TOTAL: ${formatarReais(pedido.preco)}</p>`
    } else if (comum) {
      blocoPagamento = `<p class="total">COBRAR: ${formatarReais(pedido.valor_cobrar)}</p>`
    } else if (Number(pedido.valor_cobrar) > 0) {
      blocoPagamento = `
          <p>Marmita: paga pelo código</p>
          <p class="total">COBRAR (bebida): ${formatarReais(pedido.valor_cobrar)}</p>
        `
    } else {
      blocoPagamento = `<p class="total">PAGO PELO CÓDIGO</p>`
    }

    const linhaForma = pedido.forma_pagamento
      ? `<p><strong>Pagto na entrega:</strong> ${rotuloPagamento(pedido.forma_pagamento)}</p>${
          textoTroco(pedido) ? `<p><strong>${textoTroco(pedido)}</strong></p>` : ''
        }`
      : ''

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido #${pedido.id}</title>
          <style>
            /* Define o tamanho físico do papel da térmica 58mm.
               "auto" na altura deixa a impressora cortar no tamanho do conteúdo. */
            @page {
              size: 58mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              width: 58mm;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.35;
              color: #000;
              padding: 2mm 3mm 6mm;
            }

            h1 {
              text-align: center;
              font-size: 15px;
              margin: 0 0 2px;
              letter-spacing: 0.5px;
            }

            .subtitulo {
              text-align: center;
              font-size: 10px;
              margin-bottom: 8px;
            }

            .origem {
              text-align: center;
              font-size: 13px;
              font-weight: bold;
              border: 1px solid #000;
              padding: 2px 0;
              margin: 4px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #000;
              margin: 6px 0;
            }

            p {
              margin: 2px 0;
              word-break: break-word;
            }

            .item {
              margin: 1px 0;
            }

            .secao-titulo {
              font-weight: bold;
              margin-top: 4px;
            }

            .total {
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
              text-align: right;
            }

            .rodape {
              text-align: center;
              font-size: 9px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>EL SHADDAY RESTAURANTE</h1>
          <p class="subtitulo">${rotuloStatus(pedido.status)} — Nº ${pedido.id}</p>

          <p class="origem">${rotuloOrigem(pedido)}</p>

          <hr />

          ${blocoCliente}
          <p><strong>Horário:</strong> ${formatarHora(pedido.criado_em)}</p>

          <hr />

          <p class="secao-titulo">MARMITA</p>
          ${carne ? `<p class="item">🍗 ${carne}</p>` : ''}
          ${pedido.guarnicao ? `<p class="item">🥗 ${pedido.guarnicao}</p>` : ''}

          ${bebida ? `<p class="item">${bebida}</p>` : ''}

          ${pedido.observacao ? `<p><strong>Obs:</strong> ${pedido.observacao}</p>` : ''}

          <hr />

          ${linhaForma}
          ${blocoPagamento}

          <p class="rodape">${new Date().toLocaleString('pt-BR')}</p>
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()

    setTimeout(() => {
      janela.print()
    }, 250)
  }

  const pedidosDoDia = pedidos.filter(
    (pedido) => dataLocalDoPedido(pedido.criado_em) === dataSelecionada
  )

  const pedidosFiltrados = pedidosDoDia.filter(
    (pedido) => pedido.status === filtro
  )

  const contagem = {
    aguardando: pedidosDoDia.filter((p) => p.status === 'aguardando').length,
    aprovado: pedidosDoDia.filter((p) => p.status === 'aprovado').length,
    em_preparo: pedidosDoDia.filter((p) => p.status === 'em_preparo').length,
    pronto: pedidosDoDia.filter((p) => p.status === 'pronto').length,
    recusado: pedidosDoDia.filter((p) => p.status === 'recusado').length
  }

  const ehHoje = dataSelecionada === hojeLocal()

  return (
    <div className="pedidos-vivendas-page">

      <header className="pedidos-vivendas-header">

        <button
          className="pedidos-voltar"
          onClick={voltar}
        >
          ←
        </button>

        <div>
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

      </header>

      <main className="pedidos-vivendas-conteudo">

        <h2>PEDIDOS</h2>

        <div className="pedidos-topo-lista">
          <p className="pedidos-subtitulo">
            Pedidos recebidos
          </p>

          <button
            className="atualizar-btn"
            onClick={() => carregarPedidos()}
          >
            ↻ Atualizar
          </button>
        </div>

        {/* NAVEGAÇÃO POR DIA */}
        <div className="pedidos-dia-nav">

          <button
            onClick={() => setDataSelecionada(mudarDia(dataSelecionada, -1))}
          >
            ←
          </button>

          <span>
            {formatarDataSelecionada(dataSelecionada)}
          </span>

          <button
            onClick={() => setDataSelecionada(mudarDia(dataSelecionada, 1))}
            disabled={ehHoje}
          >
            →
          </button>

          <input
            type="date"
            className="pedidos-dia-input"
            value={dataSelecionada}
            max={hojeLocal()}
            onChange={(e) => {
              if (e.target.value) setDataSelecionada(e.target.value)
            }}
          />

        </div>

        <div className="pedidos-abas">

          <button
            className={`aba-btn ${filtro === 'aguardando' ? 'aba-ativa' : ''}`}
            onClick={() => setFiltro('aguardando')}
          >
            Aguardando ({contagem.aguardando})
          </button>

          <button
            className={`aba-btn ${filtro === 'aprovado' ? 'aba-ativa' : ''}`}
            onClick={() => setFiltro('aprovado')}
          >
            Aprovados ({contagem.aprovado})
          </button>

          <button
            className={`aba-btn ${filtro === 'em_preparo' ? 'aba-ativa' : ''}`}
            onClick={() => setFiltro('em_preparo')}
          >
            Preparo ({contagem.em_preparo})
          </button>

          <button
            className={`aba-btn ${filtro === 'pronto' ? 'aba-ativa' : ''}`}
            onClick={() => setFiltro('pronto')}
          >
            Prontos ({contagem.pronto})
          </button>

          <button
            className={`aba-btn ${filtro === 'recusado' ? 'aba-ativa' : ''}`}
            onClick={() => setFiltro('recusado')}
          >
            Recusados ({contagem.recusado})
          </button>

        </div>

        {carregando && (
          <p>Carregando pedidos...</p>
        )}

        {!carregando && pedidosFiltrados.length === 0 && (
          <div className="pedido-pendente">
            <h3>Nenhum pedido aqui</h3>
            <p>
              {filtro === 'aguardando' && ehHoje
                ? 'Quando um cliente enviar um pedido, ele aparecerá aqui.'
                : `Nenhum pedido "${rotuloStatus(filtro).toLowerCase()}" em ${formatarDataSelecionada(dataSelecionada) === 'Hoje' ? 'hoje' : formatarDataSelecionada(dataSelecionada)}.`}
            </p>
          </div>
        )}

        {pedidosFiltrados.map((pedido) => (

          <div
            className={`pedido-pendente pedido-${pedido.status}`}
            key={pedido.id}
          >

            <div className="pedido-topo">

              <div>

                <div className="pedido-tags">

                  <span className={`pedido-status pedido-status-${pedido.status}`}>
                    {rotuloStatus(pedido.status)}
                  </span>

                  <span
                    className={`pedido-origem ${
                      ehClienteComum(pedido)
                        ? 'pedido-origem-comum'
                        : 'pedido-origem-vivendas'
                    }`}
                  >
                    {ehClienteComum(pedido) ? '👤' : '🏢'} {rotuloOrigem(pedido)}
                  </span>

                </div>

                <h3>
                  Pedido #{pedido.id}
                  <span className="pedido-hora">
                    {' '}
                    {formatarHora(pedido.criado_em)}
                  </span>
                </h3>

              </div>

            </div>

            <div className="pedido-dados">

              <p>
                <strong>Cliente:</strong> {pedido.nome}
              </p>

              {ehClienteComum(pedido) ? (
                <>
                  <p>
                    <strong>Telefone:</strong> {pedido.telefone}
                  </p>

                  <p>
                    <strong>Recebimento:</strong> {rotuloEntrega(pedido)}
                  </p>

                  {pedido.tipo_entrega === 'entrega' && pedido.endereco && (
                    <p>
                      <strong>Endereço:</strong> {pedido.endereco}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    <strong>Loja:</strong> {pedido.loja}
                  </p>

                  <p>
                    <strong>Código Vivendas:</strong> {pedido.codigo_vivendas}
                  </p>
                </>
              )}

            </div>

            <div className="pedido-marmita">

              <h4>DETALHES DA MARMITA</h4>

              {textoCarne(pedido) && (
                <p>🍗 {textoCarne(pedido)}</p>
              )}

              {pedido.guarnicao && (
                <p>🥗 {pedido.guarnicao}</p>
              )}

              {textoBebida(pedido) && (
                <p>{textoBebida(pedido)}</p>
              )}

              {pedido.observacao && (
                <p>
                  <strong>Observação:</strong> {pedido.observacao}
                </p>
              )}

            </div>

            <div
              className={`pedido-cobranca ${
                ehClienteComum(pedido)
                  ? 'pedido-cobranca-comum'
                  : 'pedido-cobranca-vivendas'
              }`}
            >
              <p>{textoCobranca(pedido)}</p>

              {pedido.forma_pagamento && (
                <p>
                  Pagamento na entrega: {rotuloPagamento(pedido.forma_pagamento)}
                </p>
              )}

              {textoTroco(pedido) && (
                <p>{textoTroco(pedido)}</p>
              )}
            </div>

            {pedido.status === 'aguardando' && (

              <div className="pedido-acoes">

                <button
                  className="aprovar-btn"
                  onClick={() => aprovarPedido(pedido)}
                >
                  ✓ APROVAR PEDIDO
                </button>

                <button
                  className="recusar-btn"
                  onClick={() => recusarPedido(pedido.id)}
                >
                  ✕ RECUSAR
                </button>

              </div>

            )}

            {pedido.status === 'aprovado' && (

              <div className="pedido-acoes">

                <button
                  className="imprimir-btn"
                  onClick={() => imprimirPedido(pedido)}
                >
                  🖨 IMPRIMIR
                </button>

                <button
                  className="preparo-btn"
                  onClick={() => marcarEmPreparo(pedido.id)}
                >
                  👨‍🍳 INICIAR PREPARO
                </button>

              </div>

            )}

            {pedido.status === 'em_preparo' && (

              <div className="pedido-acoes">

                <button
                  className="imprimir-btn"
                  onClick={() => imprimirPedido(pedido)}
                >
                  🖨 IMPRIMIR
                </button>

                <button
                  className="pronto-btn"
                  onClick={() => marcarPronto(pedido.id)}
                >
                  ✅ MARCAR COMO PRONTO
                </button>

              </div>

            )}

          </div>

        ))}

      </main>

    </div>
  )
}

export default PedidosVivendas
