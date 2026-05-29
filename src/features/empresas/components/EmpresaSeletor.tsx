import { Link } from 'react-router-dom'
import { ChevronDown, Plus, Loader2 } from 'lucide-react'
import { useEmpresaStore } from '../store/useEmpresaStore'
import { useEmpresas, useEmpresa } from '../../../db/hooks/useEmpresas'

export function EmpresaSeletor() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresas = useEmpresas()
  const empresaAtiva = useEmpresa(empresaAtivaId)

  // Carregando dados do Dexie
  if (empresas === undefined) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Carregando…
        </span>
      </div>
    )
  }

  // Nenhuma empresa cadastrada
  if (empresas.length === 0) {
    return (
      <Link
        to="/empresas"
        className="group flex items-center gap-2.5 px-3 py-3 border-b transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
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
            className="text-xs font-medium group-hover:text-[var(--accent-hover)] transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Criar empresa →
          </p>
        </div>
      </Link>
    )
  }

  // Empresas existem mas nenhuma está selecionada
  if (!empresaAtiva) {
    return (
      <Link
        to="/empresas"
        className="group flex items-center gap-2.5 px-3 py-3 border-b transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px dashed var(--border-hover)',
          }}
        >
          <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {empresas.length} empresa{empresas.length > 1 ? 's' : ''}
          </p>
          <p
            className="text-xs font-medium group-hover:text-[var(--accent-hover)] transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Selecionar →
          </p>
        </div>
      </Link>
    )
  }

  const cor = empresaAtiva.cor_destaque
  const inicial = empresaAtiva.nome.charAt(0).toUpperCase()

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      {/* Barra de cor de destaque da empresa */}
      <div className="h-0.5" style={{ backgroundColor: cor }} />

      <Link
        to="/empresas"
        className="group flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--bg-elevated)]"
      >
        {/* Avatar com cor de destaque */}
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
          style={{
            backgroundColor: cor + '28',
            color: cor,
            border: `1px solid ${cor}55`,
          }}
        >
          {empresaAtiva.logo_base64 ? (
            <img
              src={empresaAtiva.logo_base64}
              alt={empresaAtiva.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            inicial
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="truncate leading-tight"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Empresa ativa
          </p>
          <p
            className="text-sm font-medium truncate leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {empresaAtiva.nome}
          </p>
        </div>

        <ChevronDown
          size={13}
          className="flex-shrink-0 transition-colors group-hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-muted)' }}
        />
      </Link>
    </div>
  )
}
