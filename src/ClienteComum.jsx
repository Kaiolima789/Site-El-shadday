import { useState } from 'react'
import './ClienteComum.css'
import FormaPagamento from './FormaPagamento'

const TAXA_ENTREGA = 4.0

function IconeRecibo({ size = 18 }) {
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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function ClienteComum({ voltar, pedido, enviarPedido }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState('entrega')
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [trocoPara, setTrocoPara] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Cálculos de valores
  const subtotalMarmita = Number(pedido?.preco_marmita || (pedido?.preco ? pedido.preco - (pedido.preco_bebida || 0) : 18.0)) || 18.0
  const subtotalBebida = Number(pedido?.preco_bebida || 0.0)
  const valorEntrega = tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0.0
  const totalFinal = subtotalMarmita + subtotalBebida + valorEntrega

  async function enviar() {
    if (!nome.trim() || !telefone.trim()) {
      alert('Preencha seu nome e telefone.')
      return
    }

    if (tipoEntrega === 'entrega' && !endereco.trim()) {
      alert('Informe o endereço para entrega.')
      return
    }

    if (!formaPagamento) {
      alert('Escolha a forma de pagamento.')
      return
    }

    const trocoNumero = Number(String(trocoPara).replace(',', '.'))

    if (formaPagamento === 'dinheiro' && trocoPara.trim()) {
      if (Number.isNaN(trocoNumero) || trocoNumero < totalFinal) {
        alert(
          `O valor do troco deve ser maior ou igual ao total do pedido (R$ ${totalFinal.toFixed(2).replace('.', ',')}).`
        )
        return
      }
    }

    setEnviando(true)

    const dadosPedido = {
      ...pedido,
      nome: nome.trim(),
      telefone: telefone.trim(),
      tipo_entrega: tipoEntrega,
      endereco: tipoEntrega === 'entrega' ? endereco.trim() : '',
      observacao: observacao.trim(),
      forma_pagamento: formaPagamento,
      troco_para:
        formaPagamento === 'dinheiro' && trocoPara.trim() ? trocoNumero : null,
      taxa_entrega: valorEntrega,
      preco_marmita: subtotalMarmita,
      preco_bebida: subtotalBebida,
      preco: totalFinal,
      valor_cobrar: totalFinal,
      origem: 'cliente_comum'
    }

    try {
      const resposta = await fetch('http://localhost:3000/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosPedido)
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao enviar pedido.')
        setEnviando(false)
        return
      }

      enviarPedido({
        ...dadosPedido,
        id: dados.id
      })
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
      setEnviando(false)
    }
  }

  function detalheBebidaResumo() {
    const partes = []
    if (pedido?.refrigerante_sabor) partes.push(pedido.refrigerante_sabor)
    if (pedido?.agua_tipo) partes.push(pedido.agua_tipo)
    return partes.length > 0 ? partes.join(' + ') : null
  }

  return (
    <div className="cc-page">

      <header className="cc-header">
        <button
          type="button"
          className="cc-voltar-btn"
          onClick={voltar}
        >
          ← Voltar
        </button>

        <div className="cc-logo">
          <h1>EL SHADDAY - RESTAURANTE</h1>
        </div>

        <div className="cc-header-spacer"></div>
      </header>

      <main className="cc-conteudo">

        <div className="cc-titulo-bloco">
          <h2>Dados do Pedido</h2>
          <p>Confirme suas informações e finalize seu almoço.</p>
        </div>

        <div className="cc-grid">

          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="cc-card">

            <div className="cc-campo">
              <label>Nome completo</label>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="cc-campo">
              <label>Telefone / WhatsApp</label>
              <input
                type="tel"
                placeholder="(61) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="cc-campo">
              <label>Como deseja receber?</label>
              <div className="cc-toggle">
                <button
                  type="button"
                  className={tipoEntrega === 'retirada' ? 'cc-toggle-btn ativo' : 'cc-toggle-btn'}
                  onClick={() => setTipoEntrega('retirada')}
                >
                  Retirar no Local
                </button>
                <button
                  type="button"
                  className={tipoEntrega === 'entrega' ? 'cc-toggle-btn ativo' : 'cc-toggle-btn'}
                  onClick={() => setTipoEntrega('entrega')}
                >
                  Entrega
                </button>
              </div>
            </div>

            {tipoEntrega === 'entrega' && (
              <div className="cc-campo cc-campo-endereco">
                <label>Endereço de entrega</label>
                <input
                  type="text"
                  placeholder="Rua, número, quadra, referência"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <FormaPagamento
              valor={formaPagamento}
              onChange={setFormaPagamento}
              troco={trocoPara}
              onTrocoChange={setTrocoPara}
            />

            <div className="cc-campo">
              <label>Observações</label>
              <textarea
                placeholder="Alguma observação? (opcional)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

          </div>

          {/* COLUNA DIREITA: RESUMO DO PEDIDO */}
          <aside className="cc-resumo-card">

            <div className="cc-resumo-topo">
              <div className="cc-resumo-icon-badge">
                <IconeRecibo size={16} />
              </div>
              <h3>Resumo do seu pedido</h3>
            </div>

            <div className="cc-resumo-extrato">

              <div className="cc-resumo-linha">
                <span className="cc-resumo-item-nome">Marmita Tradicional</span>
                <span className="cc-resumo-item-preco">
                  R$ {subtotalMarmita.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="cc-resumo-tags">
                {pedido?.carne && (
                  <span className="cc-resumo-tag">{pedido.carne}</span>
                )}
                {pedido?.guarnicao && (
                  <span className="cc-resumo-tag">{pedido.guarnicao}</span>
                )}
              </div>

              {detalheBebidaResumo() && (
                <div className="cc-resumo-linha cc-resumo-linha-bebida">
                  <span className="cc-resumo-item-nome">
                    Bebida: {detalheBebidaResumo()}
                  </span>
                  <span className="cc-resumo-item-preco">
                    R$ {subtotalBebida.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              <div className="cc-resumo-linha cc-resumo-linha-taxa">
                <span className="cc-resumo-item-nome">Taxa de Entrega</span>
                <span className={`cc-resumo-item-preco ${tipoEntrega === 'retirada' ? 'taxa-gratis' : ''}`}>
                  {tipoEntrega === 'entrega' ? `R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}` : 'Grátis'}
                </span>
              </div>

              <div className="cc-resumo-divisor"></div>

              <div className="cc-resumo-total-linha">
                <span>Total: R$ {totalFinal.toFixed(2).replace('.', ',')}</span>
              </div>

            </div>

            <button
              type="button"
              className="cc-finalizar-btn"
              onClick={enviar}
              disabled={enviando}
            >
              {enviando ? 'ENVIANDO PEDIDO...' : 'FINALIZAR E ENVIAR PEDIDO →'}
            </button>

            <p className="cc-resumo-aviso">
              Pagamento na entrega ou retirada (no Pix, cartão ou dinheiro).
            </p>

          </aside>

        </div>

      </main>

    </div>
  )
}

export default ClienteComum