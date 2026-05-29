import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Eye, EyeOff } from 'lucide-react'
import { useEmpresas } from '../../../db/hooks/useEmpresas'
import { useEmpresaStore } from '../store/useEmpresaStore'
import { EmpresaCard } from '../components/EmpresaCard'
import { EmpresaModal } from '../components/EmpresaModal'
import type { Empresa } from '../../../db/types'

export function EmpresasPage() {
  const navigate = useNavigate()
  const { empresaAtivaId, setEmpresaAtiva } = useEmpresaStore()
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | undefined>()

  // Busca todas para poder contar arquivadas e mostrar o toggle
  const todasEmpresas = useEmpresas({ incluirArquivadas: true })

  const empresasVisiveis = mostrarArquivadas
    ? todasEmpresas
    : todasEmpresas?.filter((e) => e.status === 'ativo')

  const totalArquivadas =
    todasEmpresas?.filter((e) => e.status === 'arquivado').length ?? 0

  function handleSelecionar(id: string) {
    setEmpresaAtiva(id)
    navigate('/projetos')
  }

  function handleEditar(empresa: Empresa) {
    setEmpresaEditando(empresa)
    setModalAberto(true)
  }

  function handleNova() {
    setEmpresaEditando(undefined)
    setModalAberto(true)
  }

  function handleFecharModal() {
    setModalAberto(false)
    setEmpresaEditando(undefined)
  }

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Empresas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Selecione a empresa ativa ou gerencie suas empresas
          </p>
        </div>

        <button
          onClick={handleNova}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={15} />
          Nova empresa
        </button>
      </div>

      {/* ── Toggle arquivadas ── */}
      {totalArquivadas > 0 && (
        <button
          onClick={() => setMostrarArquivadas((v) => !v)}
          className="flex items-center gap-1.5 text-xs mb-5 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          {mostrarArquivadas ? <EyeOff size={13} /> : <Eye size={13} />}
          {mostrarArquivadas
            ? 'Ocultar arquivadas'
            : `Mostrar ${totalArquivadas} empresa${totalArquivadas > 1 ? 's' : ''} arquivada${totalArquivadas > 1 ? 's' : ''}`}
        </button>
      )}

      {/* ── Skeleton de carregamento ── */}
      {empresasVisiveis === undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state — nenhuma empresa ── */}
      {empresasVisiveis !== undefined && empresasVisiveis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
            }}
          >
            <Building2 size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mostrarArquivadas
              ? 'Nenhuma empresa encontrada'
              : 'Nenhuma empresa cadastrada'}
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            {mostrarArquivadas
              ? 'Todas as empresas foram excluídas ou não há nenhuma'
              : 'Crie sua primeira empresa para começar a organizar seus projetos'}
          </p>
          {!mostrarArquivadas && (
            <button
              onClick={handleNova}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={14} />
              Criar empresa
            </button>
          )}
        </div>
      )}

      {/* ── Grid de cards ── */}
      {empresasVisiveis !== undefined && empresasVisiveis.length > 0 && (
        <>
          {/* Empresa ativa em destaque (se existir e estiver visível) */}
          {(() => {
            const ativa = empresasVisiveis.find((e) => e.id === empresaAtivaId)
            if (!ativa) return null
            return (
              <div className="mb-2">
                <p
                  className="text-xs mb-2 px-0.5"
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Empresa ativa
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <EmpresaCard
                    key={ativa.id}
                    empresa={ativa}
                    isActive
                    onSelect={() => handleSelecionar(ativa.id)}
                    onEdit={() => handleEditar(ativa)}
                  />
                </div>
              </div>
            )
          })()}

          {/* Demais empresas */}
          {(() => {
            const demais = empresasVisiveis.filter((e) => e.id !== empresaAtivaId)
            if (demais.length === 0) return null
            const temAtiva = empresasVisiveis.some((e) => e.id === empresaAtivaId)
            return (
              <div>
                {temAtiva && (
                  <p
                    className="text-xs mb-2 px-0.5"
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Outras empresas
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {demais.map((empresa) => (
                    <EmpresaCard
                      key={empresa.id}
                      empresa={empresa}
                      isActive={false}
                      onSelect={() => handleSelecionar(empresa.id)}
                      onEdit={() => handleEditar(empresa)}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* ── Modal de criação/edição ── */}
      <EmpresaModal
        empresa={empresaEditando}
        isOpen={modalAberto}
        onClose={handleFecharModal}
      />
    </div>
  )
}
