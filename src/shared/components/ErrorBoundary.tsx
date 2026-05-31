import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WorkLog] Erro capturado pelo ErrorBoundary:', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0E0E0C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#161614',
            border: '0.5px solid #791F1F',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#F7C1C1', marginBottom: '8px' }}>
            Erro na aplicação
          </p>
          <p style={{ fontSize: '12px', color: '#9C9A92', marginBottom: '16px' }}>
            Abra o Console do navegador (F12) para ver detalhes completos.
          </p>
          <pre
            style={{
              fontSize: '11px',
              color: '#F7C1C1',
              backgroundColor: '#791F1F33',
              border: '0.5px solid #791F1F',
              borderRadius: '8px',
              padding: '12px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
            {error.stack ? '\n\n' + error.stack : ''}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#791F1F',
              color: '#F7C1C1',
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }
}
