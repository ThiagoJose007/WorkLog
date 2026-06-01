import { Clock } from 'lucide-react'
import type { Demanda } from '../../../db/types'
import { useTotalMinutosDemanda } from '../../../db/hooks/useDemandas'
import {
  DemandaStatusBadge,
  DemandaTipoBadge,
  DemandaPrioridadeDot,
} from '../../projetos/components/StatusBadge'
import { formatarTempo } from '../../../shared/utils/time'

interface DemandaCardProps {
  demanda: Demanda
  onClick: () => void
  onTimerClick?: () => void
}

export function DemandaCard({ demanda, onClick, onTimerClick }: DemandaCardProps) {
  const totalMinutos = useTotalMinutosDemanda(demanda.id) ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl transition-all duration-150 hover:translate-y-[-1px]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium mb-2 leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {demanda.titulo}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <DemandaTipoBadge tipo={demanda.tipo} />
              <DemandaPrioridadeDot prioridade={demanda.prioridade} />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DemandaStatusBadge status={demanda.status} />
            <div className="flex items-center gap-1.5">
              {totalMinutos > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={11} />
                  {formatarTempo(totalMinutos)}
                </span>
              )}
              {onTimerClick && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTimerClick() }}
                  className="p-1 rounded transition-colors hover:bg-[var(--color-tempo-fill)]"
                  style={{ color: 'var(--color-tempo-text)' }}
                  title="Abrir timer"
                >
                  <Clock size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
