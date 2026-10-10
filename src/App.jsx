import { useState } from 'react'
import './App.css'
import Marmitas from './Marmitas'
import AdminCardapio from './AdminCardapio'
import DestinoPedido from './DestinoPedido'
import Vivendas from './Vivendas'
import ClienteComum from './ClienteComum'
import PedidosVivendas from './PedidosVivendas'
import AcompanharPedido from './AcompanharPedido'
import Home from './Home'

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
    <Home
      irParaPedido={() => setPagina('marmitas')}
      irParaAdmin={() => setPagina('admin')}
    />
  )
}

export default App
