import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, Palette, Trash2 } from 'lucide-react'
import type { Empresa } from '../../../db/types'
import { createEmpresa, updateEmpresa } from '../../../db/hooks/useEmpresas'
import { resizeImageToBase64 } from '../../../shared/utils/image'

// Paleta de cores pré-definidas
const CORES_PRESET = [
  '#7F77DD', // accent padrão
  '#5DCAA5', // teal
  '#85B7EB', // azul
  '#EF9F27', // amber
  '#F0997B', // coral
  '#97C459', // verde
  '#E06C75', // vermelho
  '#C678DD', // roxo
]

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

interface EmpresaModalProps {
  empresa?: Empresa          // undefined = criação, definido = edição
  isOpen: boolean
  onClose: () => void
}

export function EmpresaModal({ empresa, isOpen, onClose }: EmpresaModalProps) {
  const isEditing = !!empresa

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cor, setCor] = useState('#7F77DD')
  const [logo, setLogo] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const nomeRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Resetar form ao abrir / trocar de empresa
  useEffect(() => {
    if (isOpen) {
      setNome(empresa?.nome ?? '')
      setCnpj(empresa?.cnpj ?? '')
      setCor(empresa?.cor_destaque ?? '#7F77DD')
      setLogo(empresa?.logo_base64)
      setError('')
      setSaving(false)
      setTimeout(() => nomeRef.current?.focus(), 80)
    }
  }, [isOpen, empresa])

  // Fechar com Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await resizeImageToBase64(file, 200)
      setLogo(base64)
    } catch {
      setError('Não foi possível carregar a imagem.')
    }
    // Limpar o input para permitir reselecionar o mesmo arquivo
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Nome é obrigatório.')
      nomeRef.current?.focus()
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        nome: nome.trim(),
        cnpj: cnpj || undefined,
        cor_destaque: cor,
        logo_base64: logo,
        status: 'ativo' as const,
      }
      if (isEditing) {
        await updateEmpresa(empresa.id, payload)
      } else {
        await createEmpresa(payload)
      }
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const initial = nome.trim().charAt(0).toUpperCase() || 'E'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '0.5px solid var(--border-hover)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Barra de cor de destaque */}
        <div className="h-1" style={{ backgroundColor: cor }} />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
            >
              {isEditing ? 'Editar empresa' : 'Nova empresa'}
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

          {/* ── Upload de logo ── */}
          <div className="flex items-center gap-4">
            {/* Avatar / preview */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden transition-opacity hover:opacity-90"
              style={{
                backgroundColor: cor + '28',
                color: cor,
                border: `1.5px solid ${cor}55`,
              }}
              title="Clique para fazer upload da logo"
            >
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
              {/* Overlay de upload */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={15} className="text-white" />
              </div>
            </button>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="block text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                {logo ? 'Trocar logo' : 'Adicionar logo'}
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(undefined)}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={11} />
                  Remover
                </button>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                PNG, JPG • redimensionado para 200px
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {/* ── Nome ── */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nome{' '}
              <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              ref={nomeRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Acme Corp"
              maxLength={80}
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '0.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = cor }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* ── CNPJ ── */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              CNPJ{' '}
              <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '0.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = cor }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* ── Cor de destaque ── */}
          <div className="space-y-2.5">
            <label
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Palette size={12} />
              Cor de destaque
            </label>

            {/* Cores pré-definidas + picker customizado */}
            <div className="flex items-center gap-2 flex-wrap">
              {CORES_PRESET.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-7 h-7 rounded-full flex-shrink-0 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: cor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    boxShadow: cor === c ? `0 0 0 1px var(--bg-elevated)` : 'none',
                  }}
                  title={c}
                />
              ))}

              {/* Cor customizada via input nativo escondido */}
              <label
                className="w-7 h-7 rounded-full flex-shrink-0 cursor-pointer overflow-hidden transition-transform hover:scale-110 relative"
                style={{
                  background:
                    'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                  outline: !CORES_PRESET.includes(cor) ? `2px solid ${cor}` : 'none',
                  outlineOffset: '2px',
                  boxShadow: !CORES_PRESET.includes(cor) ? `0 0 0 1px var(--bg-elevated)` : 'none',
                }}
                title="Cor personalizada"
              >
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            {/* Preview da cor selecionada */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
              style={{
                backgroundColor: cor + '1A',
                color: cor,
                border: `0.5px solid ${cor}44`,
              }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cor }}
              />
              <span className="font-mono">{cor.toUpperCase()}</span>
              <span style={{ color: cor + 'AA' }}>— usada na sidebar e relatório</span>
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
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: cor, color: '#fff' }}
            >
              {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
