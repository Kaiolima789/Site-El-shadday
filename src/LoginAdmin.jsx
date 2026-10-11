import { useState } from 'react'
import './LoginAdmin.css'

function LoginAdmin({ voltar, onLoginSucesso }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Senha padrão inicial do dono (altere para a senha que desejar)
  const SENHA_MESTRA = 'admin123'

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!senha.trim()) {
      setErro('Digite a senha de administrador.')
      return
    }

    if (senha.trim() === SENHA_MESTRA) {
      localStorage.setItem('elshadday_admin_autenticado', 'true')
      onLoginSucesso()
    } else {
      setErro('Senha incorreta. Acesso restrito ao dono.')
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

          <button type="submit" className="login-admin-btn-entrar">
            Entrar no Painel →
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