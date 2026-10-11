import { useEffect, useState } from 'react'
import './AcompanharPedido.css'
import { rotuloPagamento } from './formasPagamento'

// Etapas do fluxo de entrega para a linha do tempo (dot stepper)
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

function AcompanharPedido({ pedidoId, voltar }) {
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(false)

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

  useEffect(() => {
    if (!pedidoId) return
    buscarPedido()
    const intervalo = setInterval(buscarPedido, 5000)
    return () => clearInterval(intervalo)
  }, [pedidoId])

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

  const valorTotal = Number(pedido?.valor_cobrar || pedido?.preco || 0)
  const formaPagamentoTexto = pedido?.forma_pagamento
    ? rotuloPagamento(pedido.forma_pagamento)
    : 'Pagamento na entrega'

  const linkWhatsApp = `https://wa.me/5561994374490?text=${encodeURIComponent(
    `Olá! Gostaria de informações sobre o meu Pedido #${pedido?.id || pedidoId}.`
  )}`

  return (
    <div className="acompanhar-page">

      <header className="acompanhar-header">
        <h1>EL SHADDAY - RESTAURANTE</h1>
      </header>

      <main className="acompanhar-conteudo">

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
          </div>
        ) : (
          <>
            <span className="acompanhar-numero">
              Pedido #{pedido?.id || pedidoId}
            </span>

            <h2>
              {pedido?.status === 'pronto'
                ? 'Saiu para entrega'
                : pedido?.status === 'em_preparo' || pedido?.status === 'aprovado'
                ? 'Em preparo'
                : 'Aguardando aprovação'}
            </h2>

            <div className="acompanhar-previsao-pill">
              Previsão de entrega: 35 a 45 min
            </div>

            {/* DOT STEPPER (LINHA DO TEMPO MINIMALISTA) */}
            <div className="acompanhar-stepper">

              {ETAPAS.map((etapa, index) => {
                const conluida = index < indiceAtual
                const ativa = index === indiceAtual

                return (
                  <div className="acompanhar-passo" key={etapa.chave}>
                    {index < ETAPAS.length - 1 && (
                      <div
                        className={`stepper-linha ${
                          index < indiceAtual ? 'stepper-linha-completa' : ''
                        }`}
                      />
                    )}

                    <div
                      className={`stepper-dot ${
                        conluida
                          ? 'dot-concluido'
                          : ativa
                          ? 'dot-ativo'
                          : 'dot-pendente'
                      }`}
                    >
                      {conluida ? '✓' : ''}
                    </div>

                    <span
                      className={`stepper-texto ${
                        ativa
                          ? 'texto-ativo'
                          : conluida
                          ? 'texto-concluido'
                          : 'texto-pendente'
                      }`}
                    >
                      {etapa.label}
                    </span>
                  </div>
                )
              })}

            </div>

            {/* CARD DE INFORMAÇÕES DO PEDIDO */}
            <div className="acompanhar-info-box">
              <div className="acompanhar-info-linha">
                <span className="info-total">
                  Total a pagar: R$ {valorTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="acompanhar-info-linha">
                <span className="info-secundario">
                  Pagamento: {formaPagamentoTexto} na entrega
                </span>
              </div>

              {pedido?.tipo_entrega === 'entrega' && pedido?.endereco && (
                <div className="acompanhar-info-linha">
                  <span className="info-secundario">
                    Endereço de entrega: {pedido.endereco}
                  </span>
                </div>
              )}
            </div>

            {/* BOTÃO WHATSAPP */}
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="acompanhar-whatsapp-btn"
            >
              <IconeWhatsApp size={20} />
              Dúvidas? Falar no WhatsApp
            </a>
          </>
        )}

        {/* LINK VOLTAR AO INÍCIO */}
        <button
          type="button"
          onClick={voltar}
          className="acompanhar-voltar-link"
        >
          ← Voltar ao início
        </button>

      </main>

    </div>
  )
}

export default AcompanharPedido