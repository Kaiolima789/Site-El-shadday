import { useState } from 'react'
import './Vivendas.css'
import FormaPagamento from './FormaPagamento'

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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

function IconeCheckCirculo({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function Vivendas({ voltar, pedido, enviarPedido }) {
  const [nome, setNome] = useState('')
  const [loja, setLoja] = useState('')
  const [codigo, setCodigo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [trocoPara, setTrocoPara] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Na Vivendas a marmita é coberta pelo convênio: o cliente só paga a bebida se tiver pedido
  const subtotalMarmita = Number(pedido?.preco_marmita || (pedido?.preco ? pedido.preco - (pedido.preco_bebida || 0) : 18.0)) || 18.0
  const valorBebida = Number(pedido?.preco_bebida) || 0
  const temCobranca = valorBebida > 0
  const valorTotalAPagar = temCobranca ? valorBebida : 0

  async function enviar() {
    if (!nome.trim() || !loja.trim() || !codigo.trim()) {
      alert('Preencha seu nome, loja e código da Vivendas.')
      return
    }

    if (temCobranca && !formaPagamento) {
      alert('Escolha a forma de pagamento da bebida.')
      return
    }

    const trocoNumero = Number(String(trocoPara).replace(',', '.'))

    if (temCobranca && formaPagamento === 'dinheiro' && trocoPara.trim()) {
      if (Number.isNaN(trocoNumero) || trocoNumero < valorBebida) {
        alert(
          `O valor do troco deve ser maior ou igual ao valor da bebida (R$ ${valorBebida.toFixed(2).replace('.', ',')}).`
        )
        return
      }
    }

    setEnviando(true)

    const dadosPedido = {
      ...pedido,
      nome: nome.trim(),
      loja: loja.trim(),
      codigo: codigo.trim(),
      codigo_vivendas: codigo.trim(),
      observacao: observacao.trim(),
      forma_pagamento: temCobranca ? formaPagamento : '',
      troco_para:
        temCobranca && formaPagamento === 'dinheiro' && trocoPara.trim()
          ? trocoNumero
          : null,
      preco_marmita: subtotalMarmita,
      preco_bebida: valorBebida,
      preco: valorTotalAPagar,
      valor_cobrar: valorTotalAPagar,
      origem: 'vivendas'
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
    if (!pedido?.refrigerante_sabor && !pedido?.agua_tipo) return null
    if (pedido.refrigerante_sabor) {
      return `${pedido.refrigerante_tamanho || 'Lata'} • ${pedido.refrigerante_sabor}`
    }
    return pedido.agua_tipo
  }

  return (
    <div className="vivendas-page">

      <header className="vivendas-header">
        <button
          type="button"
          className="vivendas-voltar-btn"
          onClick={voltar}
          title="Voltar"
          aria-label="Voltar"
        >
          ← Voltar
        </button>

        <div className="vivendas-logo">
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

        <div className="vivendas-header-spacer"></div>
      </header>

      <main className="vivendas-conteudo">

        <div className="vivendas-titulo-bloco">
          <div className="vivendas-badge-convenio">Convênio Vivendas</div>
          <h2>Dados do Pedido</h2>
          <p>Informe seus dados para validar seu benefício Vivendas.</p>
        </div>

        <div className="vivendas-grid">

          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="vivendas-card">

            <div className="vivendas-campo">
              <label>Nome completo</label>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="vivendas-campo">
              <label>Loja / Unidade</label>
              <input
                type="text"
                placeholder="Digite a loja ou unidade"
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
              />
            </div>

            <div className="vivendas-campo">
              <label>Código do Vivendas ou CPF</label>
              <input
                type="text"
                placeholder="Digite o código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            {/* AVISO DO BENEFÍCIO */}
            <div className="vivendas-alerta-beneficio">
              <IconeCheckCirculo size={18} />
              <span>
                {temCobranca
                  ? `Marmita coberta pelo código Vivendas. Bebida a pagar na entrega: R$ ${valorBebida.toFixed(2).replace('.', ',')}.`
                  : 'Marmita paga pelo código Vivendas. Nada a pagar na entrega.'}
              </span>
            </div>

            {/* SE HOUVER BEBIDA, EXIBE O PAGAMENTO */}
            {temCobranca && (
              <div className="vivendas-bloco-pagamento">
                <FormaPagamento
                  valor={formaPagamento}
                  onChange={setFormaPagamento}
                  troco={trocoPara}
                  onTrocoChange={setTrocoPara}
                />
              </div>
            )}

            <div className="vivendas-campo">
              <label>Observações</label>
              <textarea
                placeholder="Alguma observação? (opcional)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

          </div>

          {/* COLUNA DIREITA: RESUMO DO PEDIDO */}
          <aside className="vivendas-resumo-card">

            <div className="vivendas-resumo-topo">
              <div className="vivendas-resumo-icon-badge">
                <IconeRecibo size={16} />
              </div>
              <h3>Resumo do seu pedido</h3>
            </div>

            <div className="vivendas-resumo-extrato">

              <div className="vivendas-resumo-linha">
                <span className="vivendas-resumo-item-nome">Marmita Tradicional</span>
                <span className="vivendas-resumo-item-preco">
                  R$ {subtotalMarmita.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="vivendas-resumo-tags">
                {pedido?.carne && (
                  <span className="vivendas-resumo-tag">{pedido.carne}</span>
                )}
                {pedido?.guarnicao && (
                  <span className="vivendas-resumo-tag">{pedido.guarnicao}</span>
                )}
              </div>

              <div className="vivendas-resumo-linha vivendas-resumo-linha-cobertura">
                <span className="vivendas-resumo-item-nome">Cobertura Vivendas</span>
                <span className="vivendas-cobertura-valor">
                  - R$ {subtotalMarmita.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {detalheBebidaResumo() && (
                <div className="vivendas-resumo-linha vivendas-resumo-linha-bebida">
                  <span className="vivendas-resumo-item-nome">
                    Bebida: {detalheBebidaResumo()}
                  </span>
                  <span className="vivendas-resumo-item-preco">
                    + R$ {valorBebida.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              <div className="vivendas-resumo-divisor"></div>

              <div className="vivendas-resumo-total-linha">
                <span>Total a pagar na entrega:</span>
                <span className={`vivendas-resumo-total-valor ${valorTotalAPagar === 0 ? 'total-gratis' : ''}`}>
                  R$ {valorTotalAPagar.toFixed(2).replace('.', ',')}
                </span>
              </div>

            </div>

            <button
              type="button"
              className="vivendas-finalizar-btn"
              onClick={enviar}
              disabled={enviando}
            >
              {enviando ? 'ENVIANDO PEDIDO...' : 'ENVIAR PEDIDO →'}
            </button>

            <p className="vivendas-resumo-aviso">
              {temCobranca
                ? 'Marmita faturada pelo convênio. Valor da bebida cobrado na entrega.'
                : 'Marmita faturada pelo convênio. Nada a pagar na entrega.'}
            </p>

          </aside>

        </div>

      </main>

    </div>
  )
}

export default Vivendas