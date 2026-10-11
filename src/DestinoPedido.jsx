import './DestinoPedido.css'

// ===== ÍCONES VETORIAIS (SVG OUTLINE) =====
function IconeClienteComum({ size = 22 }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconeVivendas({ size = 22 }) {
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
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}

function DestinoPedido({ pedido, voltar, clienteComum, vivendas }) {
  return (
    <div className="destino-page">

      <header className="destino-header">
        <div className="destino-logo">
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>
      </header>

      <main className="destino-conteudo">

        <h2>Para quem é o pedido?</h2>
        <p>Escolha como deseja continuar seu pedido.</p>

        <div className="destino-opcoes">

          <button
            type="button"
            className="destino-card"
            onClick={clienteComum}
          >
            <div className="destino-badge">
              <IconeClienteComum size={22} />
            </div>

            <div className="destino-card-info">
              <h3>Cliente Comum</h3>
              <p>Pedido para clientes normais</p>
            </div>

            <span className="destino-seta">→</span>
          </button>

          <button
            type="button"
            className="destino-card"
            onClick={vivendas}
          >
            <div className="destino-badge">
              <IconeVivendas size={22} />
            </div>

            <div className="destino-card-info">
              <h3>Vivendas</h3>
              <p>Pedido destinado a cliente Vivendas</p>
            </div>

            <span className="destino-seta">→</span>
          </button>

        </div>

        <button
          type="button"
          className="destino-voltar-link"
          onClick={voltar}
        >
          ← Voltar ao início
        </button>

      </main>

    </div>
  )
}

export default DestinoPedido