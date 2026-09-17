import { useEffect, useState } from 'react'
import './AcompanharPedido.css'

// Ordem das etapas do fluxo normal (fora o caso de recusa)
const ETAPAS = [
  { chave: 'aguardando', label: 'Aguardando aprovação', icone: '🕐' },
  { chave: 'aprovado', label: 'Pedido aprovado', icone: '👍' },
  { chave: 'em_preparo', label: 'Em preparo', icone: '👨‍🍳' },
  { chave: 'pronto', label: 'Pronto', icone: '🍱' }
]

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

    // Consulta o status a cada 5s, sem precisar recarregar a página
    const intervalo = setInterval(buscarPedido, 5000)

    return () => clearInterval(intervalo)
  }, [pedidoId])

  const indiceAtual = pedido
    ? ETAPAS.findIndex((etapa) => etapa.chave === pedido.status)
    : -1

  const foiRecusado = pedido?.status === 'recusado'

  return (
    <div className="acompanhar-page">

      <header className="acompanhar-header">
        <h1>EL SHADDAY</h1>
        <span>— RESTAURANTE —</span>
      </header>

      <main className="acompanhar-conteudo">

        {erro && (
          <div className="acompanhar-aviso">
            <p>Não foi possível consultar seu pedido agora. Tentando de novo...</p>
          </div>
        )}

        {!pedido && !erro && (
          <p>Carregando status do pedido...</p>
        )}

        {pedido && foiRecusado && (
          <div className="acompanhar-recusado">
            <div className="acompanhar-icon-grande">✕</div>
            <h2>Pedido não aprovado</h2>
            <p>
              Infelizmente seu pedido não pôde ser aprovado desta vez.
              Entre em contato com o restaurante para mais detalhes.
            </p>
          </div>
        )}

        {pedido && !foiRecusado && (
          <>
            <div className="acompanhar-icon-grande">
              {ETAPAS[indiceAtual]?.icone || '🕐'}
            </div>

            <h2>{ETAPAS[indiceAtual]?.label || 'Aguardando aprovação'}</h2>

            <p className="acompanhar-numero">
              Pedido #{pedido.id}
            </p>

            <div className="acompanhar-linha">

              {ETAPAS.map((etapa, index) => (
                <div className="acompanhar-etapa" key={etapa.chave}>

                  <div
                    className={`acompanhar-bolinha ${
                      index <= indiceAtual ? 'acompanhar-bolinha-ativa' : ''
                    }`}
                  >
                    {index < indiceAtual ? '✓' : etapa.icone}
                  </div>

                  <span
                    className={
                      index <= indiceAtual ? 'acompanhar-label-ativa' : ''
                    }
                  >
                    {etapa.label}
                  </span>

                  {index < ETAPAS.length - 1 && (
                    <div
                      className={`acompanhar-conector ${
                        index < indiceAtual ? 'acompanhar-conector-ativo' : ''
                      }`}
                    />
                  )}

                </div>
              ))}

            </div>

            {pedido.status === 'pronto' && (
              <p className="acompanhar-pronto-msg">
                Seu pedido está pronto! 🎉
              </p>
            )}
          </>
        )}

        <button
          onClick={voltar}
          className="acompanhar-voltar-btn"
        >
          ← VOLTAR PARA O INÍCIO
        </button>

      </main>

    </div>
  )
}

export default AcompanharPedido
