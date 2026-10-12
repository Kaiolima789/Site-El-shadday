import { useState } from 'react'
import './LoginAdmin.css'
import { API_URL } from './config'

function LoginAdmin({ voltar, onLoginSucesso }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!senha) {
      setErro('Digite a senha de administrador.')
      return
    }

    setCarregando(true)
    try {
      const resposta = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      })
      const dados = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        setErro(dados.erro || 'N\u00e3o foi poss\u00edvel entrar no painel.')
        return
      }
      sessionStorage.setItem('elshadday_admin_token', dados.token)
      onLoginSucesso(dados.token)
    } catch (erroRequisicao) {
      console.error(erroRequisicao)
      setErro('N\u00e3o foi poss\u00edvel conectar ao servidor. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-admin-page">
      <div className="login-admin-card">
        <div className="login-admin-logo">
          <h1>EL SHADDAY</h1>
          <span>— RESTAURANTE —</span>
        </div>

        <div className="login-admin-icone">🔒</div>

        <h2>Área do Restaurante</h2>
        <p>Acesso exclusivo para gerenciar pedidos e cardápio.</p>

        {erro && <div className="login-admin-erro">{erro}</div>}

        <form onSubmit={handleSubmit} className="login-admin-form">
          <div className="login-admin-campo">
            <label htmlFor="senha-admin">Senha de Acesso</label>
            <div className="login-admin-input-wrapper">
              <input
                id="senha-admin"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Digite a senha do dono"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="login-admin-ver-senha"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {mostrarSenha ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-admin-btn-entrar" disabled={carregando}>
            {carregando ? 'Verificando...' : 'Entrar no Painel \u2192'}
          </button>
        </form>

        <button type="button" className="login-admin-btn-voltar" onClick={voltar}>
          ← Voltar ao site de pedidos
        </button>
      </div>
    </div>
  )
}

export default LoginAdmin