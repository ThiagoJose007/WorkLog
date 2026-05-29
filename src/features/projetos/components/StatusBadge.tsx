import type { ProjetoStatus, DemandaStatus, DemandaTipo, DemandaPrioridade } from '../../../db/types'

// ── Projeto ──────────────────────────────────────────────────────────────────

const PROJETO_STATUS: Record<
  ProjetoStatus,
  { label: string; bg: string; text: string }
> = {
  ativo:     { label: 'Ativo',     bg: '#042C53', text: '#B5D4F4' },
  pausado:   { label: 'Pausado',   bg: '#412402', text: '#FAC775' },
  concluido: { label: 'Concluído', bg: '#04342C', text: '#9FE1CB' },
  cancelado: { label: 'Cancelado', bg: '#791F1F', text: '#F7C1C1' },
}

export function ProjetoStatusBadge({ status }: { status: ProjetoStatus }) {
  const cfg = PROJETO_STATUS[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}

// ── Demanda status ────────────────────────────────────────────────────────────

const DEMANDA_STATUS: Record<
  DemandaStatus,
  { label: string; bg: string; text: string }
> = {
  backlog:   { label: 'Backlog',   bg: '#2C2C2A', text: '#9C9A92' },
  andamento: { label: 'Andamento', bg: '#042C53', text: '#85B7EB' },
  revisao:   { label: 'Revisão',   bg: '#412402', text: '#FAC775' },
  concluida: { label: 'Concluída', bg: '#04342C', text: '#9FE1CB' },
  cancelada: { label: 'Cancelada', bg: '#791F1F', text: '#F7C1C1' },
}

export function DemandaStatusBadge({ status }: { status: DemandaStatus }) {
  const cfg = DEMANDA_STATUS[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}

// ── Demanda tipo ──────────────────────────────────────────────────────────────

const DEMANDA_TIPO: Record<DemandaTipo, { label: string; icon: string }> = {
  tarefa:      { label: 'Tarefa',      icon: '▪' },
  reuniao:     { label: 'Reunião',     icon: '◈' },
  alinhamento: { label: 'Alinhamento', icon: '◉' },
}

export function DemandaTipoBadge({ tipo }: { tipo: DemandaTipo }) {
  const cfg = DEMANDA_TIPO[tipo]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
        border: '0.5px solid var(--border)',
      }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

// ── Demanda prioridade ────────────────────────────────────────────────────────

const DEMANDA_PRIORIDADE: Record<
  DemandaPrioridade,
  { label: string; color: string }
> = {
  baixa:   { label: 'Baixa',   color: '#9C9A92' },
  media:   { label: 'Média',   color: '#85B7EB' },
  alta:    { label: 'Alta',    color: '#FAC775' },
  urgente: { label: 'Urgente', color: '#F7C1C1' },
}

export function DemandaPrioridadeDot({
  prioridade,
}: {
  prioridade: DemandaPrioridade
}) {
  const cfg = DEMANDA_PRIORIDADE[prioridade]
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      style={{ color: cfg.color }}
      title={`Prioridade: ${cfg.label}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}
