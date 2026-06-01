import { useState, useMemo } from 'react'
import { Plus, Layers, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { useEmpresaStore } from '../../empresas/store/useEmpresaStore'
import { useEmpresa } from '../../../db/hooks/useEmpresas'
import { useProjetos } from '../../../db/hooks/useProjetos'
import { useDemandasComProjeto } from '../../../db/hooks/useDemandas'
import type { DemandaStatus } from '../../../db/types'
import { DemandaModal } from '../components/DemandaModal'
import { DemandaCard } from '../components/DemandaCard'
import type { Demanda } from '../../../db/types'
import { Link } from 'react-router-dom'

const STATUS_FILTROS: Array<{ value: DemandaStatus | 'todas'; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'andamento', label: 'Andamento' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function DemandasGlobalPage() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresa = useEmpresa(empresaAtivaId)
  const projetos = useProjetos(empresaAtivaId)
  const demandasComProjeto = useDemandasComProjeto(empresaAtivaId)

  const [filtroStatus, setFiltroStatus] = useState<DemandaStatus | 'todas'>('todas')
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const [modalAberto, setModalAberto] = useState(false)
  const [demandaEditando, setDemandaEditando] = useState<Demanda | undefined>()
  const [projetoIdModal, setProjetoIdModal] = useState<string>('')
  const [initialTab, setInitialTab] = useState<'detalhes' | 'timer'>('detalhes')
  const [projetoSelectorAberto, setProjetoSelectorAberto] = useState(false)

  const accentColor = empresa?.cor_destaque ?? 'var(--accent)'

  const demandas = useMemo(() => {
    if (!demandasComProjeto) return undefined
    if (filtroStatus === 'todas') return demandasComProjeto
    return demandasComProjeto.filter(({ demanda }) => demanda.status === filtroStatus)
  }, [demandasComProjeto, filtroStatus])

  const grupos = useMemo(() => {
    if (!demandas) return []
    const map = new Map<string, { projetoNome: string; projetoId: string; items: typeof demandas }>()
    for (const x of demandas) {
      const pid = x.projeto.id
      if (!map.has(pid)) map.set(pid, { projetoNome: x.projeto.nome, projetoId: pid, items: [] })
      map.get(pid)!.items.push(x)
    }
    return Array.from(map.values())
  }, [demandas])

  function toggleExpand(pid: string) {
    setExpandidos((prev) => ({ ...prev, [pid]: prev[pid] === false ? true : false }))
  }

  function isExpanded(pid: string) {
    return expandidos[pid] !== false // default: expanded
  }

  function abrirNovaDemanda(projetoId: string) {
    setDemandaEditando(undefined)
    setProjetoIdModal(projetoId)
    setInitialTab('detalhes')
    setModalAberto(true)
    setProjetoSelectorAberto(false)
  }

  function abrirEditar(demanda: Demanda, tab: 'detalhes' | 'timer' = 'detalhes') {
    setDemandaEditando(demanda)
    setProjetoIdModal(demanda.projeto_id)
    setInitialTab(tab)
    setModalAberto(true)
  }

  // ── Guard: sem empresa ────────────────────────────────────────────────────

  if (!empresaAtivaId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}>
          <Layers size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nenhuma empresa selecionada</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Selecione uma empresa para ver as demandas</p>
          <Link to="/empresas" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
            Ir para Empresas <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  // ── Guard: sem projetos ───────────────────────────────────────────────────

  if (projetos !== undefined && projetos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}>
          <Layers size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nenhum projeto cadastrado</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Crie um projeto primeiro para adicionar demandas</p>
          <Link to="/projetos" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: accentColor, color: '#fff' }}>
            Ir para Projetos <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const totalDemandas = demandasComProjeto?.length ?? 0

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {empresa && (
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-2" style={{ backgroundColor: accentColor + '22', color: accentColor, border: `0.5px solid ${accentColor}44` }}>
              {empresa.nome}
            </span>
          )}
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Demandas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {demandasComProjeto === undefined ? 'Carregando…' : `${totalDemandas} demanda${totalDemandas !== 1 ? 's' : ''} no total`}
          </p>
        </div>

        {/* Botão nova demanda — abre seletor de projeto */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProjetoSelectorAberto((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            <Plus size={15} />
            Nova demanda
            <ChevronDown size={13} />
          </button>
          {projetoSelectorAberto && projetos && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-20"
              style={{ minWidth: '200px', backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border-hover)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
            >
              <p className="px-3 pt-3 pb-1 text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Selecionar projeto
              </p>
              {projetos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => abrirNovaDemanda(p.id)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-surface)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_FILTROS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFiltroStatus(value)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filtroStatus === value ? accentColor : 'var(--bg-surface)',
              color: filtroStatus === value ? '#fff' : 'var(--text-secondary)',
              border: `0.5px solid ${filtroStatus === value ? accentColor : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Skeleton */}
      {demandas === undefined && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {demandas !== undefined && demandas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}>
            <Layers size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {filtroStatus === 'todas' ? 'Nenhuma demanda cadastrada' : `Nenhuma demanda com status "${filtroStatus}"`}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filtroStatus === 'todas' ? 'Clique em "Nova demanda" para criar a primeira' : 'Tente outro filtro'}
          </p>
        </div>
      )}

      {/* Grupos por projeto */}
      {demandas !== undefined && grupos.length > 0 && (
        <div className="space-y-4">
          {grupos.map(({ projetoNome, projetoId, items }) => (
            <div key={projetoId} className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
              {/* Header do grupo */}
              <button
                type="button"
                onClick={() => toggleExpand(projetoId)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2">
                  {isExpanded(projetoId) ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{projetoNome}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {items.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); abrirNovaDemanda(projetoId) }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors hover:bg-[var(--bg-base)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Plus size={11} /> Nova
                </button>
              </button>

              {/* Demandas do grupo */}
              {isExpanded(projetoId) && (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {items.map(({ demanda }) => (
                    <div key={demanda.id} className="px-2 py-1.5" style={{ backgroundColor: 'var(--bg-base)' }}>
                      <DemandaCard
                        demanda={demanda}
                        onClick={() => abrirEditar(demanda, 'detalhes')}
                        onTimerClick={() => abrirEditar(demanda, 'timer')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fechar dropdown ao clicar fora */}
      {projetoSelectorAberto && (
        <div className="fixed inset-0 z-10" onClick={() => setProjetoSelectorAberto(false)} />
      )}

      {/* Modal */}
      {projetoIdModal && (
        <DemandaModal
          demanda={demandaEditando}
          projetoId={projetoIdModal}
          isOpen={modalAberto}
          initialTab={initialTab}
          onClose={() => { setModalAberto(false); setDemandaEditando(undefined) }}
        />
      )}
    </div>
  )
}
