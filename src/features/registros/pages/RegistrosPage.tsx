import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen, ArrowRight } from 'lucide-react'
import { useEmpresaStore } from '../../empresas/store/useEmpresaStore'
import { useEmpresa } from '../../../db/hooks/useEmpresas'
import { useRegistrosDiarios } from '../../../db/hooks/useRegistros'
import { RegistroEditor } from '../components/RegistroEditor'
import { DemandaModal } from '../../demandas/components/DemandaModal'
import { hoje } from '../../../shared/utils/time'
import type { Demanda } from '../../../db/types'

// ── Helpers de data ──────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const WEEKDAYS_LONG = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

/** Retorna uma Date estável (meio-dia) a partir de YYYY-MM-DD, evitando problemas de fuso. */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Retorna array de 7 strings YYYY-MM-DD (Seg→Dom) para a semana `offset` em relação à atual. */
function getWeekDates(offset: number): string[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dow = today.getDay() // 0=Dom
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysFromMon + offset * 7)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function formatWeekRange(dates: string[]): string {
  const first = parseDate(dates[0])
  const last  = parseDate(dates[6])
  const fd = first.getDate()
  const fm = MONTHS_SHORT[first.getMonth()]
  const ld = last.getDate()
  const lm = MONTHS_SHORT[last.getMonth()]
  const ly = last.getFullYear()

  if (first.getMonth() === last.getMonth()) {
    return `${fd}–${ld} de ${MONTHS_LONG[last.getMonth()]} de ${ly}`
  }
  return `${fd} ${fm} – ${ld} ${lm} ${ly}`
}

function formatDayTitle(dateStr: string): string {
  const d = parseDate(dateStr)
  const todayStr = hoje()
  if (dateStr === todayStr) return 'Hoje'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  if (dateStr === yesterdayStr) return 'Ontem'

  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

// ── Página ───────────────────────────────────────────────────────────────────

export function RegistrosPage() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresa = useEmpresa(empresaAtivaId)

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(hoje())
  const [modalDemanda, setModalDemanda] = useState<Demanda | undefined>()
  const [modalTab, setModalTab] = useState<'detalhes' | 'timer'>('timer')
  const [modalAberto, setModalAberto] = useState(false)

  function handleAbrirDemanda(demanda: Demanda, tab: 'detalhes' | 'timer') {
    setModalDemanda(demanda)
    setModalTab(tab)
    setModalAberto(true)
  }

  const todayStr = hoje()
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  // Carrega todos os registros para marcar dias com entradas
  const allRegistros = useRegistrosDiarios(empresaAtivaId)
  const recordedDates = useMemo(
    () => new Set(allRegistros?.map((r) => r.data) ?? []),
    [allRegistros],
  )

  const accentColor = empresa?.cor_destaque ?? 'var(--accent)'

  // ── Guard sem empresa ─────────────────────────────────────────────────────

  if (!empresaAtivaId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}
        >
          <BookOpen size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma empresa selecionada
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Selecione uma empresa para ver os registros diários
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        {empresa && (
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-2"
            style={{
              backgroundColor: accentColor + '22',
              color: accentColor,
              border: `0.5px solid ${accentColor}44`,
            }}
          >
            {empresa.nome}
          </span>
        )}
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Registros Diários
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {allRegistros === undefined
            ? 'Carregando…'
            : `${allRegistros.length} registro${allRegistros.length !== 1 ? 's' : ''} nesta empresa`}
        </p>
      </div>

      {/* Navegação de semana */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-muted)' }}
          title="Semana anterior"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {formatWeekRange(weekDates)}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => { setWeekOffset(0); setSelectedDate(todayStr) }}
              className="text-xs px-2 py-0.5 rounded-md transition-opacity hover:opacity-70"
              style={{ backgroundColor: accentColor + '20', color: accentColor }}
            >
              Hoje
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          disabled={weekOffset >= 0}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-muted)' }}
          title="Próxima semana"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1.5 mb-8">
        {weekDates.map((date, i) => {
          const d = parseDate(date)
          const isToday    = date === todayStr
          const isSelected = date === selectedDate
          const hasRecord  = recordedDates.has(date)
          const isFuture   = date > todayStr

          return (
            <button
              key={date}
              onClick={() => !isFuture && setSelectedDate(date)}
              disabled={isFuture}
              className="flex flex-col items-center py-3 rounded-xl transition-all duration-150"
              style={{
                backgroundColor: isSelected
                  ? accentColor
                  : hasRecord
                  ? 'var(--bg-surface)'
                  : 'transparent',
                border: isToday && !isSelected
                  ? `1.5px solid ${accentColor}`
                  : '0.5px solid var(--border)',
                opacity: isFuture ? 0.3 : 1,
                cursor: isFuture ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isFuture && !isSelected) {
                  e.currentTarget.style.borderColor = accentColor + '66'
                }
              }}
              onMouseLeave={(e) => {
                if (!isFuture && !isSelected) {
                  e.currentTarget.style.borderColor = isToday ? accentColor : 'var(--border)'
                }
              }}
            >
              {/* Dia da semana */}
              <span
                className="text-xs font-medium mb-1.5"
                style={{
                  color: isSelected ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {WEEKDAYS_SHORT[i]}
              </span>

              {/* Número do dia */}
              <span
                className="text-sm font-semibold tabular-nums"
                style={{
                  color: isSelected
                    ? '#fff'
                    : isToday
                    ? accentColor
                    : 'var(--text-primary)',
                }}
              >
                {d.getDate()}
              </span>

              {/* Mês (se diferente do mês da semana) */}
              <span
                className="text-xs mt-0.5"
                style={{
                  color: isSelected ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)',
                  fontSize: '10px',
                  minHeight: '14px',
                }}
              >
                {i === 0 || d.getDate() === 1 ? MONTHS_SHORT[d.getMonth()] : ''}
              </span>

              {/* Indicador de registro */}
              <div
                className="w-1.5 h-1.5 rounded-full mt-1"
                style={{
                  backgroundColor: hasRecord
                    ? isSelected ? 'rgba(255,255,255,0.55)' : accentColor
                    : 'transparent',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Título do dia + separador */}
      <div
        className="flex items-center justify-between pb-4 mb-2"
        style={{ borderBottom: '0.5px solid var(--border)' }}
      >
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {formatDayTitle(selectedDate)}
        </h2>

        {recordedDates.has(selectedDate) && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-registro-fill)',
              color: 'var(--color-registro-text)',
            }}
          >
            Com registro
          </span>
        )}
      </div>

      {/* Editor do dia — re-monta quando a data ou empresa muda */}
      <RegistroEditor
        key={`${selectedDate}::${empresaAtivaId}`}
        data={selectedDate}
        empresaId={empresaAtivaId}
        accentColor={accentColor}
        onDemandaOpen={handleAbrirDemanda}
      />

      {/* Modal de demanda aberto a partir dos chips */}
      {modalDemanda && (
        <DemandaModal
          demanda={modalDemanda}
          projetoId={modalDemanda.projeto_id}
          isOpen={modalAberto}
          initialTab={modalTab}
          onClose={() => { setModalAberto(false); setModalDemanda(undefined) }}
        />
      )}
    </div>
  )
}
