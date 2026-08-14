import { useState } from 'react'
import './App.css'
import Marmitas from './Marmitas'

function App() {
  const [pagina, setPagina] = useState('home')

  if (pagina === 'marmitas') {
    return (
      <Marmitas
        voltar={() => setPagina('home')}
      />
    )
  }

  return (
    <div className="page">

      {/* CABEÇALHO */}
      <header className="header">
        <button className="menu-btn">☰</button>
        <div className="logo-text">
          <svg className="chapeu-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9 2 7 4.5 7 7c-2.5 0-4 1.8-4 4s1.5 4 4 4v2h10v-2c2.5 0 4-1.8 4-4s-1.5-4-4-4c0-2.5-2-5-5-5z"/>
            <rect x="6" y="17" width="12" height="3" rx="1"/>
          </svg>
          <h1>EL SHADDAY</h1>
          <span className="sub">— RESTAURANTE —</span>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h2>Comida caseira todos os dias</h2>
          <p>Marmitas e refeições preparadas com carinho para você!</p>
          <button
            className="btn-pedido"
            onClick={() => setPagina('marmitas')}
          >
            🍱 FAZER PEDIDO
          </button>
        </div>
        <div className="hero-img">
          {/* Troque a URL abaixo pela foto do prato quando tiver */}
          <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600" alt="Prato de comida" />
        </div>
      </section>

      {/* ESCOLHA DO PEDIDO */}
      <section className="opcoes">
        <h3>— ESCOLHA COMO DESEJA SEU PEDIDO —</h3>

        <div className="cards">
          <div
            className="card card-marmita"
            onClick={() => setPagina('marmitas')}
          >
            <div className="icone">🍱</div>
            <h4>MARMITAS</h4>
            <p>Escolha sua refeição e monte seu pedido de forma rápida.</p>
            <span className="seta">→</span>
          </div>

          <div className="card card-local">
            <div className="icone">🏪</div>
            <h4>NO LOCAL</h4>
            <p>Faça seu pedido para consumir no restaurante.</p>
            <span className="seta">→</span>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="contato">
        <div className="info">
          <span className="icone-info">📍</span>
          <h5>LOCALIZAÇÃO</h5>
          <p>QR 202, Santa Maria<br />Brasília - DF</p>
        </div>
        <div className="info">
          <span className="icone-info">🕐</span>
          <h5>HORÁRIO</h5>
          <p>11:30 às 13:30<br /><small>Todos os dias</small></p>
        </div>
        <div className="info">
          <span className="icone-info">📞</span>
          <h5>CONTATO</h5>
          <p>(61) 99999-9999</p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="footer">
        <p>❤ Feito com carinho para você!</p>
      </footer>

    </div>
  )
}

export default App