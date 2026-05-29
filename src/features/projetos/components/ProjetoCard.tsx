import { useNavigate } from 'react-router-dom'
import { Clock, Layers, ChevronRight, Edit2 } from 'lucide-react'
import type { Projeto } from '../../../db/types'
import { useProjetoStats } from '../../../db/hooks/useProjetos'
import { ProjetoStatusBadge } from './StatusBadge'
import { formatarTempo } from '../../../shared/utils/time'

interface ProjetoCardProps {
  projeto: Projeto
  accentColor: string
  onEdit: (e: React.MouseEvent) => void
}

export function ProjetoCard({ projeto, accentColor, onEdit }: ProjetoCardProps) {
  const navigate = useNavigate()
  const stats = useProjetoStats(projeto.id)

  const demandaCount = stats?.demandaCount ?? 0
  const totalMinutos = stats?.totalMinutos ?? 0

  return (
    <button
      type="button"
      onClick={() => navigate(`/projetos/${projeto.id}`)}
      className="group w-full text-left rounded-xl overflow-hidden transition-all duration-150 hover:translate-y-[-1px]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor + '66'
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}22`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      {/* Barra de cor de destaque */}
      <div className="h-0.5" style={{ backgroundColor: accentColor }} />

      <div className="p-4">
        {/* Header: nome + chevron */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate leading-snug mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {projeto.nome}
            </p>
            <ProjetoStatusBadge status={projeto.status} />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {/* Botão editar (não navega) */}
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--text-muted)' }}
              title="Editar projeto"
            >
              <Edit2 size={13} />
            </button>
            <ChevronRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Descrição */}
        {projeto.descricao && (
          <p
            className="text-xs mb-3 line-clamp-2 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {projeto.descricao}
          </p>
        )}

        {/* Stats */}
        <div
          className="flex items-center gap-4 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <Layers size={12} />
            {demandaCount === 0
              ? 'Nenhuma demanda'
              : `${demandaCount} demanda${demandaCount > 1 ? 's' : ''}`}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <Clock size={12} />
            {formatarTempo(totalMinutos)}
          </span>
        </div>
      </div>
    </button>
  )
}
