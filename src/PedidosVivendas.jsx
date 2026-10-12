import { useEffect, useState } from 'react'
import './PedidosVivendas.css'
import { rotuloPagamento, textoTroco } from './formasPagamento'

const API_URL = 'https://site-el-shadday.onrender.com'

function formatarHora(criadoEm) {
  if (!criadoEm) return ''
  const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')
  if (Number.isNaN(dataUtc.getTime())) return ''
  return dataUtc.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function tempoDecorrido(criadoEm) {
  if (!criadoEm) return 'há 1 min'
  try {
    const agora = new Date()
    const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')
    const diffMs = agora - dataUtc
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin <= 1) return 'há 1 min'
    if (diffMin < 60) return `há ${diffMin} min`
    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras === 1) return 'há 1 hora'
    return `há ${diffHoras} horas`
  } catch (e) {
    return 'recente'
  }
}

function dataLocalDoPedido(criadoEm) {
  if (!criadoEm) return ''
  const d = new Date(criadoEm.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return ''
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function hojeLocal() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarDataSelecionada(dataStr) {
  const [ano, mes, dia] = dataStr.split('-')
  if (dataStr === hojeLocal()) return `Hoje, ${dia}/${mes}`
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  const ontemStr = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`
  if (dataStr === ontemStr) return `Ontem, ${dia}/${mes}`
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

function limparTexto(texto) {
  if (!texto) return ''
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '-')
}

function rotuloStatus(status) {
  const rotulos = {
    aguardando: 'Aguardando Aprovação',
    aprovado: 'Aprovado',
    em_preparo: 'Em Preparo',
    pronto: 'Prontos / Entrega',
    recusado: 'Recusado'
  }
  return rotulos[status] || status
}

function formatarReais(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function formatarTelefone(tel) {
  if (!tel) return ''
  const num = tel.replace(/\D/g, '')
  if (num.length === 11) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`
  }
  if (num.length === 10) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`
  }
  return tel
}

function ehClienteComum(pedido) {
  return pedido.origem === 'cliente_comum'
}

function rotuloOrigem(pedido) {
  return ehClienteComum(pedido) ? 'Cliente Comum' : 'Vivendas'
}

function textoCarne(pedido) {
  return pedido.carne || pedido.opcao_carne || ''
}

function textoBebida(pedido) {
  const partes = []
  if (pedido.refrigerante_sabor) {
    const tamanho = pedido.refrigerante_tamanho ? ` - ${pedido.refrigerante_tamanho}` : ''
    partes.push(`${pedido.refrigerante_sabor}${tamanho}`)
  }
  if (pedido.agua_tipo) {
    partes.push(pedido.agua_tipo)
  }
  return partes.join(' + ')
}

function textoFaixaCobranca(pedido) {
  const total = Number(pedido.valor_cobrar !== undefined && pedido.valor_cobrar !== null ? pedido.valor_cobrar : pedido.preco || 0)
  const forma = pedido.forma_pagamento ? rotuloPagamento(pedido.forma_pagamento) : 'na entrega'

  if (!ehClienteComum(pedido) && total === 0) {
    return 'Total a cobrar: R$ 0,00 • Marmita coberta pelo convênio Vivendas'
  }

  let texto = `Total a cobrar: ${formatarReais(total)} • Pagamento na entrega: ${forma}`
  if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
    const levar = Number(pedido.troco_para) - total
    if (levar > 0) {
      texto += ` (Levar troco para ${formatarReais(pedido.troco_para)})`
    }
  }
  return texto
}

function PedidosVivendas({ voltar }) {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('aguardando')
  const [dataSelecionada, setDataSelecionada] = useState(hojeLocal())

  async function carregarPedidos(mostrarErro = true) {
    try {
      const resposta = await fetch(`${API_URL}/pedidos`)
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
    const intervalo = setInterval(() => {
      carregarPedidos(false)
    }, 8000)
    return () => clearInterval(intervalo)
  }, [])

  async function aprovarPedido(pedido) {
    try {
      const resposta = await fetch(
        `${API_URL}/pedidos/${pedido.id}/aprovar`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao aprovar pedido.')
        return
      }
      imprimirPedido({ ...pedido, status: 'aprovado' })
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function recusarPedido(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/pedidos/${id}/recusar`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao recusar pedido.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarEmPreparo(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/pedidos/${id}/preparo`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar status.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarPronto(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/pedidos/${id}/pronto`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar status.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  function imprimirPedido(pedido) {
    const janela = window.open('', '_blank', 'width=350,height=600')
    if (!janela) return

    const carne = textoCarne(pedido)
    const bebida = textoBebida(pedido)
    const total = Number(pedido.valor_cobrar !== undefined && pedido.valor_cobrar !== null ? pedido.valor_cobrar : pedido.preco || 0)

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Comanda #${pedido.id}</title>
          <style>
            @page {
              margin: 0;
            }
            @media print {
              html, body {
                width: 48mm;
                max-width: 48mm;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              width: 48mm;
              max-width: 48mm;
              margin: 0;
              padding: 2mm 1mm;
            }
            .cabecalho {
              text-align: center;
              margin-bottom: 2px;
            }
            .titulo {
              font-size: 12px;
              font-weight: bold;
              letter-spacing: -0.5px;
            }
            .subtitulo {
              font-size: 11px;
            }
            .origem {
              font-weight: bold;
              font-size: 11px;
            }
            .divisor {
              letter-spacing: -1px;
              overflow: hidden;
              white-space: nowrap;
              margin: 3px 0;
              font-size: 10px;
            }
            .item-linha {
              margin: 2px 0;
              word-break: break-word;
            }
            .total {
              font-weight: bold;
              font-size: 12px;
              text-align: right;
              margin-top: 3px;
            }
            .rodape {
              text-align: center;
              font-size: 9px;
              margin-top: 4px;
              padding-bottom: 2mm;
            }
          </style>
        </head>
        <body>
          <div class="cabecalho">
            <div class="titulo">EL SHADDAY RESTAURANTE</div>
            <div class="subtitulo">Pedido #${pedido.id} - ${formatarHora(pedido.criado_em)}</div>
            <div class="origem">${limparTexto(rotuloOrigem(pedido).toUpperCase())}</div>
          </div>

          <div class="divisor">--------------------------------</div>

          <div class="item-linha"><strong>Cliente:</strong> ${limparTexto(pedido.nome)}</div>
          <div class="item-linha"><strong>Telefone:</strong> ${formatarTelefone(pedido.telefone) || '-'}</div>
          ${ehClienteComum(pedido) && pedido.tipo_entrega === 'entrega' ? `<div class="item-linha"><strong>Endereco:</strong> ${limparTexto(pedido.endereco)}</div>` : ''}
          ${ehClienteComum(pedido) && pedido.tipo_entrega === 'retirada' ? `<div class="item-linha"><strong>Entrega:</strong> Retirada no local</div>` : ''}
          ${!ehClienteComum(pedido) ? `<div class="item-linha"><strong>Loja:</strong> ${limparTexto(pedido.loja)} - <strong>Codigo:</strong>${limparTexto(pedido.codigo_vivendas)}</div>` : ''}

          <div class="divisor">--------------------------------</div>

          <div class="item-linha"><strong>ITENS:</strong></div>
          ${carne ? `<div class="item-linha">- Proteina: ${limparTexto(carne)}</div>` : ''}
          ${pedido.guarnicao ? `<div class="item-linha">- Guarnicoes: ${limparTexto(pedido.guarnicao)}</div>` : ''}
          ${bebida ? `<div class="item-linha">- Bebida: ${limparTexto(bebida)}</div>` : ''}
          ${pedido.observacao ? `<div class="item-linha">- Obs: ${limparTexto(pedido.observacao)}</div>` : ''}

          <div class="divisor">--------------------------------</div>

          <div class="total">TOTAL A PAGAR: ${formatarReais(total)}</div>
          ${pedido.forma_pagamento ? `<div class="item-linha">Pagamento: ${limparTexto(rotuloPagamento(pedido.forma_pagamento))}</div>` : ''}

          <div class="divisor">--------------------------------</div>
          <div class="rodape">${new Date().toLocaleString('pt-BR')}</div>
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()
    setTimeout(() => {
      janela.print()
    }, 350)
  }

  // Pedidos que exigem ação da cozinha (aguardando ou em preparo) NUNCA ficam ocultos por data
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtro === 'aguardando') {
      return pedido.status === 'aguardando'
    }
    if (filtro === 'em_preparo') {
      return pedido.status === 'em_preparo' || pedido.status === 'aprovado'
    }
    // Histórico (prontos e recusados) filtra pelo dia selecionado
    const dataPedido = dataLocalDoPedido(pedido.criado_em)
    const mesmoDia = dataPedido === dataSelecionada || !dataPedido
    return mesmoDia && pedido.status === filtro
  })

  const contagem = {
    aguardando: pedidos.filter((p) => p.status === 'aguardando').length,
    em_preparo: pedidos.filter((p) => p.status === 'em_preparo' || p.status === 'aprovado').length,
    pronto: pedidos.filter((p) => p.status === 'pronto' && (dataLocalDoPedido(p.criado_em) === dataSelecionada || !p.criado_em)).length,
    recusado: pedidos.filter((p) => p.status === 'recusado' && (dataLocalDoPedido(p.criado_em) === dataSelecionada || !p.criado_em)).length
  }

  return (
    <div className="pedidos-vivendas-page">

      {/* 1. HEADER SUPERIOR FIGMA */}
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

          <button onClick={voltar} className="admin-sair-btn" title="Voltar ao Cardápio">
            <span>👤</span>
            <span>Admin</span>
          </button>
        </div>
      </header>

      {/* 2. ABAS CENTRAIS FIGMA (GERENCIAR CARDÁPIO | PEDIDOS RECEBIDOS) */}
      <div className="admin-abas-nav">
        <button className="admin-aba-btn" onClick={voltar}>
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn admin-aba-ativa">
          Pedidos Recebidos ({contagem.aguardando})
        </button>
      </div>

      <main className="pedidos-vivendas-conteudo">

        {/* 3. BARRA DE FILTROS FIGMA */}
        <div className="pedidos-filtro-barra">
          <div className="pedidos-dia-nav">
            <span>📅 {formatarDataSelecionada(dataSelecionada)}</span>
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, -1))}
              title="Dia anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, 1))}
              title="Próximo dia"
            >
              →
            </button>
          </div>

          <div className="pedidos-abas">
            <button
              className={`aba-btn ${filtro === 'aguardando' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('aguardando')}
            >
              Aguardando ({contagem.aguardando})
            </button>

            <button
              className={`aba-btn ${filtro === 'em_preparo' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('em_preparo')}
            >
              Em Preparo ({contagem.em_preparo})
            </button>

            <button
              className={`aba-btn ${filtro === 'pronto' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('pronto')}
            >
              Prontos / Entrega ({contagem.pronto})
            </button>

            <button
              className={`aba-btn ${filtro === 'recusado' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('recusado')}
            >
              Recusados ({contagem.recusado})
            </button>
          </div>

          <button
            type="button"
            className="atualizar-btn"
            onClick={() => carregarPedidos(true)}
            title="Atualizar lista de pedidos"
          >
            <span>⟳</span>
            <span>Atualizar</span>
          </button>
        </div>

        {carregando && <p className="pedidos-vazio-card">Carregando pedidos...</p>}

        {!carregando && pedidosFiltrados.length === 0 && (
          <div className="pedido-vazio-card">
            <h3>Nenhum pedido encontrado</h3>
            <p>Não há pedidos com status &quot;{rotuloStatus(filtro)}&quot; para esta data.</p>
          </div>
        )}

        {/* 4. CARDS DE PEDIDO FIGMA */}
        <div className="pedidos-grid">
          {pedidosFiltrados.map((pedido) => {
            const carne = textoCarne(pedido)
            const bebida = textoBebida(pedido)
            const telLimpo = pedido.telefone ? pedido.telefone.replace(/\D/g, '') : ''

            return (
              <div className="pedido-card" key={pedido.id}>

                {/* TOPO: TÍTULO COM TEMPO DECORRIDO E BADGES */}
                <div className="pedido-card-cabecalho">
                  <div className="pedido-titulo-linha">
                    Pedido #{pedido.id} • {formatarHora(pedido.criado_em)} ({tempoDecorrido(pedido.criado_em)})
                  </div>

                  <div className="pedido-tags-linha">
                    <span className={`badge-status-${pedido.status}`}>
                      {rotuloStatus(pedido.status)}
                    </span>

                    <span className={`badge-origem-${ehClienteComum(pedido) ? 'comum' : 'vivendas'}`}>
                      {rotuloOrigem(pedido)}
                    </span>
                  </div>
                </div>

                {/* CAIXA CREME DO CLIENTE */}
                <div className="pedido-cliente-caixa">
                  <div className="cliente-topo-linha">
                    <span className="cliente-dados-linha">
                      Cliente: {pedido.nome} {telLimpo && `• ${formatarTelefone(pedido.telefone)}`}
                    </span>

                    {telLimpo && (
                      <a
                        href={`https://wa.me/55${telLimpo}?text=${encodeURIComponent(
                          `Olá, ${pedido.nome}! Estamos com seu pedido #${pedido.id} no Restaurante El Shadday.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-figma"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="cliente-endereco-linha">
                    {ehClienteComum(pedido) ? (
                      <span>
                        Endereço: {pedido.tipo_entrega === 'entrega' ? pedido.endereco || 'Entrega' : 'Retirada no local'}
                      </span>
                    ) : (
                      <span>
                        Loja: {pedido.loja || '-'} • Código: {pedido.codigo_vivendas || pedido.codigo || '-'}
                      </span>
                    )}
                  </div>
                </div>

                {/* DETALHES DA MARMITA */}
                <div className="pedido-detalhes-bloco">
                  <span className="detalhes-titulo">DETALHES DA MARMITA</span>
                  {carne && <p>Proteína: {carne}</p>}
                  {pedido.guarnicao && <p>Guarnições: {pedido.guarnicao}</p>}
                  {bebida && <p>Bebida: {bebida}</p>}
                  {pedido.observacao && <p>Observação: {pedido.observacao}</p>}
                </div>

                {/* FAIXA AZUL DE COBRANÇA */}
                <div className="pedido-cobranca-faixa">
                  {textoFaixaCobranca(pedido)}
                </div>

                {/* BOTÕES DE AÇÃO NA BASE */}
                <div className="pedido-acoes-botoes">
                  {pedido.status === 'aguardando' && (
                    <>
                      <button
                        type="button"
                        className="btn-aprovar-figma"
                        onClick={() => aprovarPedido(pedido)}
                      >
                        ✓ Aprovar Pedido
                      </button>
                      <button
                        type="button"
                        className="btn-recusar-figma"
                        onClick={() => recusarPedido(pedido.id)}
                      >
                        ✕ Recusar
                      </button>
                    </>
                  )}

                  {pedido.status === 'aprovado' && (
                    <button
                      type="button"
                      className="btn-preparo-figma"
                      onClick={() => marcarEmPreparo(pedido.id)}
                    >
                      👨‍🍳 Iniciar Preparo →
                    </button>
                  )}

                  {pedido.status === 'em_preparo' && (
                    <button
                      type="button"
                      className="btn-pronto-figma"
                      onClick={() => marcarPronto(pedido.id)}
                    >
                      🚀 Pronto / Saiu para Entrega →
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-imprimir-figma"
                    onClick={() => imprimirPedido(pedido)}
                  >
                    🖨 Imprimir comanda
                  </button>
                </div>

              </div>
            )
          })}
        </div>

      </main>

    </div>
  )
}

export default PedidosVivendas