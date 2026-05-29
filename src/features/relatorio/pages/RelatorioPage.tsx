import { useState, useMemo } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { useEmpresaStore } from '../../empresas/store/useEmpresaStore'
import { useEmpresas } from '../../../db/hooks/useEmpresas'
import { hoje } from '../../../shared/utils/time'
import { useRelatorioData } from '../hooks/useRelatorioData'
import { PreviewRelatorio } from '../components/PreviewRelatorio'
import { PDFDocument } from '../components/PDFDocument'

// ── Period helpers ────────────────────────────────────────────────────────────

type PeriodPreset = 'semana-atual' | 'semana-passada' | 'mes-atual' | 'mes-passado' | 'personalizado'

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'semana-atual', label: 'Esta semana' },
  { id: 'semana-passada', label: 'Semana passada' },
  { id: 'mes-atual', label: 'Este mês' },
  { id: 'mes-passado', label: 'Mês passado' },
  { id: 'personalizado', label: 'Personalizado' },
]

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function calcPeriod(preset: PeriodPreset): { inicio: string; fim: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-indexed

  if (preset === 'semana-atual') {
    const dow = now.getDay()
    const daysFromMon = dow === 0 ? 6 : dow - 1
    const mon = new Date(now)
    mon.setDate(now.getDate() - daysFromMon)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { inicio: isoDate(mon), fim: isoDate(sun) }
  }

  if (preset === 'semana-passada') {
    const dow = now.getDay()
    const daysFromMon = dow === 0 ? 6 : dow - 1
    const mon = new Date(now)
    mon.setDate(now.getDate() - daysFromMon - 7)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { inicio: isoDate(mon), fim: isoDate(sun) }
  }

  if (preset === 'mes-atual') {
    const lastDay = new Date(y, m + 1, 0).getDate()
    return {
      inicio: `${y}-${String(m + 1).padStart(2, '0')}-01`,
      fim: `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  if (preset === 'mes-passado') {
    const pm = m === 0 ? 12 : m
    const py = m === 0 ? y - 1 : y
    const lastDay = new Date(py, pm, 0).getDate()
    return {
      inicio: `${py}-${String(pm).padStart(2, '0')}-01`,
      fim: `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  return { inicio: hoje(), fim: hoje() }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RelatorioPage() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresas = useEmpresas()

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(empresaAtivaId ?? '')
  const [preset, setPreset] = useState<PeriodPreset>('semana-atual')
  const [customInicio, setCustomInicio] = useState(hoje())
  const [customFim, setCustomFim] = useState(hoje())
  const [exporting, setExporting] = useState(false)

  const periodo = useMemo<{ inicio: string; fim: string }>(() => {
    if (preset === 'personalizado') return { inicio: customInicio, fim: customFim }
    return calcPeriod(preset)
  }, [preset, customInicio, customFim])

  const empresaId = selectedEmpresaId || null
  const data = useRelatorioData(empresaId, periodo.inicio, periodo.fim)

  async function handleExport() {
    if (!data) return
    setExporting(true)
    try {
      const blob = await pdf(<PDFDocument data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${data.empresa.nome.replace(/\s+/g, '-').toLowerCase()}-${periodo.inicio}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Erro ao gerar PDF:', e)
    } finally {
      setExporting(false)
    }
  }

  const accentColor = data?.empresa.cor_destaque ?? 'var(--accent)'

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Relatório PDF
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Configure o período e exporte o relatório
        </p>
      </div>

      {/* Config */}
      <div
        className="rounded-xl p-4 mb-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}
      >
        {/* Empresa */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Empresa
          </label>
          <select
            value={selectedEmpresaId}
            onChange={(e) => setSelectedEmpresaId(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '0.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">— Selecione —</option>
            {empresas?.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>

        {/* Período */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Período
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: preset === p.id ? accentColor : 'var(--bg-elevated)',
                  color: preset === p.id ? '#fff' : 'var(--text-secondary)',
                  border: preset === p.id ? `1px solid ${accentColor}` : '0.5px solid var(--border)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'personalizado' && (
            <div className="flex items-center gap-3 mt-2">
              <input
                type="date"
                value={customInicio}
                max={customFim}
                onChange={(e) => setCustomInicio(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>até</span>
              <input
                type="date"
                value={customFim}
                min={customInicio}
                onChange={(e) => setCustomFim(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {preset !== 'personalizado' && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {periodo.inicio} · {periodo.fim}
            </p>
          )}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={!data || exporting || !selectedEmpresaId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: accentColor, color: '#fff' }}
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Gerando PDF…
            </>
          ) : (
            <>
              <FileDown size={14} />
              Exportar PDF
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      {!selectedEmpresaId && (
        <div
          className="rounded-xl flex items-center justify-center py-16"
          style={{ border: '0.5px dashed var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Selecione uma empresa para visualizar o relatório</p>
        </div>
      )}

      {selectedEmpresaId && !data && (
        <div
          className="rounded-xl flex items-center justify-center py-16"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Carregando…</p>
        </div>
      )}

      {data && <PreviewRelatorio data={data} />}

    </div>
  )
}
