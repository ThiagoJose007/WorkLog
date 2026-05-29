import { Outlet, NavLink } from 'react-router-dom'
import { FolderKanban, BookOpen, FileText, DownloadCloud, Building2 } from 'lucide-react'
import { EmpresaSeletor } from '../../features/empresas/components/EmpresaSeletor'
import { useEmpresaStore } from '../../features/empresas/store/useEmpresaStore'

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  accentColor: string
}

function NavItem({ to, icon: Icon, label, accentColor }: NavItemProps) {
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
          {label}
        </>
      )}
    </NavLink>
  )
}

const MAIN_NAV = [
  { to: '/projetos', icon: FolderKanban, label: 'Projetos' },
  { to: '/registros', icon: BookOpen, label: 'Registros' },
  { to: '/relatorio', icon: FileText, label: 'Relatório' },
]

const BOTTOM_NAV = [
  { to: '/empresas', icon: Building2, label: 'Empresas' },
  { to: '/backup', icon: DownloadCloud, label: 'Backup' },
]

export function Layout() {
  const { empresaAtiva } = useEmpresaStore()
  const accentColor = empresaAtiva?.cor_destaque ?? 'var(--accent)'

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
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
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

        {/* Seletor de empresa */}
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
          {MAIN_NAV.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} accentColor={accentColor} />
          ))}
        </nav>

        {/* Rodapé da sidebar */}
        <div className="px-2 py-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
          {BOTTOM_NAV.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} accentColor={accentColor} />
          ))}
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  )
}
