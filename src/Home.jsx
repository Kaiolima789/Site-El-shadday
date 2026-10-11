import './Home.css'

// Ícones SVG minimalistas
function MapPin({ size = 14, ...props }) {
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
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function Phone({ size = 16, ...props }) {
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
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function Clock({ size = 16, ...props }) {
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
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const TELEFONE = '(61) 99437-4490'
const WHATSAPP_LINK = 'https://wa.me/5561994374490'
const ENDERECO =
  'QR 202 Conjunto E, 3 - Santa Maria, Brasília - DF, 72502-409'
const GOOGLE_MAPS_LINK =
  'https://www.google.com/maps/search/?api=1&query=QR+202+Conjunto+E,+3+-+Santa+Maria,+Bras%C3%ADlia+-+DF,+72502-409'
const FUNCIONAMENTO = 'Segunda a Sábado, das 11:00 às 14:00'

function Home({ irParaPedido }) {
  return (
    <div className="home-page">

      {/* ===== HEADER COM LOGO CENTRALIZADO ===== */}
      <header className="home-header">
        <div className="home-container home-header-inner">

          {/* Espaçadores laterais para manter o logo perfeitamente centralizado */}
          <div className="home-header-spacer"></div>

          <div className="home-logo">
            <span className="home-logo-nome">EL SHADDAY</span>
            <span className="home-logo-sub">— RESTAURANTE —</span>
          </div>

          <div className="home-header-spacer"></div>

        </div>
      </header>

      <main>

        {/* ===== HERO ===== */}
        <section className="home-hero">
          <div className="home-container home-hero-inner">

            <div className="home-hero-texto">

              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="home-localizacao"
                title="Abrir no Google Maps"
              >
                <MapPin size={14} aria-hidden="true" />
                Santa Maria, Brasília
              </a>

              <h1>Comida feita com carinho, pronta pra você</h1>

              <p className="home-hero-sub">
                Sabor caseiro preparado todos os dias para você.
              </p>

              <button
                type="button"
                className="home-btn-pedido"
                onClick={irParaPedido}
              >
                Fazer Pedido
              </button>

            </div>

            <div className="home-hero-imagem-wrap">
              <img
                src="/assets/marmita1.jpeg"
                alt="Marmita apetitosa servida pelo El Shadday Restaurante"
                className="home-hero-imagem"
              />
            </div>

          </div>
        </section>

        {/* ===== DESTAQUES ===== */}
        <section className="home-destaques">
          <div className="home-container">

            <div className="home-destaques-grid">

              <div className="home-destaque-card">
                <h3>Comida Caseira de Verdade</h3>
                <p>
                  Receitas de família com tempero fresco e ingredientes
                  selecionados todos os dias.
                </p>
              </div>

              <div className="home-destaque-card">
                <h3>Entrega Rápida e Quentinha</h3>
                <p>
                  Sua marmita chega no ponto ideal para o almoço, sem demora
                  na sua região.
                </p>
              </div>

              <div className="home-destaque-card">
                <h3>Preço Justo, Prato Cheio</h3>
                <p>
                  Porções caprichadas que cabem no seu bolso e matam sua fome
                  de verdade.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ===== CARDÁPIO DO DIA ===== */}
        <section className="home-cardapio-cta">
          <div className="home-container">

            <div className="home-cardapio-cta-box">

              <div className="home-cardapio-cta-texto">
                <span className="home-tag">Atualizado diariamente</span>
                <h2>Veja o cardápio de hoje</h2>
                <p>
                  Carnes frescas, guarnições variadas e aquele feijãozinho
                  caprichado esperando por você.
                </p>
              </div>

              <button
                type="button"
                className="home-btn-pedido home-btn-cardapio"
                onClick={irParaPedido}
              >
                Ver Cardápio de Hoje
              </button>

            </div>

          </div>
        </section>

        {/* ===== INFORMAÇÕES DE CONTATO E HORÁRIOS ===== */}
        <section className="home-infos">
          <div className="home-container">

            <div className="home-infos-grid">

              <div className="home-info">
                <div className="home-info-topo">
                  <Phone size={16} aria-hidden="true" />
                  <span>WhatsApp / Telefone</span>
                </div>
                <a
                  className="home-info-valor home-info-link"
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {TELEFONE}
                </a>
              </div>

              <div className="home-info">
                <div className="home-info-topo">
                  <MapPin size={16} aria-hidden="true" />
                  <span>Endereço</span>
                </div>
                <a
                  className="home-info-valor home-info-link home-info-endereco-link"
                  href={GOOGLE_MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir no Google Maps"
                >
                  {ENDERECO}
                </a>
              </div>

              <div className="home-info">
                <div className="home-info-topo">
                  <Clock size={16} aria-hidden="true" />
                  <span>Funcionamento</span>
                </div>
                <p className="home-info-valor">{FUNCIONAMENTO}</p>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="home-container home-footer-inner">

          <div className="home-logo">
            <span className="home-logo-nome">EL SHADDAY</span>
            <span className="home-logo-sub">— RESTAURANTE —</span>
          </div>

          <p>© El Shadday Restaurante. Todos os direitos reservados.</p>

        </div>
      </footer>

    </div>
  )
}

export default Home