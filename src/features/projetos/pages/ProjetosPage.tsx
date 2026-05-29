import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, ArrowRight } from 'lucide-react'
import { useProjetos } from '../../../db/hooks/useProjetos'
import { useEmpresa } from '../../../db/hooks/useEmpresas'
import { useEmpresaStore } from '../../empresas/store/useEmpresaStore'
import { ProjetoCard } from '../components/ProjetoCard'
import { ProjetoModal } from '../components/ProjetoModal'
import type { Projeto } from '../../../db/types'

export function ProjetosPage() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresa = useEmpresa(empresaAtivaId)
  const projetos = useProjetos(empresaAtivaId)

  const [modalAberto, setModalAberto] = useState(false)
  const [projetoEditando, setProjetoEditando] = useState<Projeto | undefined>()

  const accentColor = empresa?.cor_destaque ?? 'var(--accent)'

  function handleEditar(e: React.MouseEvent, projeto: Projeto) {
    e.stopPropagation()
    e.preventDefault()
    setProjetoEditando(projeto)
    setModalAberto(true)
  }

  function handleNovo() {
    setProjetoEditando(undefined)
    setModalAberto(true)
  }

  function handleFecharModal() {
    setModalAberto(false)
    setProjetoEditando(undefined)
  }

  // ── Guard: sem empresa ativa ─────────────────────────────────────────────
  if (!empresaAtivaId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}
        >
          <FolderKanban size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma empresa selecionada
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Selecione uma empresa para ver seus projetos
          </p>
          <Link
            to="/empresas"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Ir para Empresas <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {empresa && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: accentColor + '22',
                  color: accentColor,
                  border: `0.5px solid ${accentColor}44`,
                }}
              >
                {empresa.nome}
              </span>
            )}
          </div>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Projetos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {projetos === undefined
              ? 'Carregando…'
              : projetos.length === 0
              ? 'Nenhum projeto ainda'
              : `${projetos.length} projeto${projetos.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <button
          onClick={handleNovo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: accentColor, color: '#fff' }}
        >
          <Plus size={15} />
          Novo projeto
        </button>
      </div>

      {/* ── Skeleton ── */}
      {projetos === undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {projetos !== undefined && projetos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
            }}
          >
            <FolderKanban size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Nenhum projeto cadastrado
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Crie o primeiro projeto para começar a organizar suas demandas
          </p>
          <button
            onClick={handleNovo}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            <Plus size={14} />
            Criar projeto
          </button>
        </div>
      )}

      {/* ── Grid de projetos ── */}
      {projetos !== undefined && projetos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projetos.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              accentColor={accentColor}
              onEdit={(e) => handleEditar(e, projeto)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {empresaAtivaId && (
        <ProjetoModal
          projeto={projetoEditando}
          empresaId={empresaAtivaId}
          isOpen={modalAberto}
          onClose={handleFecharModal}
        />
      )}
    </div>
  )
}
