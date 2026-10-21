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
import { atualizarPedidoSalvo, listarPedidosSalvos } from './pedidosCliente'

const DUAS_HORAS_MS = 2 * 60 * 60 * 1000

function pedidoAindaVisivelNaHome(pedido, agora) {
  if (pedido.status !== 'pronto') return true
  if (!pedido.pronto_em) return true
  const valor = String(pedido.pronto_em)
  const dataPronto = new Date(`${valor.replace(' ', 'T')}${/[zZ]|[+-]\d\d:\d\d$/.test(valor) ? '' : 'Z'}`)
  if (Number.isNaN(dataPronto.getTime())) return true
  return agora - dataPronto.getTime() < DUAS_HORAS_MS
}

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
  const [pedidosSalvos, setPedidosSalvos] = useState(listarPedidosSalvos)
  const [agora, setAgora] = useState(Date.now)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('elshadday_admin_token') || '')
  const isAdminLogado = Boolean(adminToken)

  useEffect(() => {
    let ativo = true

    async function atualizarStatusPedidosSalvos() {
      if (ativo) setAgora(Date.now())
      const salvos = listarPedidosSalvos()
      const atualizados = await Promise.all(salvos.map(async (pedidoSalvo) => {
        const identificador = pedidoSalvo.codigo_rastreio || pedidoSalvo.id
        if (!identificador) return pedidoSalvo
        const codigo = encodeURIComponent(identificador)
        const rota = /^[a-f0-9]{48}$/i.test(String(identificador))
          ? `/pedidos/rastreio/${codigo}`
          : `/pedidos/${codigo}`
        try {
          const resposta = await fetch(`${API_URL}${rota}`)
          if (!resposta.ok) return pedidoSalvo
          const dados = await resposta.json()
          const atualizado = { ...pedidoSalvo, ...dados }
          atualizarPedidoSalvo(atualizado)
          return atualizado
        } catch {
          return pedidoSalvo
        }
      }))

      if (ativo && JSON.stringify(atualizados) !== JSON.stringify(salvos)) {
        setPedidosSalvos(atualizados)
      }
    }

    atualizarStatusPedidosSalvos()
    const intervalo = setInterval(atualizarStatusPedidosSalvos, 30000)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [])

  function abrirAcompanhamento(pedidoParaAcompanhar) {
    const pedidoAlvo = pedidoParaAcompanhar || pedidosSalvos[0]
    if (pedidoAlvo) {
      setPedido(pedidoAlvo)
      setPagina('aguardando')
    }
  }

  function registrarPedido(novoPedido) {
    setPedidosSalvos(listarPedidosSalvos())
    setPedido(novoPedido)
    setPagina('aguardando')
  }

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
          setPedidosSalvos(listarPedidosSalvos())
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
          registrarPedido(pedidoVivendas)
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
          registrarPedido(pedidoCliente)
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
      pedidosEmAndamento={pedidosSalvos.filter((pedidoSalvo) => !['recusado', 'entregue', 'cancelado', 'concluido'].includes(pedidoSalvo.status) && pedidoAindaVisivelNaHome(pedidoSalvo, agora))}
      acompanharPedido={abrirAcompanhamento}
      irParaAdmin={() => setPagina('admin')}
      isAdminLogado={isAdminLogado}
    />
  )
}

export default App
