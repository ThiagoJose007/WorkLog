import { Link } from 'react-router-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { useEmpresaStore } from '../store/useEmpresaStore'

export function EmpresaSeletor() {
  const { empresaAtiva, empresas } = useEmpresaStore()

  if (empresas.length === 0 || !empresaAtiva) {
    return (
      <Link
        to="/empresas"
        className="group flex items-center gap-2.5 px-3 py-3 border-b transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px dashed var(--border-hover)',
          }}
        >
          <Plus size={13} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Nenhuma empresa
          </p>
          <p
            className="text-xs font-medium transition-colors group-hover:text-[var(--accent-hover)]"
            style={{ color: 'var(--accent)' }}
          >
            Criar ou selecionar →
          </p>
        </div>
      </Link>
    )
  }

  const initial = empresaAtiva.nome.charAt(0).toUpperCase()
  const cor = empresaAtiva.cor_destaque

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      {/* Barra de destaque da empresa */}
      <div className="h-0.5" style={{ backgroundColor: cor }} />

      <Link
        to="/empresas"
        className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--bg-elevated)]"
      >
        {/* Avatar com cor de destaque */}
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: cor + '28',
            color: cor,
            border: `1px solid ${cor}44`,
          }}
        >
          {empresaAtiva.logo_base64 ? (
            <img
              src={empresaAtiva.logo_base64}
              alt={empresaAtiva.nome}
              className="w-full h-full rounded object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate leading-tight"
            style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Empresa ativa
          </p>
          <p className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
            {empresaAtiva.nome}
          </p>
        </div>

        <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </Link>
    </div>
  )
}
