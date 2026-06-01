import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import {
  useTimerAtivo,
  useDemandasComProjeto,
  iniciarTimer,
  encerrarTimerAtivo,
} from '../../db/hooks/useDemandas'
import { useDemanda } from '../../db/hooks/useDemandas'
import { useProjeto } from '../../db/hooks/useProjetos'
import { useEmpresaStore } from '../../features/empresas/store/useEmpresaStore'
import { formatarTempo } from '../utils/time'
import { toast } from '../store/useToastStore'

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ── Barra quando há timer ativo ───────────────────────────────────────────────

function ActiveBar({ accentColor }: { accentColor: string }) {
  const timerAtivo = useTimerAtivo()
  const demanda = useDemanda(timerAtivo?.demanda_id)
  const projeto = useProjeto(demanda?.projeto_id)

  const [displayMs, setDisplayMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedAtRef = useRef<number | null>(null)
  const totalPausedRef = useRef(0)

  // Reset ao mudar de timer
  useEffect(() => {
    setPaused(false)
    totalPausedRef.current = 0
    pausedAtRef.current = null
    setDisplayMs(0)
  }, [timerAtivo?.id])

  // Contador
  useEffect(() => {
    if (!timerAtivo?.inicio || paused) return
    const inicio = timerAtivo.inicio
    const tick = () => setDisplayMs(Date.now() - inicio - totalPausedRef.current)
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [timerAtivo?.id, timerAtivo?.inicio, paused])

  if (!timerAtivo) return null

  function handlePause() {
    pausedAtRef.current = Date.now()
    setPaused(true)
  }

  function handleResume() {
    if (pausedAtRef.current !== null) totalPausedRef.current += Date.now() - pausedAtRef.current
    pausedAtRef.current = null
    setPaused(false)
  }

  async function handleStop() {
    if (!timerAtivo) return
    let totalPaused = totalPausedRef.current
    if (paused && pausedAtRef.current !== null) totalPaused += Date.now() - pausedAtRef.current
    const elapsed = Math.max(0, Date.now() - (timerAtivo.inicio ?? Date.now()) - totalPaused)
    await encerrarTimerAtivo(timerAtivo.id, elapsed)
    toast(`Timer encerrado · ${formatarTempo(Math.max(1, Math.round(elapsed / 60000)))}`)
  }

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Indicador */}
      <span
        style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          backgroundColor: paused ? 'var(--color-demanda-text)' : '#4ade80',
          boxShadow: paused ? 'none' : '0 0 6px #4ade8099',
        }}
      />

      {/* Demanda · projeto */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {demanda?.titulo ?? '…'}
        </span>
        {projeto && (
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            · {projeto.nome}
          </span>
        )}
        {paused && (
          <span
            className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--color-demanda-fill)', color: 'var(--color-demanda-text)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Pausado
          </span>
        )}
      </div>

      {/* Tempo */}
      <span
        className="font-mono tabular-nums text-sm flex-shrink-0"
        style={{ color: paused ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.04em' }}
      >
        {fmtMs(displayMs)}
      </span>

      {/* Controles */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {paused ? (
          <button
            type="button"
            onClick={handleResume}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-tempo-fill)', color: 'var(--color-tempo-text)', border: '0.5px solid #1d6b5a' }}
          >
            <Play size={11} />Retomar
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}
          >
            <Pause size={11} />Pausar
          </button>
        )}
        <button
          type="button"
          onClick={handleStop}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-danger-fill)', color: 'var(--color-danger-text)', border: '0.5px solid #b03030' }}
        >
          <Square size={11} fill="currentColor" />Parar
        </button>
      </div>
    </div>
  )
}

// ── Barra quando não há timer ativo ───────────────────────────────────────────

function IdleBar({ accentColor }: { accentColor: string }) {
  const { empresaAtivaId } = useEmpresaStore()
  const demandasComProjeto = useDemandasComProjeto(empresaAtivaId)
  const [selectedId, setSelectedId] = useState('')
  const [starting, setStarting] = useState(false)

  const ativas = demandasComProjeto?.filter(
    ({ demanda }) => demanda.status !== 'cancelada' && demanda.status !== 'concluida'
  ) ?? []

  // Agrupar por projeto
  const grupos = ativas.reduce<Record<string, { projetoNome: string; items: typeof ativas }>>((acc, x) => {
    const pid = x.projeto.id
    if (!acc[pid]) acc[pid] = { projetoNome: x.projeto.nome, items: [] }
    acc[pid].items.push(x)
    return acc
  }, {})

  async function handlePlay() {
    if (!selectedId) return
    setStarting(true)
    try {
      await iniciarTimer(selectedId)
      toast('Timer iniciado')
      setSelectedId('')
    } catch {
      toast('Erro ao iniciar timer', 'error')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 min-w-0 px-2 py-1 rounded-md text-sm outline-none transition-all"
        style={{
          backgroundColor: 'var(--bg-input)',
          border: '0.5px solid var(--border)',
          color: selectedId ? 'var(--text-primary)' : 'var(--text-muted)',
          maxWidth: '360px',
        }}
      >
        <option value="">Selecionar demanda para cronometrar…</option>
        {Object.values(grupos).map(({ projetoNome, items }) => (
          <optgroup key={projetoNome} label={projetoNome}>
            {items.map(({ demanda }) => (
              <option key={demanda.id} value={demanda.id}>
                {demanda.titulo}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="button"
        onClick={handlePlay}
        disabled={!selectedId || starting}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ backgroundColor: accentColor, color: '#fff', flexShrink: 0 }}
      >
        <Play size={11} />
        {starting ? 'Iniciando…' : 'Iniciar'}
      </button>
    </div>
  )
}

// ── Componente raiz ───────────────────────────────────────────────────────────

export function TimerOverlay({ accentColor }: { accentColor: string }) {
  const timerAtivo = useTimerAtivo()

  return (
    <div
      className="flex items-center px-4 flex-shrink-0"
      style={{
        height: '44px',
        backgroundColor: timerAtivo ? 'var(--bg-surface)' : 'var(--bg-base)',
        borderBottom: '0.5px solid var(--border)',
        borderLeft: timerAtivo ? `3px solid ${accentColor}` : 'none',
        paddingLeft: timerAtivo ? '13px' : '16px',
        transition: 'background-color 0.2s, border-left 0.2s',
      }}
    >
      {timerAtivo
        ? <ActiveBar accentColor={accentColor} />
        : <IdleBar accentColor={accentColor} />
      }
    </div>
  )
}
