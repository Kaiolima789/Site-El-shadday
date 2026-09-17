import { useState } from 'react'
import './Vivendas.css'

function Vivendas({ voltar, pedido, enviarPedido }) {
  const [nome, setNome] = useState('')
  const [loja, setLoja] = useState('')
  const [codigo, setCodigo] = useState('')
  const [observacao, setObservacao] = useState('')

async function enviar() {
  if (!nome || !loja || !codigo) {
    alert('Preencha seu nome, loja e código da Vivendas.')
    return
  }

  try {
    const resposta = await fetch('http://localhost:3000/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...pedido,
        nome,
        loja,
        codigo,
        observacao
      })
    })

    const dados = await resposta.json()

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao enviar pedido.')
      return
    }

    alert('Pedido enviado para aprovação!')

    enviarPedido({
      ...pedido,
      nome,
      loja,
      codigo,
      observacao,
      id: dados.id
    })

  } catch (erro) {
    console.error(erro)
    alert('Não foi possível conectar com o servidor.')
  }
}

  return (
    <div className="vivendas-page">

      <header className="vivendas-header">

        <button
          className="vivendas-voltar"
          onClick={voltar}
        >
          ←
        </button>

        <div>
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

      </header>


      <main className="vivendas-conteudo">

        <div className="vivendas-icon">
          🏢
        </div>

        <h2>DADOS DO PEDIDO</h2>

        <p>
          Informe seus dados para enviar o pedido para aprovação.
        </p>


        <div className="vivendas-card">

          <label>
            Nome
          </label>

          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />


          <label>
            Loja / Unidade
          </label>

          <input
            type="text"
            placeholder="Digite a loja ou unidade"
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
          />


          <label>
            Código do Vivendas ou CPF
          </label>

          <input
            type="text"
            placeholder="Digite o código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />


          <label>
            Observação
          </label>

          <textarea
            placeholder="Alguma observação? (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

        </div>


        <button
          className="vivendas-continuar"
          onClick={enviar}
        >
          ENVIAR PEDIDO →
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

export default Vivendas