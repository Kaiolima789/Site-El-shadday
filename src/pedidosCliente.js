const CHAVE_PEDIDOS_CLIENTE = 'pedidos_cliente'

export function listarPedidosSalvos() {
  if (typeof window === 'undefined') return []
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS_CLIENTE) || '[]')
    if (Array.isArray(salvos) && salvos.length) return salvos
    const ultimo = JSON.parse(localStorage.getItem('ultimo_pedido') || 'null')
    return ultimo ? [ultimo] : []
  } catch {
    return []
  }
}

export function salvarPedidoCliente(pedido) {
  if (typeof window === 'undefined' || !pedido) return
  try {
    const pedidos = listarPedidosSalvos()
    const atualizados = [pedido, ...pedidos.filter((item) => String(item.id) !== String(pedido.id))].slice(0, 20)
    localStorage.setItem(CHAVE_PEDIDOS_CLIENTE, JSON.stringify(atualizados))
    localStorage.setItem('ultimo_pedido', JSON.stringify(pedido))
  } catch (erro) {
    console.error('Não foi possível salvar o pedido neste navegador.', erro)
  }
}

export function atualizarPedidoSalvo(pedido) {
  if (typeof window === 'undefined' || !pedido) return
  const pedidos = listarPedidosSalvos()
  const atualizado = pedidos.map((item) => String(item.id) === String(pedido.id) ? { ...item, ...pedido } : item)
  try {
    localStorage.setItem(CHAVE_PEDIDOS_CLIENTE, JSON.stringify(atualizado))
    const ultimo = JSON.parse(localStorage.getItem('ultimo_pedido') || 'null')
    if (ultimo && String(ultimo.id) === String(pedido.id)) {
      localStorage.setItem('ultimo_pedido', JSON.stringify({ ...ultimo, ...pedido }))
    }
  } catch (erro) {
    console.error('Não foi possível atualizar o pedido salvo.', erro)
  }
}
