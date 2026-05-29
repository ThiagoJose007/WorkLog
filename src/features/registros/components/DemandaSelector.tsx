import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { useProjetos } from '../../../db/hooks/useProjetos'
import { useDemandasDeProjetos } from '../../../db/hooks/useDemandas'
import { DemandaTipoBadge, DemandaStatusBadge } from '../../projetos/components/StatusBadge'

interface DemandaSelectorProps {
  empresaId: string
  linkedIds: string[]
  onVincular: (demandaId: string) => Promise<void>
}

export function DemandaSelector({ empresaId, linkedIds, onVincular }: DemandaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const projetos = useProjetos(empresaId)
  const projetoIds = useMemo(() => projetos?.map((p) => p.id) ?? [], [projetos])
  const todasDemandas = useDemandasDeProjetos(projetoIds)

  const projetoMap = useMemo(
    () => new Map(projetos?.map((p) => [p.id, p]) ?? []),
    [projetos],
  )

  // Filter + group by projeto
  const groups = useMemo(() => {
    if (!todasDemandas || !projetos) return []

    const filtered = todasDemandas.filter(
      (d) =>
        d.status !== 'cancelada' &&
        !linkedIds.includes(d.id) &&
        (!search || d.titulo.toLowerCase().includes(search.toLowerCase())),
    )

    const map = new Map<string, { nome: string; demandas: typeof filtered }>()
    for (const d of filtered) {
      if (!map.has(d.projeto_id)) {
        map.set(d.projeto_id, {
          nome: projetoMap.get(d.projeto_id)?.nome ?? '—',
          demandas: [],
        })
      }
      map.get(d.projeto_id)!.demandas.push(d)
    }
    return [...map.values()]
  }, [todasDemandas, projetos, linkedIds, search, projetoMap])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  function toggle() {
    setOpen((v) => !v)
    setSearch('')
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ border: '0.5px dashed var(--border)', color: 'var(--text-muted)' }}
      >
        <Plus size={12} />
        Vincular demanda
        <ChevronDown
          size={11}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-30 rounded-xl overflow-hidden"
          style={{
            width: '340px',
            backgroundColor: 'var(--bg-elevated)',
            border: '0.5px solid var(--border-hover)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Busca */}
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderBottom: '0.5px solid var(--border)' }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar demanda…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-0.5 rounded flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Resultados */}
          <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
            {groups.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                {search ? 'Nenhuma demanda encontrada' : 'Nenhuma demanda disponível'}
              </p>
            )}

            {groups.map((group) => (
              <div key={group.nome}>
                {/* Cabeçalho do projeto */}
                <div
                  className="sticky top-0 px-3 py-1.5"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderBottom: '0.5px solid var(--border)',
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-projeto-text)', letterSpacing: '0.02em' }}
                  >
                    {group.nome}
                  </span>
                </div>

                {/* Demandas do projeto */}
                {group.demandas.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={async () => {
                      await onVincular(d.id)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface)]"
                  >
                    <DemandaTipoBadge tipo={d.tipo} />
                    <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {d.titulo}
                    </span>
                    <DemandaStatusBadge status={d.status} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
