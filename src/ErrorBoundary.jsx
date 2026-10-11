import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px',
          maxWidth: '650px',
          margin: '40px auto',
          background: '#FFF5F5',
          border: '1.5px solid #FEB2B2',
          borderRadius: '10px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#9B1C1C', marginTop: 0 }}>Ocorreu um erro na renderização</h2>
          <p style={{ color: '#4A5568' }}>Detalhes do erro:</p>
          <pre style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            color: '#C53030',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '14px',
              padding: '10px 18px',
              background: '#6E2636',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary