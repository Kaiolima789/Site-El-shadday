// Formas de pagamento aceitas. TODAS são pagas na entrega (ou retirada),
// na maquininha ou em dinheiro — ainda não existe pagamento online.
// A "chave" é o que vai pro servidor/banco; o "label" é o que aparece na tela.
export const FORMAS_PAGAMENTO = [
  { chave: 'pix', label: 'Pix (maquininha)', icone: '📱' },
  { chave: 'debito', label: 'Débito', icone: '💳' },
  { chave: 'credito', label: 'Crédito', icone: '💳' },
  { chave: 'dinheiro', label: 'Dinheiro', icone: '💵' }
]

export function rotuloPagamento(chave) {
  const forma = FORMAS_PAGAMENTO.find((f) => f.chave === chave)
  return forma ? forma.label : ''
}

// Texto do troco (só faz sentido quando o pagamento é em dinheiro).
// "troco_para" = com quanto o cliente vai pagar (ex.: nota de 50).
export function textoTroco(pedido) {
  if (pedido.forma_pagamento !== 'dinheiro') return ''

  const paraQuanto = Number(pedido.troco_para)
  const levar = paraQuanto - Number(pedido.valor_cobrar || 0)

  if (!paraQuanto || levar <= 0) return 'Sem troco'

  return `Troco para R$ ${paraQuanto.toFixed(2)} (levar R$ ${levar.toFixed(2)} de troco)`
}