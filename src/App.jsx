import { useState } from 'react'
import './App.css'
import Marmitas from './Marmitas'
import AdminCardapio from './AdminCardapio'
import DestinoPedido from './DestinoPedido'
import Vivendas from './Vivendas'
import ClienteComum from './ClienteComum'
import PedidosVivendas from './PedidosVivendas'
import AcompanharPedido from './AcompanharPedido'
import marmitaHero from './assets/marmita-hero.png'

function App() {
  const [pagina, setPagina] = useState('home')
  const [pedido, setPedido] = useState(null)

  if (pagina === 'admin') {
  return (
    <AdminCardapio
      voltar={() => setPagina('home')}
      pedidos={() => setPagina('pedidos-vivendas')}
    />
  )
}

  if (pagina === 'destino') {
    return (
      <DestinoPedido
        pedido={pedido}
        voltar={() => setPagina('marmitas')}
        clienteComum={() => setPagina('cliente-comum')}
        vivendas={() => setPagina('vivendas')}
      />
    )
  }

  if (pagina === 'aguardando') {
    return (
      <AcompanharPedido
        pedidoId={pedido?.id}
        voltar={() => {
          setPedido(null)
          setPagina('home')
        }}
      />
    )
  }
if (pagina === 'pedidos-vivendas') {
  return (
    <PedidosVivendas
      voltar={() => setPagina('admin')}
    />
  )
}

  if (pagina === 'vivendas') {
  return (
    <Vivendas
      pedido={pedido}
      voltar={() => setPagina('destino')}
      enviarPedido={(pedidoVivendas) => {
        setPedido(pedidoVivendas)
        setPagina('aguardando')
      }}
    />
  )
}

  if (pagina === 'cliente-comum') {
    return (
      <ClienteComum
        pedido={pedido}
        voltar={() => setPagina('destino')}
        enviarPedido={(pedidoCliente) => {
          setPedido(pedidoCliente)
          setPagina('aguardando')
        }}
      />
    )
  }

  if (pagina === 'marmitas') {
    return (
      <Marmitas
        voltar={() => setPagina('home')}
        continuar={(pedidoSelecionado) => {
          setPedido(pedidoSelecionado)
          setPagina('destino')
        }}
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

        <button
         onClick={() => setPagina('admin')}
          style={{
            position: 'absolute',
            right: '16px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#6b1f24',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          ADMIN
        </button>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-img">
          <img src={marmitaHero} alt="Marmita com arroz, feijão, bife, farofa, salada e batata frita" />
          <div className="hero-overlay">
            <h2>Comida feita com carinho, pronta pra você</h2>
            <p>Monte sua marmita do seu jeito, na hora que quiser</p>
            <button
              className="btn-pedido"
              onClick={() => setPagina('marmitas')}
            >
              🍱 FAZER PEDIDO
            </button>
          </div>
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
