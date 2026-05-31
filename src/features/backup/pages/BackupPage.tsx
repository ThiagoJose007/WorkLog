import { useRef, useState } from 'react'
import { DownloadCloud, Upload, CheckCircle2, AlertCircle, FileJson, RefreshCw } from 'lucide-react'
import {
  exportBackup,
  parseBackupFile,
  getBackupSummary,
  importBackup,
  type BackupData,
  type BackupSummary,
} from '../utils/backupUtils'
import { toast } from '../../../shared/store/useToastStore'

type ImportStep = 'idle' | 'preview' | 'importing' | 'done' | 'error'

export function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)

  const [importStep, setImportStep] = useState<ImportStep>('idle')
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [progress, setProgress] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleExport() {
    setExporting(true)
    try {
      await exportBackup()
      toast('Backup exportado com sucesso')
    } catch (e) {
      toast('Erro ao exportar backup', 'error')
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const backup = await parseBackupFile(file)
      setPendingBackup(backup)
      setSummary(getBackupSummary(backup))
      setImportStep('preview')
      setErrorMsg('')
    } catch (err) {
      setErrorMsg((err as Error).message)
      setImportStep('error')
    }
  }

  async function handleConfirmImport() {
    if (!pendingBackup) return
    setImportStep('importing')
    setProgress('')

    try {
      await importBackup(pendingBackup, importMode, (step) => setProgress(step))
      setImportStep('done')
      toast(`Backup importado — modo ${importMode === 'replace' ? 'substituição' : 'mesclagem'}`)
    } catch (err) {
      setErrorMsg((err as Error).message)
      setImportStep('error')
      toast('Erro ao importar backup', 'error')
    }
  }

  function handleReset() {
    setPendingBackup(null)
    setSummary(null)
    setProgress('')
    setErrorMsg('')
    setImportStep('idle')
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-xl font-semibold mb-1"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Backup
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Exporte todos os seus dados ou restaure a partir de um arquivo de backup.
          </p>
        </div>

        {/* Export card */}
        <div
          className="rounded-xl p-5 mb-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#173404', border: '0.5px solid var(--border)' }}
              >
                <DownloadCloud size={16} style={{ color: '#C0DD97' }} />
              </div>
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  Exportar dados
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Salva todas as empresas, projetos, demandas, registros e imagens em um arquivo JSON.
                  Imagens são incluídas como base64.
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#173404', color: '#C0DD97', border: '0.5px solid #2a5e08' }}
            >
              {exporting ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <DownloadCloud size={13} />
              )}
              {exporting ? 'Exportando…' : 'Exportar'}
            </button>
          </div>
        </div>

        {/* Import card */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#042C53', border: '0.5px solid var(--border)' }}
            >
              <Upload size={16} style={{ color: '#B5D4F4' }} />
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                Importar backup
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Restaure dados a partir de um arquivo <code className="font-mono">.json</code> exportado pelo WorkLog.
              </p>
            </div>
          </div>

          {/* Step: idle */}
          {importStep === 'idle' && (
            <div>
              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                {(['merge', 'replace'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setImportMode(m)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: importMode === m ? 'var(--bg-elevated)' : 'transparent',
                      color: importMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: `0.5px solid ${importMode === m ? 'var(--border-hover)' : 'var(--border)'}`,
                    }}
                  >
                    {m === 'merge' ? 'Mesclar' : 'Substituir tudo'}
                  </button>
                ))}
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                {importMode === 'merge'
                  ? 'Dados do arquivo serão adicionados/atualizados sem apagar registros existentes (upsert por ID).'
                  : 'Todos os dados atuais serão apagados antes de importar. Esta ação não pode ser desfeita.'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                style={{
                  border: '1.5px dashed var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <FileJson size={15} />
                Selecionar arquivo .json
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Step: preview */}
          {importStep === 'preview' && summary && (
            <div>
              <div
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }}
              >
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Resumo do backup
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Empresas', value: summary.empresas },
                    { label: 'Projetos', value: summary.projetos },
                    { label: 'Demandas', value: summary.demandas },
                    { label: 'Membros', value: summary.membros },
                    { label: 'Reg. diários', value: summary.registrosDiarios },
                    { label: 'Reg. tempo', value: summary.registrosTempo },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-md p-2.5 text-center"
                      style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}
                    >
                      <p
                        className="text-base font-semibold"
                        style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                      >
                        {value}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {importMode === 'replace' && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg mb-4"
                  style={{ backgroundColor: '#791F1F22', border: '0.5px solid #791F1F' }}
                >
                  <AlertCircle size={14} style={{ color: '#F7C1C1', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: '#F7C1C1' }}>
                    Modo substituição: todos os dados atuais serão <strong>apagados permanentemente</strong> antes da importação.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: importMode === 'replace' ? '#791F1F' : '#042C53',
                    color: importMode === 'replace' ? '#F7C1C1' : '#B5D4F4',
                  }}
                >
                  <Upload size={13} />
                  {importMode === 'replace' ? 'Substituir e importar' : 'Mesclar dados'}
                </button>
              </div>
            </div>
          )}

          {/* Step: importing */}
          {importStep === 'importing' && (
            <div className="py-4 text-center">
              <RefreshCw
                size={24}
                className="animate-spin mx-auto mb-3"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {progress || 'Importando…'}
              </p>
            </div>
          )}

          {/* Step: done */}
          {importStep === 'done' && (
            <div className="py-4 text-center">
              <CheckCircle2
                size={28}
                className="mx-auto mb-3"
                style={{ color: '#9FE1CB' }}
              />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Importação concluída
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Todos os dados foram importados com sucesso.
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}
              >
                Fechar
              </button>
            </div>
          )}

          {/* Step: error */}
          {importStep === 'error' && (
            <div className="py-4 text-center">
              <AlertCircle
                size={28}
                className="mx-auto mb-3"
                style={{ color: '#F7C1C1' }}
              />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Erro na importação
              </p>
              <p className="text-xs mb-4" style={{ color: '#F7C1C1' }}>
                {errorMsg}
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
