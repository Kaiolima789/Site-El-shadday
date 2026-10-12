import { useState } from 'react'
import './Vivendas.css'
import FormaPagamento from './FormaPagamento'
import { API_URL } from './config'

function IconeVoltar({ size = 16 }) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

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

  // Na Vivendas a marmita e a entrega são cobertas pelo convênio: o cliente só paga a bebida se tiver pedido
  const subtotalMarmita = Number(pedido?.preco_marmita || (pedido?.preco ? pedido.preco - (pedido.preco_bebida || 0) : 18.0)) || 18.0
  const valorBebida = Number(pedido?.preco_bebida) || 0
  const temCobranca = valorBebida > 0
  const valorTotalAPagar = temCobranca ? valorBebida : 0

  async function enviar() {
    const partesNome = nome.trim().split(/\s+/)
    if (partesNome.length < 2) {
      alert('Por favor, digite seu nome e sobrenome.')
      return
    }

    if (!loja.trim() || !codigo.trim()) {
      alert('Preencha a loja e o código da Vivendas.')
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
      tipo_entrega: 'loja',
      endereco: '',
      regiao_entrega: '',
      taxa_entrega: 0,
      observacao: observacao.trim(),
      forma_pagamento: temCobranca ? formaPagamento : '',
      troco_para:
        temCobranca && formaPagamento === 'dinheiro' && trocoPara.trim()
          ? trocoNumero
          : null,
      preco_marmita: subtotalMarmita,
      preco_bebida: valorBebida,
      preco: subtotalMarmita + valorBebida,
      valor_cobrar: valorTotalAPagar,
      origem: 'vivendas'
    }

    try {
      const resposta = await fetch(`${API_URL}/pedidos`, {
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
    <div className="vivendas-page">

      <header className="vivendas-header">
        <button
          type="button"
          className="vivendas-voltar-btn"
          onClick={voltar}
          title="Voltar"
          aria-label="Voltar"
        >
          <IconeVoltar size={16} />
          <span>Voltar</span>
        </button>

        <div className="vivendas-logo" style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: '#6E2636', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '0.5px', fontWeight: 700 }}>
            EL SHADDAY
          </h1>
          <span style={{ color: '#8A6D3B', fontSize: '10px', letterSpacing: '2px', display: 'block', marginTop: '1px', fontWeight: 600 }}>
            — RESTAURANTE —
          </span>
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
              <label>Nome e Sobrenome</label>
              <input
                type="text"
                placeholder="Digite seu nome e sobrenome"
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

              <div className="vivendas-resumo-linha">
                <span className="vivendas-resumo-item-nome">Entrega na Loja</span>
                <span className="vivendas-resumo-item-preco" style={{ color: '#2e7d32', fontWeight: 600 }}>
                  Grátis (R$ 0,00)
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
