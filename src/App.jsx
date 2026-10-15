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
import { API_URL } from './config'

function agregarMarmitasPedido(marmitas) {
  const itens = marmitas.filter(Boolean)
  const primeira = itens[0] || {}
  const totalMarmitas = itens.reduce((total, item) => total + Number(item.preco_marmita || 0), 0)
  const totalBebidas = itens.reduce((total, item) => total + Number(item.preco_bebida || 0), 0)
  const bebidas = itens.flatMap((item) => Array.isArray(item.bebidas) ? item.bebidas : [])
  const unir = (campo) => itens.map((item) => item[campo]).filter(Boolean).join(' + ').slice(0, 600)

  return {
    ...primeira,
    marmitas: itens,
    quantidade_marmitas: itens.length,
    preco_marmita: totalMarmitas,
    preco_bebida: totalBebidas,
    bebida_quantidade: itens.reduce((total, item) => total + Number(item.bebida_quantidade || 0), 0),
    bebidas,
    refrigerante_sabor: unir('refrigerante_sabor'),
    refrigerante_tamanho: unir('refrigerante_tamanho'),
    agua_tipo: unir('agua_tipo'),
    preco: totalMarmitas + totalBebidas,
    valor_cobrar: totalMarmitas + totalBebidas
  }
}

function App() {
  const [pagina, setPagina] = useState(() => {
    if (window.location.hash === '#admin' || window.location.hash === '#admin-pedidos') {
      return 'admin'
    }
    return 'home'
  })
  const [pedido, setPedido] = useState(null)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('elshadday_admin_token') || '')
  const isAdminLogado = Boolean(adminToken)

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
    if (adminToken) {
      fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {})
    }
    sessionStorage.removeItem('elshadday_admin_token')
    setAdminToken('')
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
          onLoginSucesso={(token) => {
            setAdminToken(token)
            setPagina('admin')
          }}
        />
      )
    }
  }

  if (pagina === 'admin') {
    return (
      <AdminCardapio
        authToken={adminToken}
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
        authToken={adminToken}
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
        vivendas={(marmitaUnica) => {
          if (marmitaUnica) setPedido(agregarMarmitasPedido([marmitaUnica]))
          setPagina('vivendas')
        }}
      />
    )
  }

  if (pagina === 'aguardando') {
    return (
      <AcompanharPedido
        pedidoId={pedido?.codigo_rastreio || pedido?.id}
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
          const marmitas = Array.isArray(pedidoSelecionado?.marmitas)
            ? pedidoSelecionado.marmitas
            : [pedidoSelecionado]
          setPedido(agregarMarmitasPedido(marmitas))
          setPagina('destino')
        }}
        irParaAdmin={() => setPagina('admin')}
        isAdminLogado={isAdminLogado}
      />
    )
  }

  return (
    <Home
      irParaPedido={() => {
        setPedido(null)
        setPagina('marmitas')
      }}
      irParaAdmin={() => setPagina('admin')}
      isAdminLogado={isAdminLogado}
    />
  )
}

export default App
