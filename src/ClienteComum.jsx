import { useRef, useState } from 'react'
import './ClienteComum.css'
import FormaPagamento from './FormaPagamento'
import { API_URL } from './config'
import { criarChaveIdempotencia } from './chaveIdempotencia'

// Regiões de entrega e taxas diferenciadas
const REGIOES_ENTREGA = [
  { id: 'sm_sul', nome: 'Santa Maria Sul', taxa: 3.0 },
  { id: 'sm_norte', nome: 'Santa Maria Norte', taxa: 5.0 },
  { id: 'novo_gama', nome: 'Novo Gama', taxa: 7.0 },
  { id: 'gama', nome: 'Gama', taxa: 10.0 },
  { id: 'demais', nome: 'Demais Regiões', taxa: 15.0 }
]

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

function ClienteComum({ voltar, pedido, enviarPedido }) {
  const chaveIdempotenciaRef = useRef(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState('entrega')
  const [regiaoEntrega, setRegiaoEntrega] = useState(REGIOES_ENTREGA[0]) // Padrão: Santa Maria Sul (R$ 3,00)
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [trocoPara, setTrocoPara] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [quantidadeMarmitas, setQuantidadeMarmitas] = useState(1)

  // Cálculos de valores dinâmicos
  const subtotalMarmita = Number(pedido?.preco_marmita || (pedido?.preco ? pedido.preco - (pedido.preco_bebida || 0) : 18.0)) || 18.0
  const totalMarmitas = subtotalMarmita * quantidadeMarmitas
  const subtotalBebida = Number(pedido?.preco_bebida || 0.0)
  const valorEntrega = tipoEntrega === 'entrega' ? Number(regiaoEntrega.taxa) : 0.0
  const totalFinal = totalMarmitas + subtotalBebida + valorEntrega

  async function enviar() {
    const partesNome = nome.trim().split(/\s+/)
    if (partesNome.length < 2) {
      alert('Por favor, digite seu nome e sobrenome.')
      return
    }

    if (!telefone.trim()) {
      alert('Preencha seu telefone / WhatsApp.')
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

    chaveIdempotenciaRef.current ||= criarChaveIdempotencia()
    setEnviando(true)

    const enderecoCompleto = tipoEntrega === 'entrega'
      ? `${regiaoEntrega.nome} - ${endereco.trim()}`
      : ''

    const dadosPedido = {
      ...pedido,
      nome: nome.trim(),
      telefone: telefone.trim(),
      tipo_entrega: tipoEntrega,
      endereco: enderecoCompleto,
      regiao_entrega: tipoEntrega === 'entrega' ? regiaoEntrega.nome : '',
      observacao: observacao.trim(),
      forma_pagamento: formaPagamento,
      troco_para:
        formaPagamento === 'dinheiro' && trocoPara.trim() ? trocoNumero : null,
      taxa_entrega: valorEntrega,
      quantidade_marmitas: quantidadeMarmitas,
      preco_marmita: totalMarmitas,
      preco_bebida: subtotalBebida,
      preco: totalFinal,
      valor_cobrar: totalFinal,
      origem: 'cliente_comum'
    }

    try {
      const resposta = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': chaveIdempotenciaRef.current
        },
        body: JSON.stringify(dadosPedido)
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        if (resposta.status < 500) chaveIdempotenciaRef.current = null
        alert(dados.erro || 'Erro ao enviar pedido.')
        setEnviando(false)
        return
      }

      const pedidoCompleto = {
        ...dadosPedido,
        id: dados.id,
        codigo_rastreio: dados.codigo_rastreio
      }
      chaveIdempotenciaRef.current = null

      if (typeof window !== 'undefined') {
        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoCompleto))
      }

      enviarPedido(pedidoCompleto)
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
          title="Voltar"
        >
          <IconeVoltar size={16} />
          <span>Voltar</span>
        </button>

        <div className="cc-logo" style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: '#6E2636', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '0.5px', fontWeight: 700 }}>
            EL SHADDAY
          </h1>
          <span style={{ color: '#8A6D3B', fontSize: '10px', letterSpacing: '2px', display: 'block', marginTop: '1px', fontWeight: 600 }}>
            — RESTAURANTE —
          </span>
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
              <label>Nome e Sobrenome</label>
              <input
                type="text"
                placeholder="Digite seu nome e sobrenome"
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

            {/* SELEÇÃO DE REGIÃO E TAXA DE ENTREGA */}
            {tipoEntrega === 'entrega' && (
              <>
                <div className="cc-campo cc-campo-endereco">
                  <label>Região de entrega</label>
                  <div className="cc-regioes-grade">
                    {REGIOES_ENTREGA.map((reg) => {
                      const ativo = regiaoEntrega.id === reg.id
                      return (
                        <button
                          type="button"
                          key={reg.id}
                          className={`cc-regiao-btn ${ativo ? 'ativo' : ''}`}
                          onClick={() => setRegiaoEntrega(reg)}
                        >
                          <span className="cc-regiao-nome">{reg.nome}</span>
                          <span className="cc-regiao-taxa">
                            R$ {reg.taxa.toFixed(2).replace('.', ',')}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {regiaoEntrega.id === 'demais' && (
                    <p className="cc-regiao-aviso">
                      ℹ️ Válido para bairros próximos (raio de até ~15 km). Endereços muito distantes serão confirmados pela loja.
                    </p>
                  )}
                </div>

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
              </>
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
                <span className="cc-resumo-item-nome">
                  {quantidadeMarmitas > 1 ? `Marmitas Tradicionais (${quantidadeMarmitas})` : 'Marmita Tradicional'}
                </span>
                <span className="cc-resumo-item-preco">
                  R$ {totalMarmitas.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="cc-resumo-quantidade" aria-label="Quantidade de marmitas">
                <span>Quantidade (mesma seleção)</span>
                <div className="cc-quantidade-controles">
                  <button type="button" onClick={() => setQuantidadeMarmitas((quantidade) => Math.max(1, quantidade - 1))} aria-label="Diminuir quantidade">−</button>
                  <span>{quantidadeMarmitas}</span>
                  <button type="button" onClick={() => setQuantidadeMarmitas((quantidade) => Math.min(20, quantidade + 1))} aria-label="Aumentar quantidade">+</button>
                </div>
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

              {/* TAXA DE ENTREGA DINÂMICA CONFORME REGIÃO */}
              <div className="cc-resumo-linha cc-resumo-linha-taxa">
                <span className="cc-resumo-item-nome">
                  Taxa de Entrega {tipoEntrega === 'entrega' && `(${regiaoEntrega.nome})`}
                </span>
                <span className={`cc-resumo-item-preco ${tipoEntrega === 'retirada' ? 'taxa-gratis' : ''}`}>
                  {tipoEntrega === 'entrega'
                    ? `R$ ${valorEntrega.toFixed(2).replace('.', ',')}`
                    : 'Grátis'}
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
