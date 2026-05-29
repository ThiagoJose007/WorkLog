/** Converte minutos totais para string legível: "1h 30m", "45m", "2h", "—" */
export function formatarTempo(minutos: number): string {
  if (minutos <= 0) return '—'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Data ISO "YYYY-MM-DD" → "15/01/2026" */
export function formatarData(data: string): string {
  if (!data) return '—'
  const [y, mo, d] = data.split('-')
  return `${d}/${mo}/${y}`
}

/** Hoje no formato "YYYY-MM-DD" (para default de inputs date) */
export function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}
