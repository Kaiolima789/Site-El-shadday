import { useEffect, useState } from 'react'
import './PedidosVivendas.css'

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
    const janela = window.open('', '_blank', 'width=380,height=600')

    if (!janela) {
      alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.')
      return
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido #${pedido.id}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 16px;
              color: #111;
            }
            h1 {
              text-align: center;
              font-size: 18px;
              margin: 0 0 2px;
            }
            .subtitulo {
              text-align: center;
              font-size: 11px;
              color: #555;
              margin-bottom: 14px;
            }
            hr {
              border: none;
              border-top: 1px dashed #999;
              margin: 12px 0;
            }
            p {
              font-size: 14px;
              margin: 4px 0;
            }
            .item {
              font-size: 14px;
              margin: 3px 0;
            }
            .total {
              font-size: 16px;
              font-weight: bold;
              margin-top: 10px;
            }
            .rodape {
              text-align: center;
              font-size: 11px;
              color: #777;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <h1>EL SHADDAY RESTAURANTE</h1>
          <p class="subtitulo">PEDIDO ${rotuloStatus(pedido.status)} — Nº ${pedido.id}</p>

          <hr />

          <p><strong>Cliente:</strong> ${pedido.nome}</p>
          <p><strong>Loja:</strong> ${pedido.loja}</p>
          <p><strong>Código Vivendas:</strong> ${pedido.codigo_vivendas}</p>
          <p><strong>Horário:</strong> ${formatarHora(pedido.criado_em)}</p>

          <hr />

          <p><strong>MARMITA</strong></p>
          <p class="item">🍚 ${pedido.arroz}</p>
          <p class="item">🫘 ${pedido.feijao}</p>
          <p class="item">🍗 ${pedido.proteina}</p>
          <p class="item">🥗 ${pedido.guarnicao}</p>
          ${pedido.observacao ? `<p><strong>Observação:</strong> ${pedido.observacao}</p>` : ''}

          <hr />

          <p class="total">Valor: R$ ${Number(pedido.preco).toFixed(2)}</p>

          <p class="rodape">Impresso em ${new Date().toLocaleString('pt-BR')}</p>
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

        <h2>PEDIDOS VIVENDAS</h2>

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
                ? 'Quando um cliente enviar um pedido pela Vivendas, ele aparecerá aqui.'
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

                <span className={`pedido-status pedido-status-${pedido.status}`}>
                  {rotuloStatus(pedido.status)}
                </span>

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

              <p>
                <strong>Loja:</strong> {pedido.loja}
              </p>

              <p>
                <strong>Código Vivendas:</strong> {pedido.codigo_vivendas}
              </p>

            </div>

            <div className="pedido-marmita">

              <h4>DETALHES DA MARMITA</h4>

              <p>🍚 {pedido.arroz}</p>
              <p>🫘 {pedido.feijao}</p>
              <p>🍗 {pedido.proteina}</p>
              <p>🥗 {pedido.guarnicao}</p>

              {pedido.observacao && (
                <p>
                  <strong>Observação:</strong> {pedido.observacao}
                </p>
              )}

            </div>

            <div className="pedido-dados">

              <p>
                <strong>Valor:</strong> R$ {Number(pedido.preco).toFixed(2)}
              </p>

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
