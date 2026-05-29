import { useState } from 'react'
import { Edit2, Archive, ArchiveRestore, CheckCircle2 } from 'lucide-react'
import type { Empresa } from '../../../db/types'
import { arquivarEmpresa, updateEmpresa } from '../../../db/hooks/useEmpresas'

interface EmpresaCardProps {
  empresa: Empresa
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
}

export function EmpresaCard({ empresa, isActive, onSelect, onEdit }: EmpresaCardProps) {
  const [confirmando, setConfirmando] = useState(false)
  const isArquivada = empresa.status === 'arquivado'
  const cor = empresa.cor_destaque

  async function handleArquivar() {
    await arquivarEmpresa(empresa.id)
    setConfirmando(false)
  }

  async function handleRestaurar() {
    await updateEmpresa(empresa.id, { status: 'ativo' })
  }

  return (
    <div
      className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-150"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: isActive ? `1px solid ${cor}` : '0.5px solid var(--border)',
        boxShadow: isActive ? `0 0 0 3px ${cor}22` : 'none',
        opacity: isArquivada ? 0.6 : 1,
      }}
    >
      {/* Barra de cor de destaque */}
      <div
        className="h-1 flex-shrink-0"
        style={{ backgroundColor: isArquivada ? 'var(--border)' : cor }}
      />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Avatar + info */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
            style={{
              backgroundColor: isArquivada ? 'var(--bg-elevated)' : cor + '28',
              color: isArquivada ? 'var(--text-muted)' : cor,
              border: `1px solid ${isArquivada ? 'var(--border)' : cor + '44'}`,
            }}
          >
            {empresa.logo_base64 ? (
              <img
                src={empresa.logo_base64}
                alt={empresa.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              empresa.nome.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {empresa.nome}
              </p>
              {isActive && !isArquivada && (
                <CheckCircle2 size={13} style={{ color: cor, flexShrink: 0 }} />
              )}
            </div>

            {empresa.cnpj && (
              <p
                className="text-xs font-mono mt-0.5 truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {empresa.cnpj}
              </p>
            )}

            {isArquivada && (
              <span
                className="inline-flex items-center text-xs px-1.5 py-0.5 rounded mt-1"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '0.5px solid var(--border)',
                  fontSize: '10px',
                  letterSpacing: '0.03em',
                }}
              >
                Arquivada
              </span>
            )}
          </div>
        </div>

        {/* Confirmação inline de arquivamento */}
        {confirmando ? (
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
            }}
          >
            <p className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Arquivar empresa?
            </p>
            <button
              onClick={handleArquivar}
              className="text-xs px-2 py-1 rounded font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-danger-fill)',
                color: 'var(--color-danger-text)',
              }}
            >
              Arquivar
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Botão principal: Selecionar ou Restaurar */}
            {isArquivada ? (
              <button
                onClick={handleRestaurar}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
                style={{
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border)',
                }}
              >
                <ArchiveRestore size={12} />
                Restaurar
              </button>
            ) : (
              <button
                onClick={onSelect}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
                style={
                  isActive
                    ? {
                        backgroundColor: cor + '22',
                        color: cor,
                        border: `0.5px solid ${cor}66`,
                      }
                    : {
                        backgroundColor: cor,
                        color: '#fff',
                        border: 'none',
                      }
                }
              >
                {isActive ? '✓ Ativa' : 'Selecionar'}
              </button>
            )}

            {/* Editar */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-elevated)]"
              style={{
                color: 'var(--text-muted)',
                border: '0.5px solid var(--border)',
              }}
              title="Editar empresa"
            >
              <Edit2 size={13} />
            </button>

            {/* Arquivar (só para ativas) */}
            {!isArquivada && (
              <button
                onClick={() => setConfirmando(true)}
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-elevated)]"
                style={{
                  color: 'var(--text-muted)',
                  border: '0.5px solid var(--border)',
                }}
                title="Arquivar empresa"
              >
                <Archive size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
