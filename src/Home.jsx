import {
  Phone,
  MapPin,
  Clock,
  Heart,
  ArrowRight
} from 'lucide-react'
import './Home.css'
import marmitaHero from './assets/marmita-hero.jpg'

// ===== ÍCONES VETORIAIS (SVG OUTLINE) =====
function IconeMarmita({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
      <path d="M7 4v3" />
      <path d="M12 2v5" />
      <path d="M17 4v3" />
    </svg>
  )
}

function IconeLocal({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
      <path d="M2 14h20" />
      <path d="M12 14v7" />
      <path d="M7 6v2" />
      <path d="M17 6v2" />
      <circle cx="12" cy="7" r="2.5" />
    </svg>
  )
}

// Dados de contato e links diretos
const TELEFONE = '61 99437-4490'
const WHATSAPP_LINK = 'https://wa.me/5561994374490'
const ENDERECO = 'QR 202 Conjunto E, 3 — Santa Maria, Brasília - DF, 72502-409, Brasil'
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
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <span className="home-pilula">
                <Heart size={13} aria-hidden="true" />
                Feita na hora, com sabor de casa.
              </span>

            </div>

            <div className="home-hero-imagem">
              <img
                src={marmitaHero}
                alt="Marmita com arroz, feijão, bife, farofa, salada e batata frita"
              />
            </div>

          </div>
        </section>

        {/* ===== SEU ALMOÇO, DO SEU JEITO ===== */}
        <section className="home-secao">
          <div className="home-container">

            <h2 className="home-secao-titulo">Seu almoço, do seu jeito</h2>

            <div className="home-opcoes">

              <button
                type="button"
                className="home-opcao"
                onClick={irParaPedido}
              >
                <span className="home-opcao-icone">
                  <IconeMarmita size={24} />
                </span>

                <span className="home-opcao-texto">
                  <strong>MARMITAS</strong>
                  <span>Comida caseira feita na hora, pronta para o seu dia.</span>
                </span>
              </button>

              <button
                type="button"
                className="home-opcao"
                onClick={irParaPedido}
              >
                <span className="home-opcao-icone">
                  <IconeLocal size={24} />
                </span>

                <span className="home-opcao-texto">
                  <strong>ALMOÇO NO LOCAL</strong>
                  <span>Venha comer com a gente em um ambiente acolhedor.</span>
                </span>
              </button>

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