import { useEffect, useState, useRef } from 'react'
import './AcompanharPedido.css'
import { rotuloPagamento } from './formasPagamento'

// Etapas do fluxo de entrega para a linha do tempo (dot stepper vertical Figma)
const ETAPAS = [
  { chave: 'recebido', label: 'Pedido recebido' },
  { chave: 'aguardando', label: 'Aguardando aprovação' },
  { chave: 'em_preparo', label: 'Em preparo' },
  { chave: 'saiu', label: 'Saiu para entrega' }
]

function IconeWhatsApp({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.21 8.21 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.12.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.47c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.31z" />
    </svg>
  )
}

function IconeSino({ size = 16 }) {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// ===== 1. ALERTA SONORO (WEB AUDIO API NATIVO, 100% OFFLINE) =====
function tocarSomNotificacao() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Primeiro toque suave (D5 -> A5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
    gain1.gain.setValueAtTime(0.25, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start()
    osc1.stop(ctx.currentTime + 0.3)

    // Segundo toque harmônico (A5 -> D6)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, ctx.currentTime)
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2)
        gain2.gain.setValueAtTime(0.3, ctx.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.45)
      } catch (e) {}
    }, 130)
  } catch (e) {
    console.error('Erro ao tocar som:', e)
  }
}

// ===== 2. NOTIFICAÇÃO NATIVA DO NAVEGADOR =====
function dispararNotificacaoNativa(titulo, corpo) {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(titulo, {
          body: corpo,
          icon: '/favicon.svg'
        })
      }
    }
  } catch (e) {
    console.error('Erro na notificação nativa:', e)
  }
}

function AcompanharPedido({ pedidoId, pedidoInicial, voltar }) {
  const [pedido, setPedido] = useState(pedidoInicial || null)
  const [erro, setErro] = useState(false)
  const [permissaoNotificacao, setPermissaoNotificacao] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  )

  const statusAnteriorRef = useRef(pedidoInicial?.status || null)

  // Recupera pedido salvo no navegador em caso de recarregamento
  const pedidoSalvo = (typeof window !== 'undefined' && localStorage.getItem('ultimo_pedido'))
    ? JSON.parse(localStorage.getItem('ultimo_pedido'))
    : null

  const pedidoReferencia = pedidoInicial || pedidoSalvo

  // Solicita permissão de notificação nativa ao abrir a tela
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermissaoNotificacao(perm)
        }).catch(() => {})
      }
    }
  }, [])

  async function pedirPermissaoManual() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      setPermissaoNotificacao(perm)
      if (perm === 'granted') {
        tocarSomNotificacao()
        dispararNotificacaoNativa(
          '🔔 Notificações ativadas!',
          'Você será avisado assim que sua marmita sair para entrega.'
        )
      }
    }
  }

  async function buscarPedido() {
    try {
      const resposta = await fetch(`http://localhost:3000/pedidos/${pedidoId}`)
      if (!resposta.ok) {
        throw new Error('Pedido não encontrado')
      }
      const dados = await resposta.json()
      setPedido(dados)
      setErro(false)
    } catch (e) {
      console.error(e)
      setErro(true)
    }
  }

  // Polling automático a cada 5 segundos
  useEffect(() => {
    if (!pedidoId) return
    buscarPedido()
    const intervalo = setInterval(buscarPedido, 5000)
    return () => clearInterval(intervalo)
  }, [pedidoId])

  // Monitora a mudança de status para disparar som e notificação
  useEffect(() => {
    if (!pedido?.status) return
    const statusAtual = pedido.status
    const statusAnterior = statusAnteriorRef.current

    if (statusAnterior && statusAnterior !== statusAtual) {
      // Toca som de aviso suave
      tocarSomNotificacao()

      // Dispara a notificação de acordo com o novo status
      if (statusAtual === 'pronto') {
        dispararNotificacaoNativa(
          '🚀 Seu pedido saiu para entrega!',
          `Pedido #${pedido.id || pedidoId}: O entregador do El Shadday já está a caminho!`
        )
      } else if (statusAtual === 'em_preparo') {
        dispararNotificacaoNativa(
          '👨‍🍳 Seu pedido está em preparo!',
          `Pedido #${pedido.id || pedidoId}: Nossa cozinha já começou a montar sua marmita.`
        )
      } else if (statusAtual === 'aprovado') {
        dispararNotificacaoNativa(
          '✓ Pedido confirmado!',
          `Pedido #${pedido.id || pedidoId}: O restaurante confirmou o seu pedido.`
        )
      }
    }

    statusAnteriorRef.current = statusAtual
  }, [pedido?.status, pedidoId])

  function obterIndiceEtapa() {
    if (!pedido) return 1
    const st = pedido.status
    if (st === 'aguardando') return 1
    if (st === 'aprovado' || st === 'em_preparo') return 2
    if (st === 'pronto') return 3
    return 1
  }

  const indiceAtual = obterIndiceEtapa()
  const foiRecusado = pedido?.status === 'recusado'

  function calcularTotalReal() {
    // Se for convênio Vivendas sem bebida
    if (pedido?.origem === 'vivendas' || pedidoReferencia?.origem === 'vivendas') {
      const b = Number(pedido?.valor_cobrar || pedido?.preco_bebida || pedidoReferencia?.preco_bebida || 0)
      return b > 0 ? b : 0
    }

    // 1. Tenta valor_cobrar positivo do banco
    if (pedido?.valor_cobrar && Number(pedido.valor_cobrar) > 0) {
      return Number(pedido.valor_cobrar)
    }

    // 2. Tenta valor_cobrar do pedido inicial gravado no frontend
    if (pedidoReferencia?.valor_cobrar && Number(pedidoReferencia.valor_cobrar) > 0) {
      return Number(pedidoReferencia.valor_cobrar)
    }

    // 3. Tenta preco positivo do banco ou do frontend
    if (pedido?.preco && Number(pedido.preco) > 0) {
      return Number(pedido.preco)
    }
    if (pedidoReferencia?.preco && Number(pedidoReferencia.preco) > 0) {
      return Number(pedidoReferencia.preco)
    }

    // 4. Se o banco retornou 0 para cliente comum, reconstrói o cálculo
    const marmita = Number(pedido?.preco_marmita || pedidoReferencia?.preco_marmita || 18.0)
    const bebida = Number(pedido?.preco_bebida || pedidoReferencia?.preco_bebida || 0.0)
    const taxa = (pedido?.tipo_entrega === 'retirada' || pedidoReferencia?.tipo_entrega === 'retirada') ? 0.0 : 4.0
    return marmita + bebida + taxa
  }

  const valorTotal = calcularTotalReal()

  function formatarFormaPagamento(forma) {
    if (!forma) return 'Pagamento na entrega'
    const f = String(forma).toLowerCase()
    if (f === 'pix') return 'Pix na entrega'
    if (f === 'credito') return 'Crédito na entrega'
    if (f === 'debito') return 'Débito na entrega'
    if (f === 'dinheiro') return 'Dinheiro na entrega'
    return rotuloPagamento(forma) + ' na entrega'
  }

  const formaPagamentoTexto = formatarFormaPagamento(pedido?.forma_pagamento || pedidoReferencia?.forma_pagamento)

  const linkWhatsApp = `https://wa.me/5561994374490?text=${encodeURIComponent(
    `Olá! Gostaria de informações sobre o meu Pedido #${pedido?.id || pedidoId}.`
  )}`

  return (
    <div className="acompanhar-page">

      {/* CABEÇALHO */}
      <header className="acompanhar-header">
        <h1>EL SHADDAY - RESTAURANTE</h1>
      </header>

      {/* CARD CENTRAL BRANCO FIGMA */}
      <main className="acompanhar-card">

        {erro && (
          <div className="acompanhar-aviso">
            <p>Conectando ao pedido...</p>
          </div>
        )}

        {foiRecusado ? (
          <div className="acompanhar-recusado">
            <h2>Pedido não aprovado</h2>
            <p>
              Infelizmente seu pedido não pôde ser aprovado. Entre em contato com
              o restaurante para mais detalhes.
            </p>
            <button type="button" className="acompanhar-voltar-btn" onClick={voltar}>
              ← Voltar ao início
            </button>
          </div>
        ) : (
          <>
            <span className="acompanhar-numero">
              Pedido #{pedido?.id || pedidoId}
            </span>

            <h2 className="acompanhar-titulo">
              {indiceAtual === 1 && 'Aguardando aprovação'}
              {indiceAtual === 2 && 'Em preparo'}
              {indiceAtual === 3 && 'Saiu para entrega'}
            </h2>

            <div className="acompanhar-previsao-pill">
              Previsão de entrega: 35 a 45 min
            </div>

            {/* AVISO PARA ATIVAR NOTIFICAÇÕES (CASO AINDA NÃO AUTORIZADO) */}
            {permissaoNotificacao === 'default' && (
              <button
                type="button"
                className="acompanhar-notif-btn"
                onClick={pedirPermissaoManual}
                title="Clique para receber aviso quando o motoboy sair"
              >
                <IconeSino size={14} />
                <span>Ativar notificações de entrega</span>
              </button>
            )}

            {/* DOT STEPPER (LINHA DO TEMPO VERTICAL FIGMA) */}
            <div className="acompanhar-stepper">
              {ETAPAS.map((etapa, idx) => {
                const conluida = idx < indiceAtual
                const ativa = idx === indiceAtual

                return (
                  <div className="stepper-item" key={etapa.chave}>
                    <div className="stepper-trilho">
                      <div
                        className={`stepper-dot ${
                          conluida ? 'dot-concluido' : ativa ? 'dot-ativo' : 'dot-pendente'
                        }`}
                      >
                        {conluida && <span className="check-icon">✓</span>}
                      </div>
                      {idx < ETAPAS.length - 1 && (
                        <div
                          className={`stepper-linha ${conluida ? 'linha-concluida' : ''}`}
                        />
                      )}
                    </div>
                    <span
                      className={`stepper-label ${
                        ativa ? 'label-ativa' : conluida ? 'label-concluida' : 'label-pendente'
                      }`}
                    >
                      {etapa.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CARD CREME DE INFORMAÇÕES DO PEDIDO */}
            <div className="acompanhar-info-box">
              <div className="info-total">
                {pedido?.origem === 'vivendas' && valorTotal === 0
                  ? 'Total a pagar: R$ 0,00'
                  : `Total a pagar: R$ ${valorTotal.toFixed(2).replace('.', ',')}`}
              </div>

              <div className="info-secundario">
                Pagamento: {formaPagamentoTexto}
              </div>

              {(pedido?.tipo_entrega === 'entrega' || pedidoReferencia?.tipo_entrega === 'entrega') && (pedido?.endereco || pedidoReferencia?.endereco) && (
                <div className="info-secundario">
                  Endereço de entrega: {pedido?.endereco || pedidoReferencia?.endereco}
                </div>
              )}
            </div>

            {/* BOTÃO VERDE WHATSAPP */}
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="acompanhar-whatsapp-btn"
            >
              <IconeWhatsApp size={18} />
              <span>Dúvidas? Falar no WhatsApp</span>
            </a>

            {/* LINK VOLTAR AO INÍCIO */}
            <button type="button" className="acompanhar-voltar-btn" onClick={voltar}>
              ← Voltar ao início
            </button>
          </>
        )}

      </main>

    </div>
  )
}

export default AcompanharPedido