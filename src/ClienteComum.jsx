import { useState } from 'react'
import './ClienteComum.css'
import FormaPagamento from './FormaPagamento'

function ClienteComum({ voltar, pedido, enviarPedido }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState('retirada')
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [trocoPara, setTrocoPara] = useState('')
  const [enviando, setEnviando] = useState(false)

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

    // Troco (opcional): precisa ser maior ou igual ao valor do pedido
    const trocoNumero = Number(String(trocoPara).replace(',', '.'))

    if (formaPagamento === 'dinheiro' && trocoPara.trim()) {
      if (Number.isNaN(trocoNumero) || trocoNumero < Number(pedido?.preco || 0)) {
        alert(`O valor do troco deve ser maior ou igual ao total do pedido (R$ ${Number(pedido?.preco || 0).toFixed(2)}).`)
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
      observacao,
      forma_pagamento: formaPagamento,
      troco_para:
        formaPagamento === 'dinheiro' && trocoPara.trim() ? trocoNumero : null,
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

      alert('Pedido enviado para aprovação!')

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

  return (
    <div className="cc-page">

      <header className="cc-header">
        <button className="cc-voltar" onClick={voltar}>
          ←
        </button>

        <div>
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>
      </header>

      <main className="cc-conteudo">

        <div className="cc-icon">🍱</div>

        <h2>DADOS DO PEDIDO</h2>

        <p>Informe seus dados para enviar o pedido para aprovação.</p>

        <div className="cc-card">

          <label>Nome</label>
          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label>Telefone / WhatsApp</label>
          <input
            type="tel"
            placeholder="(61) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <label>Como deseja receber?</label>
          <div className="cc-toggle">
            <button
              type="button"
              className={tipoEntrega === 'retirada' ? 'cc-toggle-btn ativo' : 'cc-toggle-btn'}
              onClick={() => setTipoEntrega('retirada')}
            >
              🏪 Retirar no local
            </button>
            <button
              type="button"
              className={tipoEntrega === 'entrega' ? 'cc-toggle-btn ativo' : 'cc-toggle-btn'}
              onClick={() => setTipoEntrega('entrega')}
            >
              🛵 Entrega
            </button>
          </div>

          {tipoEntrega === 'entrega' && (
            <>
              <label>Endereço de entrega</label>
              <input
                type="text"
                placeholder="Rua, número, quadra, referência"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </>
          )}

          <FormaPagamento
            valor={formaPagamento}
            onChange={setFormaPagamento}
            troco={trocoPara}
            onTrocoChange={setTrocoPara}
          />

          <label>Observação</label>
          <textarea
            placeholder="Alguma observação? (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

        </div>

        <button
          className="cc-continuar"
          onClick={enviar}
          disabled={enviando}
        >
          {enviando ? 'ENVIANDO...' : 'ENVIAR PEDIDO →'}
        </button>

      </main>

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="nav-inferior">

        <button onClick={voltar} className="nav-item">
          <span>🏠</span>
          Início
        </button>

        <button className="nav-item nav-item-ativo">
          <span>🍱</span>
          Marmitas
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: pedidos para consumir no local.')}
        >
          <span>🏪</span>
          No Local
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: acompanhamento de pedidos por aqui.')}
        >
          <span>📋</span>
          Pedidos
        </button>

        <button
          className="nav-item"
          onClick={() => alert('Em breve: seu perfil.')}
        >
          <span>👤</span>
          Perfil
        </button>

      </nav>

    </div>
  )
}

export default ClienteComum
