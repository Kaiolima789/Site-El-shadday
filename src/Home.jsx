import {
  Phone,
  MapPin,
  Clock,
  Heart,
  ArrowRight
} from 'lucide-react'
import './Home.css'
import marmitaHero from './assets/marmita-hero.jpg'

// ===== ÍCONES PRÓPRIOS (SVGs enviados pelo Kaio) =====
// Usam currentColor: a cor vem do CSS (branco dentro do card vinho).

function IconeMarmita({ size = 22 }) {
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
      <path d="M4 11h16a1 1 0 0 1 1 1v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a1 1 0 0 1 1-1Z" />
      <path d="M5.5 11 7 4h10l1.5 7" />
      <path d="M9 14h6" />
    </svg>
  )
}

function IconeLocal({ size = 22 }) {
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
      <circle cx="12" cy="7" r="3" />
      <path d="M7 6v2" />
      <path d="M17 6v2" />
    </svg>
  )
}

// Dados de contato (mudou algo? é só editar aqui)
const TELEFONE = '61 99437-4490'
const WHATSAPP_LINK = 'https://wa.me/5561994374490'
const ENDERECO = 'QR 202 Conjunto E, 3 — Santa Maria, Brasília - DF, 72502-409, Brasil'
const FUNCIONAMENTO = 'Segunda a Sábado, das 11:00 às 14:00'

function Home({ irParaPedido, irParaAdmin }) {
  return (
    <div className="home-page">

      {/* ===== HEADER ===== */}
      <header className="home-header">
        <div className="home-container home-header-inner">

          <div className="home-logo">
            <span className="home-logo-nome">EL SHADDAY</span>
            <span className="home-logo-sub">— RESTAURANTE —</span>
          </div>

          <button
            type="button"
            className="home-admin-link"
            onClick={irParaAdmin}
          >
            Admin
          </button>

        </div>
      </header>

      <main>

        {/* ===== HERO ===== */}
        <section className="home-hero">
          <div className="home-container home-hero-inner">

            <div className="home-hero-texto">

              <span className="home-localizacao">
                <MapPin size={14} aria-hidden="true" />
                Santa Maria, Brasília
              </span>

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
                  <IconeMarmita size={22} />
                </span>

                <span className="home-opcao-texto">
                  <strong>MARMITAS</strong>
                  <span>Comida caseira feita na hora, pronta para o seu dia.</span>
                </span>
              </button>

              <button
                type="button"
                className="home-opcao"
                onClick={() => alert('Em breve: pedidos para consumir no local.')}
              >
                <span className="home-opcao-icone">
                  <IconeLocal size={22} />
                </span>

                <span className="home-opcao-texto">
                  <strong>NO LOCAL</strong>
                  <span>O mesmo sabor caseiro, para comer aqui com a gente.</span>
                </span>
              </button>

            </div>

          </div>
        </section>

        {/* ===== ESTAMOS POR AQUI ===== */}
        <section className="home-secao home-secao-contato">
          <div className="home-container">

            <h2 className="home-secao-titulo">Estamos por aqui</h2>

            <div className="home-info-grade">

              <div className="home-info">
                <div className="home-info-topo">
                  <Phone size={16} aria-hidden="true" />
                  <span>Telefone / WhatsApp</span>
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
                <p className="home-info-valor">{ENDERECO}</p>
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
