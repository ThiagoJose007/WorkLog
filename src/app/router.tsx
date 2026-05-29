import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { EmpresasPage } from '../features/empresas/pages/EmpresasPage'
import { ProjetosPage } from '../features/projetos/pages/ProjetosPage'
import { ProjetoPage } from '../features/projetos/pages/ProjetoPage'
import { RegistrosPage } from '../features/registros/pages/RegistrosPage'
import { RelatorioPage } from '../features/relatorio/pages/RelatorioPage'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-center h-full"
      style={{ color: 'var(--text-muted)' }}
    >
      <div className="text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </p>
        <p className="text-sm mt-1">Em construção</p>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/empresas" replace />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="projetos" element={<ProjetosPage />} />
        <Route path="projetos/:projetoId" element={<ProjetoPage />} />
        <Route path="registros" element={<RegistrosPage />} />
        <Route path="relatorio" element={<RelatorioPage />} />
        <Route path="backup" element={<PlaceholderPage title="Backup" />} />
      </Route>
    </Routes>
  )
}
