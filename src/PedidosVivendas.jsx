import { useEffect, useState } from 'react'
import './PedidosVivendas.css'
import './PedidosOrigem.css'
import { rotuloPagamento, textoTroco } from './formasPagamento'

function formatarHora(criadoEm) {
  if (!criadoEm) return ''
  const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')
  if (Number.isNaN(dataUtc.getTime())) return ''
  return dataUtc.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
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

function rotuloStatus(status) {
  const rotulos = {
    aguardando: 'Aguardando Aprovação',
    aprovado: 'Aprovado',
    em_preparo: 'Em Preparo',
    pronto: 'Pronto / Entrega',
    recusado: 'Recusado'
  }
  return rotulos[status] || status.toUpperCase()
}

function textoBebida(pedido) {
  const qtd = Number(pedido.bebida_quantidade) > 1
    ? `${pedido.bebida_quantidade}x `
    : ''

  if (pedido.refrigerante_sabor || pedido.refrigerante_tamanho) {
    const partes = [pedido.refrigerante_sabor, pedido.refrigerante_tamanho].filter(Boolean)
    return `${qtd}${partes.join(' - ')}`
  }

  if (pedido.agua_tipo) {
    return `${qtd}${pedido.agua_tipo}`
  }

  return null
}

function textoCarne(pedido) {
  return pedido.carne || pedido.proteina || ''
}

function ehClienteComum(pedido) {
  return pedido.origem === 'cliente_comum'
}

function rotuloOrigem(pedido) {
  return ehClienteComum(pedido) ? 'Cliente Comum' : 'Convênio Vivendas'
}

function formatarReais(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function rotuloEntrega(pedido) {
  return pedido.tipo_entrega === 'entrega' ? 'Entrega' : 'Retirada no local'
}

function textoCobranca(pedido) {
  const semValorSeparado =
    pedido.valor_cobrar === null || pedido.valor_cobrar === undefined

  if (semValorSeparado) {
    return `Total: ${formatarReais(pedido.preco)}`
  }

  if (ehClienteComum(pedido)) {
    return `Total a cobrar: ${formatarReais(pedido.valor_cobrar)}`
  }

  if (Number(pedido.valor_cobrar) > 0) {
    return `Total a cobrar: ${formatarReais(pedido.valor_cobrar)} (apenas a bebida)`
  }

  return 'Nada a cobrar — coberto pelo convênio Vivendas'
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
    const intervalo = setInterval(() => {
      carregarPedidos(false)
    }, 10000)
    return () => clearInterval(intervalo)
  }, [])

  async function aprovarPedido(pedido) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/pedidos/${pedido.id}/aprovar`,
        { method: 'PUT' }
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
        { method: 'PUT' }
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
        { method: 'PUT' }
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
        { method: 'PUT' }
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
      alert('O navegador bloqueou a janela de impressão. Permita pop-ups.')
      return
    }

    const bebida = textoBebida(pedido)
    const carne = textoCarne(pedido)

    const blocoCliente = ehClienteComum(pedido)
      ? `
        <p><strong>Cliente:</strong> ${pedido.nome}</p>
        <p><strong>Telefone:</strong> ${pedido.telefone || '-'}</p>
        <p><strong>Recebimento:</strong> ${rotuloEntrega(pedido)}</p>
        ${pedido.tipo_entrega === 'entrega' && pedido.endereco ? `<p><strong>Endereço:</strong> ${pedido.endereco}</p>` : ''}
      `
      : `
        <p><strong>Cliente:</strong> ${pedido.nome}</p>
        <p><strong>Loja:</strong> ${pedido.loja}</p>
        <p><strong>Cód. Vivendas:</strong> ${pedido.codigo_vivendas}</p>
      `

    const blocoPagamento = ehClienteComum(pedido)
      ? `<p class="total">Total a Pagar: ${formatarReais(pedido.valor_cobrar)}</p>`
      : Number(pedido.valor_cobrar) > 0
      ? `<p class="total">Bebida a Pagar: ${formatarReais(pedido.valor_cobrar)}</p>`
      : `<p class="total">Total: Grátis (Convênio)</p>`

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda #${pedido.id}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; }
            h1 { font-size: 14px; text-align: center; margin: 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            .total { font-weight: bold; font-size: 13px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>EL SHADDAY RESTAURANTE</h1>
          <p style="text-align:center;">Pedido #${pedido.id} — ${formatarHora(pedido.criado_em)}</p>
          <p style="text-align:center; font-weight:bold;">${rotuloOrigem(pedido).toUpperCase()}</p>
          <hr />
          ${blocoCliente}
          <hr />
          <p><strong>ITENS:</strong></p>
          ${carne ? `<p>• Proteína: ${carne}</p>` : ''}
          ${pedido.guarnicao ? `<p>• Guarnições: ${pedido.guarnicao}</p>` : ''}
          ${bebida ? `<p>• Bebida: ${bebida}</p>` : ''}
          ${pedido.observacao ? `<p>• Obs: ${pedido.observacao}</p>` : ''}
          <hr />
          ${blocoPagamento}
          <p style="text-align:center; font-size:10px; margin-top:10px;">${new Date().toLocaleString('pt-BR')}</p>
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()
    setTimeout(() => janela.print(), 250)
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

  return (
    <div className="pedidos-vivendas-page">

      <header className="admin-header">
        <div className="admin-header-esquerda">
          <h1>EL SHADDAY • PAINEL ADMIN</h1>
        </div>

        <div className="admin-header-direita">
          <label className="admin-status-toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-switch"></span>
            <span className="toggle-texto">Restaurante Aberto</span>
          </label>

          <button onClick={voltar} className="admin-sair-btn">
            Cardápio
          </button>
        </div>
      </header>

      <div className="admin-abas-nav">
        <button className="admin-aba-btn" onClick={voltar}>
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn admin-aba-ativa">
          Pedidos Recebidos ({contagem.aguardando})
        </button>
      </div>

      <main className="pedidos-vivendas-conteudo">

        <div className="pedidos-filtro-barra">
          <div className="pedidos-dia-nav">
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, -1))}
            >
              ←
            </button>
            <span>{formatarDataSelecionada(dataSelecionada)}</span>
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, 1))}
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
          >
            ⟳ Atualizar
          </button>
        </div>

        {carregando && <p className="pedidos-vazio">Carregando pedidos...</p>}

        {!carregando && pedidosFiltrados.length === 0 && (
          <div className="pedido-pendente pedido-vazio-card">
            <h3>Nenhum pedido aqui</h3>
            <p>
              {filtro === 'aguardando'
                ? 'Quando um cliente enviar um pedido, ele aparecerá aqui automaticamente.'
                : `Nenhum pedido marcado como "${rotuloStatus(filtro)}".`}
            </p>
          </div>
        )}

        {pedidosFiltrados.map((pedido) => {
          const carne = textoCarne(pedido)
          const bebida = textoBebida(pedido)
          const telLimpo = pedido.telefone ? pedido.telefone.replace(/\D/g, '') : ''

          return (
            <div className={`pedido-card pedido-${pedido.status}`} key={pedido.id}>

              <div className="pedido-cabecalho">
                <div className="pedido-id-linha">
                  <h3>
                    Pedido #{pedido.id}{' '}
                    <span className="pedido-hora">• {formatarHora(pedido.criado_em)}</span>
                  </h3>
                </div>

                <div className="pedido-tags">
                  <span className={`pedido-status-badge status-${pedido.status}`}>
                    {rotuloStatus(pedido.status)}
                  </span>

                  <span className="pedido-origem-badge">
                    {rotuloOrigem(pedido)}
                  </span>
                </div>
              </div>

              <div className="pedido-cliente-bloco">
                <div className="cliente-linha-principal">
                  <p>
                    <strong>Cliente:</strong> {pedido.nome}
                  </p>

                  {telLimpo && (
                    <a
                      href={`https://wa.me/55${telLimpo}?text=${encodeURIComponent(
                        `Olá, ${pedido.nome}! Estamos com seu pedido #${pedido.id} no Restaurante El Shadday.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-contato-btn"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>

                {ehClienteComum(pedido) ? (
                  <>
                    <p>
                      <strong>Telefone:</strong> {pedido.telefone || '-'}
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

              <div className="pedido-itens-bloco">
                <h4>DETALHES DA MARMITA</h4>
                {carne && <p>• <strong>Proteína:</strong> {carne}</p>}
                {pedido.guarnicao && <p>• <strong>Guarnições:</strong> {pedido.guarnicao}</p>}
                {bebida && <p>• <strong>Bebida:</strong> {bebida}</p>}
                {pedido.observacao && (
                  <p className="pedido-obs">
                    • <strong>Observação:</strong> {pedido.observacao}
                  </p>
                )}
              </div>

              <div className="pedido-cobranca-bloco">
                <p>
                  <strong>{textoCobranca(pedido)}</strong>
                  {pedido.forma_pagamento && ` • Pagamento: ${rotuloPagamento(pedido.forma_pagamento)} na entrega`}
                </p>
                {pedido.forma_pagamento === 'dinheiro' && pedido.troco_para && (
                  <p className="pedido-troco-info">{textoTroco(pedido)}</p>
                )}
              </div>

              <div className="pedido-acoes-barra">
                {pedido.status === 'aguardando' && (
                  <>
                    <button
                      type="button"
                      className="btn-aprovar"
                      onClick={() => aprovarPedido(pedido)}
                    >
                      ✓ Aprovar Pedido
                    </button>
                    <button
                      type="button"
                      className="btn-recusar"
                      onClick={() => recusarPedido(pedido.id)}
                    >
                      ✕ Recusar
                    </button>
                  </>
                )}

                {pedido.status === 'aprovado' && (
                  <button
                    type="button"
                    className="btn-preparo"
                    onClick={() => marcarEmPreparo(pedido.id)}
                  >
                    Iniciar Preparo →
                  </button>
                )}

                {pedido.status === 'em_preparo' && (
                  <button
                    type="button"
                    className="btn-pronto"
                    onClick={() => marcarPronto(pedido.id)}
                  >
                    Marcar como Pronto / Saiu para Entrega →
                  </button>
                )}

                <button
                  type="button"
                  className="btn-imprimir"
                  onClick={() => imprimirPedido(pedido)}
                >
                  🖨️ Imprimir comanda
                </button>
              </div>

            </div>
          )
        })}

      </main>

    </div>
  )
}

export default PedidosVivendas