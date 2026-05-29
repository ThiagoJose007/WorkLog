import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { Projeto, ProjetoStatus } from '../../../db/types'
import { createProjeto, updateProjeto } from '../../../db/hooks/useProjetos'
import { ProjetoStatusBadge } from './StatusBadge'
import { hoje } from '../../../shared/utils/time'
import { toast } from '../../../shared/store/useToastStore'

const STATUS_OPTIONS: ProjetoStatus[] = ['ativo', 'pausado', 'concluido', 'cancelado']

interface ProjetoModalProps {
  projeto?: Projeto
  empresaId: string
  isOpen: boolean
  onClose: () => void
}

export function ProjetoModal({ projeto, empresaId, isOpen, onClose }: ProjetoModalProps) {
  const isEditing = !!projeto

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<ProjetoStatus>('ativo')
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dataFim, setDataFim] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const nomeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setNome(projeto?.nome ?? '')
      setDescricao(projeto?.descricao ?? '')
      setStatus(projeto?.status ?? 'ativo')
      setDataInicio(projeto?.data_inicio ?? hoje())
      setDataFim(projeto?.data_fim ?? '')
      setError('')
      setSaving(false)
      setTimeout(() => nomeRef.current?.focus(), 80)
    }
  }, [isOpen, projeto])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Nome é obrigatório.')
      nomeRef.current?.focus()
      return
    }
    if (dataFim && dataFim < dataInicio) {
      setError('Data fim não pode ser anterior à data início.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        status,
        data_inicio: dataInicio,
        data_fim: dataFim || undefined,
        empresa_id: empresaId,
      }
      if (isEditing) {
        await updateProjeto(projeto.id, payload)
        toast('Projeto atualizado')
      } else {
        await createProjeto(payload)
        toast('Projeto criado')
      }
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '0.5px solid var(--border-hover)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
            >
              {isEditing ? 'Editar projeto' : 'Novo projeto'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-surface)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Nome <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              ref={nomeRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Portal do Cliente"
              maxLength={100}
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '0.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Descrição <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Contexto, objetivo e escopo do projeto…"
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all resize-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '0.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="transition-all"
                  style={{
                    outline: status === s ? '2px solid var(--accent)' : 'none',
                    outlineOffset: '2px',
                    borderRadius: '6px',
                    opacity: status === s ? 1 : 0.5,
                  }}
                >
                  <ProjetoStatusBadge status={s} />
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Data início <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Data fim <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '0.5px solid var(--border)',
                    color: dataFim ? 'var(--text-primary)' : 'var(--text-muted)',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
                {dataFim && (
                  <button
                    type="button"
                    onClick={() => setDataFim('')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                    title="Limpar data fim"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <p className="text-xs" style={{ color: 'var(--color-danger-text)' }}>
              {error}
            </p>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
