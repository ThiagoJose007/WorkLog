import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react'
import type { Demanda } from '../../../db/types'
import {
  useRegistrosTempo,
  useTimerAtivo,
  useTotalMinutosDemanda,
  iniciarTimer,
  encerrarTimerAtivo,
  addRegistroTempoManual,
  deleteRegistroTempo,
} from '../../../db/hooks/useDemandas'
import { formatarTempo, formatarData, hoje } from '../../../shared/utils/time'
import { toast } from '../../../shared/store/useToastStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplay(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Componente principal ──────────────────────────────────────────────────────

export function Timer({ demanda }: { demanda: Demanda }) {
  const timerAtivo = useTimerAtivo()
  const registros = useRegistrosTempo(demanda.id)
  const totalMinutos = useTotalMinutosDemanda(demanda.id) ?? 0

  const [displayMs, setDisplayMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const totalPausedRef = useRef(0)
  const pausedAtRef = useRef<number | null>(null)
  const [confirmarEncerramento, setConfirmarEncerramento] = useState(false)

  const isThisTimerActive = timerAtivo?.demanda_id === demanda.id
  const isOtherTimerActive = !!timerAtivo && !isThisTimerActive
  const timerState: 'idle' | 'running' | 'paused' = isThisTimerActive
    ? paused ? 'paused' : 'running'
    : 'idle'

  useEffect(() => {
    if (!isThisTimerActive) {
      setPaused(false)
      totalPausedRef.current = 0
      pausedAtRef.current = null
      setDisplayMs(0)
    }
  }, [isThisTimerActive])

  useEffect(() => {
    if (!isThisTimerActive || paused || !timerAtivo?.inicio) return
    const inicio = timerAtivo.inicio
    const tick = () => setDisplayMs(Date.now() - inicio - totalPausedRef.current)
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThisTimerActive, paused, timerAtivo?.id])

  // ── Timer handlers ────────────────────────────────────────────────────────

  async function doIniciar() {
    totalPausedRef.current = 0
    pausedAtRef.current = null
    setPaused(false)
    await iniciarTimer(demanda.id)
    toast('Timer iniciado')
  }

  function handleIniciar() {
    if (isOtherTimerActive) {
      setConfirmarEncerramento(true)
    } else {
      doIniciar()
    }
  }

  function handlePausar() {
    pausedAtRef.current = Date.now()
    setPaused(true)
  }

  function handleRetomar() {
    if (pausedAtRef.current !== null) {
      totalPausedRef.current += Date.now() - pausedAtRef.current
    }
    pausedAtRef.current = null
    setPaused(false)
  }

  async function handleParar() {
    if (!timerAtivo?.inicio) return
    let totalPaused = totalPausedRef.current
    if (paused && pausedAtRef.current !== null) {
      totalPaused += Date.now() - pausedAtRef.current
    }
    const elapsed = Math.max(0, Date.now() - timerAtivo.inicio - totalPaused)
    await encerrarTimerAtivo(timerAtivo.id, elapsed)
    setPaused(false)
    totalPausedRef.current = 0
    pausedAtRef.current = null
    const minutos = Math.max(1, Math.round(elapsed / 60000))
    toast(`Timer encerrado · ${formatarTempo(minutos)}`)
  }

  async function handleConfirmarEncerrar() {
    if (timerAtivo) {
      const elapsed = timerAtivo.inicio
        ? Math.max(0, Date.now() - timerAtivo.inicio)
        : 0
      await encerrarTimerAtivo(timerAtivo.id, elapsed)
    }
    setConfirmarEncerramento(false)
    await doIniciar()
  }

  // ── Manual form ───────────────────────────────────────────────────────────
  const [manualData, setManualData] = useState(hoje())
  const [manualHoras, setManualHoras] = useState('0')
  const [manualMinutos, setManualMinutos] = useState('30')
  const [manualNota, setManualNota] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState('')

  async function handleManualSubmit() {
    const h = Math.max(0, parseInt(manualHoras) || 0)
    const m = Math.max(0, Math.min(59, parseInt(manualMinutos) || 0))
    const total = h * 60 + m
    if (total < 1) { setManualError('Informe pelo menos 1 minuto.'); return }
    setManualSaving(true)
    setManualError('')
    try {
      await addRegistroTempoManual({
        demanda_id: demanda.id,
        data: manualData,
        duracao_min: total,
        nota: manualNota.trim() || undefined,
      })
      setManualHoras('0')
      setManualMinutos('30')
      setManualNota('')
      setManualData(hoje())
      toast(`Registro adicionado · ${formatarTempo(total)}`)
    } catch {
      setManualError('Erro ao salvar. Tente novamente.')
    } finally {
      setManualSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Confirmação encerrar outro timer (RN-11) */}
      {confirmarEncerramento && (
        <div
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-demanda-fill)', border: '0.5px solid #8B4A0030' }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} style={{ color: 'var(--color-demanda-text)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--color-demanda-text)' }}>
              Há um timer ativo em outra demanda. Deseja encerrá-lo e iniciar o cronômetro aqui?
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmarEncerramento(false)}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEncerrar}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-demanda-text)', color: '#1a0a00' }}
            >
              Encerrar e iniciar aqui
            </button>
          </div>
        </div>
      )}

      {/* Timer display */}
      <div className="flex flex-col items-center gap-4 py-2">
        <span
          className="font-mono tabular-nums tracking-wide select-none"
          style={{
            fontSize: '3rem',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color: timerState === 'idle' ? 'var(--text-muted)' : 'var(--text-primary)',
            transition: 'color 0.2s',
          }}
        >
          {formatDisplay(displayMs)}
        </span>

        {timerState !== 'idle' && (
          <span className="text-xs" style={{ color: paused ? 'var(--color-demanda-text)' : 'var(--text-muted)' }}>
            {paused ? 'Pausado' : 'Cronometrando…'}
          </span>
        )}

        <div className="flex items-center gap-2">
          {timerState === 'idle' && (
            <button
              type="button"
              onClick={handleIniciar}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-tempo-fill)', color: 'var(--color-tempo-text)', border: '0.5px solid #1d6b5a' }}
            >
              <Play size={15} />
              Iniciar
            </button>
          )}

          {timerState === 'running' && (
            <>
              <button
                type="button"
                onClick={handlePausar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <Pause size={14} />
                Pausar
              </button>
              <button
                type="button"
                onClick={handleParar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-danger-fill)', color: 'var(--color-danger-text)', border: '0.5px solid #b03030' }}
              >
                <Square size={14} fill="currentColor" />
                Parar
              </button>
            </>
          )}

          {timerState === 'paused' && (
            <>
              <button
                type="button"
                onClick={handleRetomar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-tempo-fill)', color: 'var(--color-tempo-text)', border: '0.5px solid #1d6b5a' }}
              >
                <Play size={14} />
                Retomar
              </button>
              <button
                type="button"
                onClick={handleParar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-danger-fill)', color: 'var(--color-danger-text)', border: '0.5px solid #b03030' }}
              >
                <Square size={14} fill="currentColor" />
                Parar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Total acumulado */}
      <div
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
        style={{ backgroundColor: 'var(--color-tempo-fill)', border: '0.5px solid #1d6b5a' }}
      >
        <Clock size={14} style={{ color: 'var(--color-tempo-text)' }} />
        <span className="text-sm" style={{ color: 'var(--color-tempo-text)' }}>
          Total acumulado:{' '}
          <strong className="font-semibold">
            {totalMinutos === 0 ? '—' : formatarTempo(totalMinutos)}
          </strong>
        </span>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)' }} />

      {/* Lançamento manual — sem <form> para evitar aninhamento no DemandaModal */}
      <div className="space-y-3">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Lançamento manual
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>Data</label>
              <input
                type="date"
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                max={hoje()}
                className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-all"
                style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>Horas</label>
              <input
                type="number"
                value={manualHoras}
                onChange={(e) => setManualHoras(e.target.value)}
                min={0} max={23}
                placeholder="0"
                className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-all text-center"
                style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSubmit() } }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>Minutos</label>
              <input
                type="number"
                value={manualMinutos}
                onChange={(e) => setManualMinutos(e.target.value)}
                min={0} max={59}
                placeholder="30"
                className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-all text-center"
                style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSubmit() } }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>
              Nota <span style={{ fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={manualNota}
              onChange={(e) => setManualNota(e.target.value)}
              placeholder="Ex: Reunião de planejamento"
              maxLength={200}
              className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-all"
              style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSubmit() } }}
            />
          </div>

          {manualError && (
            <p className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{manualError}</p>
          )}

          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={manualSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={12} />
            {manualSaving ? 'Salvando…' : 'Adicionar registro'}
          </button>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)' }} />

      {/* Histórico */}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Histórico{registros !== undefined && registros.length > 0 && ` · ${registros.length} registro${registros.length !== 1 ? 's' : ''}`}
        </p>

        {registros === undefined && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
            ))}
          </div>
        )}

        {registros !== undefined && registros.length === 0 && (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            Nenhum registro ainda
          </p>
        )}

        {registros !== undefined && registros.length > 0 && (
          <div className="space-y-1.5">
            {[...registros].reverse().map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}
              >
                <span title={r.tipo === 'timer' ? 'Cronômetro' : 'Manual'}>
                  <Clock size={13} style={{ color: r.tipo === 'timer' ? 'var(--color-tempo-text)' : 'var(--text-muted)', flexShrink: 0 }} />
                </span>
                <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {formatarData(r.data)}
                </span>
                <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {formatarTempo(r.duracao_min)}
                </span>
                <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {r.nota ?? ''}
                </span>
                <button
                  type="button"
                  onClick={() => deleteRegistroTempo(r.id)}
                  className="p-1 rounded transition-colors hover:bg-[var(--bg-elevated)] flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Excluir registro"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
