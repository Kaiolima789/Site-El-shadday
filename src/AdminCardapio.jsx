import { useState } from 'react'
import './AdminCardapio.css'

function AdminCardapio() {
  const [data, setData] = useState('')
  const [preco, setPreco] = useState('')

  return (
    <div className="admin-page">

      <header className="admin-header">
        <div>
          <span>EL SHADDAY</span>
          <h1>PAINEL DO RESTAURANTE</h1>
        </div>
      </header>

      <main className="admin-content">

        <section className="admin-card">

          <h2>📋 Criar cardápio</h2>

          <p className="admin-subtitulo">
            Prepare o cardápio que estará disponível para os clientes.
          </p>

          <div className="campo">
            <label>Data do cardápio</label>

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Preço da marmita</label>

            <input
              type="number"
              step="0.01"
              placeholder="18.00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>

          <button className="salvar-cardapio-btn">
            SALVAR CARDÁPIO
          </button>

        </section>

      </main>

    </div>
  )
}

export default AdminCardapio
