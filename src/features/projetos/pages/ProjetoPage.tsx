import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  Clock,
  Layers,
  Users,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useProjeto, useProjetoStats } from '../../../db/hooks/useProjetos'
import { useEmpresa } from '../../../db/hooks/useEmpresas'
import { useDemandas } from '../../../db/hooks/useDemandas'
import { ProjetoStatusBadge, DemandaStatusBadge, DemandaTipoBadge, DemandaPrioridadeDot } from '../components/StatusBadge'
import { ProjetoModal } from '../components/ProjetoModal'
import { formatarTempo, formatarData } from '../../../shared/utils/time'

type Tab = 'demandas' | 'membros' | 'sobre'

// ── Sub-componentes de tab ────────────────────────────────────────────────────

function DemandasTab({ projetoId }: { projetoId: string }) {
  const demandas = useDemandas(projetoId)

  if (demandas === undefined) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          />
        ))}
      </div>
    )
  }

  if (demandas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}
        >
          <Layers size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Nenhuma demanda
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          As demandas do projeto aparecerão aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 py-2">
      {demandas.map((demanda) => (
        <div
          key={demanda.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
          style={{ border: '0.5px solid transparent' }}
        >
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <DemandaTipoBadge tipo={demanda.tipo} />
            <span
              className="text-sm truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {demanda.titulo}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DemandaPrioridadeDot prioridade={demanda.prioridade} />
            <DemandaStatusBadge status={demanda.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MembrosTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}
      >
        <Users size={20} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Membros do projeto
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Em construção — disponível em breve
      </p>
    </div>
  )
}

function SobreTab({
  projetoId,
  accentColor,
  onEdit,
}: {
  projetoId: string
  accentColor: string
  onEdit: () => void
}) {
  const projeto = useProjeto(projetoId)
  if (!projeto) return null

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Status', value: <ProjetoStatusBadge status={projeto.status} /> },
    {
      label: 'Data início',
      value: (
        <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          {formatarData(projeto.data_inicio)}
        </span>
      ),
    },
    {
      label: 'Data fim',
      value: projeto.data_fim ? (
        <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          {formatarData(projeto.data_fim)}
        </span>
      ) : (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Não definida</span>
      ),
    },
    {
      label: 'Criado em',
      value: (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ]

  return (
    <div className="py-2 space-y-6">
      {/* Descrição */}
      {projeto.descricao ? (
        <div
          className="p-4 rounded-xl text-sm leading-relaxed"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          {projeto.descricao}
        </div>
      ) : (
        <div
          className="p-4 rounded-xl text-sm italic"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '0.5px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Sem descrição — clique em Editar para adicionar
        </div>
      )}

      {/* Detalhes */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '0.5px solid var(--border)' }}
      >
        {rows.map(({ label, value }, idx) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderTop: idx > 0 ? '0.5px solid var(--border)' : 'none',
              backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
            {value}
          </div>
        ))}
      </div>

      {/* Botão editar */}
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: accentColor, color: '#fff' }}
      >
        <Edit2 size={14} />
        Editar projeto
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function ProjetoPage() {
  const { projetoId } = useParams<{ projetoId: string }>()
  const navigate = useNavigate()
  const projeto = useProjeto(projetoId)
  const empresa = useEmpresa(projeto?.empresa_id)
  const stats = useProjetoStats(projetoId)

  const [activeTab, setActiveTab] = useState<Tab>('demandas')
  const [modalAberto, setModalAberto] = useState(false)

  const accentColor = empresa?.cor_destaque ?? 'var(--accent)'

  // ── Loading ──
  if (projeto === undefined) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
        <div className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
      </div>
    )
  }

  // ── Not found ──
  if (projeto === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Projeto não encontrado
        </p>
        <Link
          to="/projetos"
          className="text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          ← Voltar para projetos
        </Link>
      </div>
    )
  }

  const TABS: Array<{ id: Tab; label: string; icon: React.ElementType; count?: number }> = [
    { id: 'demandas', label: 'Demandas', icon: Layers, count: stats?.demandaCount },
    { id: 'membros', label: 'Membros', icon: Users },
    { id: 'sobre', label: 'Sobre', icon: Info },
  ]

  return (
    <div className="min-h-full flex flex-col">
      {/* ── Header ── */}
      <div
        className="border-b flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="px-6 pt-4 pb-0 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/projetos')}
            className="flex items-center gap-1.5 text-xs mb-3 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={13} />
            {empresa?.nome ?? 'Projetos'}
          </button>

          {/* Título + ações */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h1
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {projeto.nome}
                </h1>
                <ProjetoStatusBadge status={projeto.status} />
              </div>

              {/* Stats resumo */}
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Layers size={12} />
                  {stats?.demandaCount ?? 0} demanda{(stats?.demandaCount ?? 0) !== 1 ? 's' : ''}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Clock size={12} />
                  {formatarTempo(stats?.totalMinutos ?? 0)}
                </span>
                {projeto.data_fim && (
                  <span
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Calendar size={12} />
                    até {formatarData(projeto.data_fim)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setModalAberto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors hover:bg-[var(--bg-elevated)]"
              style={{
                color: 'var(--text-secondary)',
                border: '0.5px solid var(--border)',
              }}
            >
              <Edit2 size={13} />
              Editar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 -mb-px">
            {TABS.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                style={{
                  color:
                    activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: activeTab === id ? accentColor : 'transparent',
                }}
              >
                <Icon size={14} />
                {label}
                {count !== undefined && count > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-normal"
                    style={{
                      backgroundColor: activeTab === id ? accentColor + '28' : 'var(--bg-elevated)',
                      color: activeTab === id ? accentColor : 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Conteúdo da tab ── */}
      <div className="flex-1 px-6 py-4 max-w-4xl mx-auto w-full">
        {activeTab === 'demandas' && projetoId && (
          <DemandasTab projetoId={projetoId} />
        )}
        {activeTab === 'membros' && <MembrosTab />}
        {activeTab === 'sobre' && projetoId && (
          <SobreTab
            projetoId={projetoId}
            accentColor={accentColor}
            onEdit={() => setModalAberto(true)}
          />
        )}
      </div>

      {/* ── Modal de edição ── */}
      {projeto.empresa_id && (
        <ProjetoModal
          projeto={projeto}
          empresaId={projeto.empresa_id}
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
