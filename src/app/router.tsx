import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
      <div className="text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-sm mt-1">Em construção</p>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/projetos" replace />} />
        <Route path="projetos" element={<PlaceholderPage title="Projetos" />} />
        <Route path="projetos/:projetoId" element={<PlaceholderPage title="Projeto" />} />
        <Route path="registros" element={<PlaceholderPage title="Registros Diários" />} />
        <Route path="relatorio" element={<PlaceholderPage title="Relatório PDF" />} />
        <Route path="empresas" element={<PlaceholderPage title="Empresas" />} />
        <Route path="backup" element={<PlaceholderPage title="Backup" />} />
      </Route>
    </Routes>
  )
}
