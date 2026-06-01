import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { EmpresasPage } from '../features/empresas/pages/EmpresasPage'
import { ProjetosPage } from '../features/projetos/pages/ProjetosPage'
import { ProjetoPage } from '../features/projetos/pages/ProjetoPage'
import { RegistrosPage } from '../features/registros/pages/RegistrosPage'

const DemandasGlobalPage = lazy(() =>
  import('../features/demandas/pages/DemandasGlobalPage').then((m) => ({ default: m.DemandasGlobalPage }))
)
// Lazy-loaded: evita carregar @react-pdf/renderer no boot
const RelatorioPage = lazy(() =>
  import('../features/relatorio/pages/RelatorioPage').then((m) => ({ default: m.RelatorioPage }))
)
const BackupPage = lazy(() =>
  import('../features/backup/pages/BackupPage').then((m) => ({ default: m.BackupPage }))
)

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center h-full"
      style={{ color: 'var(--text-muted)', fontSize: '13px' }}
    >
      Carregando…
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/empresas" replace />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route
          path="demandas"
          element={
            <Suspense fallback={<PageLoader />}>
              <DemandasGlobalPage />
            </Suspense>
          }
        />
        <Route path="projetos" element={<ProjetosPage />} />
        <Route path="projetos/:projetoId" element={<ProjetoPage />} />
        <Route path="registros" element={<RegistrosPage />} />
        <Route
          path="relatorio"
          element={
            <Suspense fallback={<PageLoader />}>
              <RelatorioPage />
            </Suspense>
          }
        />
        <Route
          path="backup"
          element={
            <Suspense fallback={<PageLoader />}>
              <BackupPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
