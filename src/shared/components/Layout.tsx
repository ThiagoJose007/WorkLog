import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FolderKanban, BookOpen, FileText, DownloadCloud, Building2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { EmpresaSeletor } from '../../features/empresas/components/EmpresaSeletor'
import { useEmpresaStore } from '../../features/empresas/store/useEmpresaStore'
import { useEmpresa } from '../../db/hooks/useEmpresas'
import { Toast } from './Toast'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { exportBackup, parseBackupFile, getBackupSummary, importBackup } from '../../features/backup/utils/backupUtils'
import { toast } from '../store/useToastStore'

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  accentColor: string
  shortcut?: string
}

function NavItem({ to, icon: Icon, label, accentColor, shortcut }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <Icon size={15} strokeWidth={1.75} />
          <span className="flex-1">{label}</span>
          {shortcut && (
            <kbd
              className="text-xs px-1 py-0.5 rounded"
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-muted)',
                border: '0.5px solid var(--border)',
                lineHeight: 1,
              }}
            >
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </NavLink>
  )
}

const MAIN_NAV = [
  { to: '/projetos', icon: FolderKanban, label: 'Projetos', shortcut: undefined },
  { to: '/registros', icon: BookOpen, label: 'Registros', shortcut: 'R' },
  { to: '/relatorio', icon: FileText, label: 'Relatório', shortcut: undefined },
]

const BOTTOM_NAV = [
  { to: '/empresas', icon: Building2, label: 'Empresas' },
  { to: '/backup', icon: DownloadCloud, label: 'Backup' },
]

export function Layout() {
  const { empresaAtivaId } = useEmpresaStore()
  const empresaAtiva = useEmpresa(empresaAtivaId)
  const accentColor = empresaAtiva?.cor_destaque ?? 'var(--accent)'
  const navigate = useNavigate()
  const importInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)

  useKeyboardShortcut('r', () => navigate('/registros'))

  async function handleQuickExport() {
    setExporting(true)
    try {
      await exportBackup()
      toast('Backup exportado')
    } catch {
      toast('Erro ao exportar', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleQuickImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const backup = await parseBackupFile(file)
      const s = getBackupSummary(backup)
      const ok = window.confirm(
        `Mesclar backup?\n\n${s.empresas} empresa(s) · ${s.projetos} projeto(s) · ${s.demandas} demanda(s)\n\nOS DADOS EXISTENTES NÃO SERÃO APAGADOS (modo mesclar).`
      )
      if (!ok) return
      await importBackup(backup, 'merge')
      toast('Backup importado (mesclado)')
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: '220px', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-xs font-bold text-white leading-none">W</span>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            WorkLog
          </span>
        </div>

        {/* Seletor de empresa — dados vêm do Dexie */}
        <EmpresaSeletor />

        {/* Nav principal */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <p
            className="px-3 mb-2"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Navegação
          </p>
          {MAIN_NAV.map(({ to, icon, label, shortcut }) => (
            <NavItem key={to} to={to} icon={icon} label={label} accentColor={accentColor} shortcut={shortcut} />
          ))}
        </nav>

        {/* Rodapé da sidebar */}
        <div className="px-2 py-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
          {BOTTOM_NAV.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} accentColor={accentColor} />
          ))}

          {/* Quick backup actions */}
          <div className="pt-1 pb-0.5">
            <p
              className="px-3 mb-1.5"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              Dados
            </p>
            <div className="flex gap-1.5 px-1">
              <button
                onClick={handleQuickExport}
                disabled={exporting}
                title="Exportar backup"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                <DownloadCloud size={13} />
                Exportar
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                title="Importar backup"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Upload size={13} />
                Importar
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleQuickImport}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}
