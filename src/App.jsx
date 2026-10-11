import { useState, useEffect } from 'react'
import './App.css'
import Marmitas from './Marmitas'
import AdminCardapio from './AdminCardapio'
import DestinoPedido from './DestinoPedido'
import Vivendas from './Vivendas'
import ClienteComum from './ClienteComum'
import PedidosVivendas from './PedidosVivendas'
import AcompanharPedido from './AcompanharPedido'
import Home from './Home'
import LoginAdmin from './LoginAdmin'

function App() {
  const [pagina, setPagina] = useState(() => {
    if (window.location.hash === '#admin' || window.location.hash === '#admin-pedidos') {
      return 'admin'
    }
    return 'home'
  })
  const [pedido, setPedido] = useState(null)
  const [isAdminLogado, setIsAdminLogado] = useState(() => {
    return localStorage.getItem('elshadday_admin_autenticado') === 'true'
  })

  // Detecta acesso direto pela URL com #admin
  useEffect(() => {
    function verificarHash() {
      if (window.location.hash === '#admin') {
        setPagina('admin')
      } else if (window.location.hash === '#admin-pedidos') {
        setPagina('admin-pedidos')
      }
    }
    verificarHash()
    window.addEventListener('hashchange', verificarHash)
    return () => window.removeEventListener('hashchange', verificarHash)
  }, [])

  function fazerLogoutAdmin() {
    localStorage.removeItem('elshadday_admin_autenticado')
    setIsAdminLogado(false)
    window.location.hash = ''
    setPagina('home')
  }

  // Se tentar acessar o admin sem estar logado, exibe a tela de senha
  if (pagina === 'admin' || pagina === 'admin-pedidos' || pagina === 'login-admin') {
    if (!isAdminLogado) {
      return (
        <LoginAdmin
          voltar={() => {
            window.location.hash = ''
            setPagina('home')
          }}
          onLoginSucesso={() => {
            setIsAdminLogado(true)
            setPagina('admin')
          }}
        />
      )
    }
  }

  if (pagina === 'admin') {
    return (
      <AdminCardapio
        voltar={() => {
          window.location.hash = ''
          setPagina('home')
        }}
        pedidos={() => setPagina('admin-pedidos')}
        logout={fazerLogoutAdmin}
      />
    )
  }

  if (pagina === 'admin-pedidos' || pagina === 'pedidos-vivendas') {
    return (
      <PedidosVivendas
        voltar={() => setPagina('admin')}
        logout={fazerLogoutAdmin}
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
        pedidoInicial={pedido}
        voltar={() => {
          setPedido(null)
          setPagina('home')
        }}
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
        irParaAdmin={() => setPagina('admin')}
        isAdminLogado={isAdminLogado}
      />
    )
  }

  return (
    <Home
      irParaPedido={() => setPagina('marmitas')}
      irParaAdmin={() => setPagina('admin')}
      isAdminLogado={isAdminLogado}
    />
  )
}

export default App