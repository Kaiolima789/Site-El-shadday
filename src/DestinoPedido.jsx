import './DestinoPedido.css'

// Fotos ilustrativas (Unsplash, uso livre)
const FOTO_CLIENTE = 'https://images.unsplash.com/photo-1762631934518-f75e233413ca?auto=format&fit=crop&w=400&q=70'
const FOTO_VIVENDAS = 'https://images.unsplash.com/photo-1779808721968-040c94b6cfa3?auto=format&fit=crop&w=400&q=70'

function DestinoPedido({ pedido, voltar, clienteComum, vivendas }) {
  return (
    <div className="destino-page">

      <header className="destino-header">

        <button
          className="destino-voltar"
          onClick={voltar}
        >
          ←
        </button>

        <div className="destino-logo">
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

      </header>

      <main className="destino-conteudo">

        <div className="destino-icon">
          🍱
        </div>

        <h2>PARA QUEM É O PEDIDO?</h2>

        <p>
          Escolha como deseja continuar seu pedido.
        </p>

        <div className="destino-opcoes">

          <button
            className="destino-card cliente"
            onClick={clienteComum}
          >
            <img className="destino-card-foto" src={FOTO_CLIENTE} alt="" />

            <div>
              <h3>CLIENTE COMUM</h3>
              <p>Pedido normal para você.</p>
            </div>

            <span className="destino-seta">→</span>
          </button>

          <button
            className="destino-card vivendas"
            onClick={vivendas}
          >
            <img className="destino-card-foto" src={FOTO_VIVENDAS} alt="" />

            <div>
              <h3>VIVENDAS</h3>
              <p>Pedido destinado às Vivendas.</p>
            </div>

            <span className="destino-seta">→</span>
          </button>

        </div>

      </main>

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="nav-inferior">

        <button onClick={voltar} className="nav-item">
          <span>🏠</span>
          Início
        </button>

        <button className="nav-item nav-item-ativo">
          <span>🍱</span>
          Marmitas
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: pedidos para consumir no local.')}
        >
          <span>🏪</span>
          No Local
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: acompanhamento de pedidos por aqui.')}
        >
          <span>📋</span>
          Pedidos
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: seu perfil.')}
        >
          <span>👤</span>
          Perfil
        </button>

      </nav>

    </div>
  )
}

export default DestinoPedido
