import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Bold, Italic, List, Link2, Trash2, ImagePlus, ExternalLink, Clock } from 'lucide-react'
import { Timer } from './Timer'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { toast } from '../../../shared/store/useToastStore'
import type {
  Demanda,
  DemandaTipo,
  DemandaPrioridade,
  DemandaStatus,
  FerramentaLink,
} from '../../../db/types'
import { db } from '../../../db/schema'
import {
  createDemanda,
  updateDemanda,
  addDemandaLink,
  deleteDemandaLink,
  addDemandaImagem,
  deleteDemandaImagem,
  detectarFerramenta,
} from '../../../db/hooks/useDemandas'
import {
  DemandaStatusBadge,
  DemandaTipoBadge,
  DemandaPrioridadeDot,
} from '../../projetos/components/StatusBadge'
import { resizeImageToBase64 } from '../../../shared/utils/image'

const TIPO_OPTIONS: DemandaTipo[] = ['tarefa', 'reuniao', 'alinhamento']
const PRIORIDADE_OPTIONS: DemandaPrioridade[] = ['baixa', 'media', 'alta', 'urgente']
const STATUS_OPTIONS: DemandaStatus[] = ['backlog', 'andamento', 'revisao', 'concluida', 'cancelada']

const FERRAMENTA_LABEL: Record<FerramentaLink, string> = {
  jira: 'Jira', linear: 'Linear', trello: 'Trello', github: 'GitHub',
  asana: 'Asana', clickup: 'ClickUp', figma: 'Figma', notion: 'Notion', outro: 'Link',
}

const FERRAMENTA_COLOR: Record<FerramentaLink, string> = {
  jira: '#2684FF', linear: '#5E6AD2', trello: '#0052CC', github: '#E8E6DE',
  asana: '#F06A6A', clickup: '#7B68EE', figma: '#FF7262', notion: '#9C9A92', outro: '#9C9A92',
}

type PendingLink = { id?: string; url: string; label: string; ferramenta: FerramentaLink }
type PendingImage = { id?: string; base64: string }

export interface DemandaModalProps {
  demanda?: Demanda
  projetoId: string
  isOpen: boolean
  onClose: () => void
  initialTab?: 'detalhes' | 'timer'
}

type ModalTab = 'detalhes' | 'timer'

export function DemandaModal({ demanda, projetoId, isOpen, onClose, initialTab = 'detalhes' }: DemandaModalProps) {
  const isEditing = !!demanda

  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<DemandaTipo>('tarefa')
  const [prioridade, setPrioridade] = useState<DemandaPrioridade>('media')
  const [status, setStatus] = useState<DemandaStatus>('backlog')
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [deletedLinkIds, setDeletedLinkIds] = useState<string[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const tituloRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Descreva a demanda, contexto, critérios de aceite…' }),
    ],
    content: '',
    editorProps: { attributes: { class: 'tiptap-content' } },
  })

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(initialTab)
    setTitulo(demanda?.titulo ?? '')
    setTipo(demanda?.tipo ?? 'tarefa')
    setPrioridade(demanda?.prioridade ?? 'media')
    setStatus(demanda?.status ?? 'backlog')
    setLinkUrl('')
    setError('')
    setSaving(false)
    setDeletedLinkIds([])
    setDeletedImageIds([])

    if (demanda) {
      Promise.all([
        db.demandaLinks.where('demanda_id').equals(demanda.id).toArray(),
        db.demandaImagens.where('demanda_id').equals(demanda.id).sortBy('created_at'),
      ]).then(([links, images]) => {
        setPendingLinks(links.map((l) => ({ id: l.id, url: l.url, label: l.label, ferramenta: l.ferramenta })))
        setPendingImages(images.map((i) => ({ id: i.id, base64: i.arquivo_base64 })))
      })
    } else {
      setPendingLinks([])
      setPendingImages([])
    }

    setTimeout(() => tituloRef.current?.focus(), 80)
  }, [isOpen, demanda, initialTab])

  useEffect(() => {
    if (isOpen && editor) {
      editor.commands.setContent(demanda?.descricao ?? '')
    }
  }, [isOpen, editor, demanda?.descricao])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleAddLink() {
    const url = linkUrl.trim()
    if (!url) return
    try { new URL(url) } catch { setError('URL inválida.'); return }
    const ferramenta = detectarFerramenta(url)
    let label: string
    try { label = ferramenta !== 'outro' ? FERRAMENTA_LABEL[ferramenta] : new URL(url).hostname } catch { label = url }
    setPendingLinks((prev) => [...prev, { url, label, ferramenta }])
    setLinkUrl('')
    setError('')
  }

  function handleRemoveLink(index: number) {
    const link = pendingLinks[index]
    if (link.id) setDeletedLinkIds((prev) => [...prev, link.id!])
    setPendingLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const base64 = await resizeImageToBase64(file)
      setPendingImages((prev) => [...prev, { base64 }])
    }
    e.target.value = ''
  }

  function handleRemoveImage(index: number) {
    const img = pendingImages[index]
    if (img.id) setDeletedImageIds((prev) => [...prev, img.id!])
    setPendingImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título é obrigatório.'); tituloRef.current?.focus(); return }
    setSaving(true)
    setError('')
    try {
      const html = editor?.getHTML()
      const descricao = html && html !== '<p></p>' ? html : undefined
      let demandaId: string
      if (isEditing) {
        await updateDemanda(demanda.id, { titulo: titulo.trim(), prioridade, status, descricao })
        demandaId = demanda.id
        toast('Demanda atualizada')
      } else {
        demandaId = await createDemanda({ projeto_id: projetoId, titulo: titulo.trim(), tipo, prioridade, status, descricao })
        toast('Demanda criada')
      }
      for (const id of deletedLinkIds) await deleteDemandaLink(id)
      for (const id of deletedImageIds) await deleteDemandaImagem(id)
      for (const link of pendingLinks.filter((l) => !l.id)) {
        await addDemandaLink({ demanda_id: demandaId, url: link.url, label: link.label, ferramenta: link.ferramenta })
      }
      for (const img of pendingImages.filter((i) => !i.id)) {
        await addDemandaImagem({ demanda_id: demandaId, arquivo_base64: img.base64 })
      }
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const TABS: Array<{ id: ModalTab; label: string; icon?: React.ElementType }> = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'timer', label: 'Timer & Histórico', icon: Clock },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg my-8 rounded-xl overflow-hidden flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '0.5px solid var(--border-hover)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Cabeçalho — fora do form ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: isEditing ? 'none' : '0.5px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {isEditing ? 'Editar demanda' : 'Nova demanda'}
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

        {/* ── Tabs — fora do form ── */}
        {isEditing && (
          <div className="flex items-center gap-0 px-6" style={{ borderBottom: '0.5px solid var(--border)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
                style={{
                  color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: activeTab === id ? 'var(--accent)' : 'transparent',
                }}
              >
                {Icon && <Icon size={13} />}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Aba Detalhes — tem form próprio ── */}
        {activeTab === 'detalhes' && (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* Título */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Título <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  ref={tituloRef}
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Implementar autenticação OAuth"
                  maxLength={150}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Tipo {isEditing && <span style={{ color: 'var(--text-muted)' }}>(imutável após criação)</span>}
                </label>
                {isEditing ? (
                  <DemandaTipoBadge tipo={demanda.tipo} />
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {TIPO_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipo(t)}
                        style={{ outline: tipo === t ? '2px solid var(--accent)' : 'none', outlineOffset: '2px', borderRadius: '6px', opacity: tipo === t ? 1 : 0.5 }}
                      >
                        <DemandaTipoBadge tipo={t} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Prioridade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Prioridade</label>
                <div className="flex gap-3 flex-wrap">
                  {PRIORIDADE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridade(p)}
                      className="transition-opacity"
                      style={{ outline: prioridade === p ? '2px solid var(--accent)' : 'none', outlineOffset: '2px', borderRadius: '6px', opacity: prioridade === p ? 1 : 0.45 }}
                    >
                      <DemandaPrioridadeDot prioridade={p} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      style={{ outline: status === s ? '2px solid var(--accent)' : 'none', outlineOffset: '2px', borderRadius: '6px', opacity: status === s ? 1 : 0.5 }}
                    >
                      <DemandaStatusBadge status={s} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Descrição <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
                </label>
                <div className="rounded-md overflow-hidden tiptap-wrapper" style={{ border: '0.5px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  <div className="flex items-center gap-0.5 px-2 py-1.5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {[
                      { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), name: 'bold' },
                      { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), name: 'italic' },
                      { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), name: 'bulletList' },
                    ].map(({ icon: Icon, action, name }) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); action() }}
                        className="p-1.5 rounded transition-colors hover:bg-[var(--bg-elevated)]"
                        style={{ color: editor?.isActive(name) ? 'var(--accent)' : 'var(--text-muted)', backgroundColor: editor?.isActive(name) ? 'var(--bg-elevated)' : 'transparent' }}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)', minHeight: '100px' }}>
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Links <span style={{ color: 'var(--text-muted)' }}>(Jira, GitHub, Figma…)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink() } }}
                    placeholder="https://…"
                    className="flex-1 px-3 py-2 rounded-md text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-3 py-2 rounded-md text-sm transition-colors hover:bg-[var(--bg-surface)]"
                    style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <Link2 size={14} />
                  </button>
                </div>
                {pendingLinks.length > 0 && (
                  <div className="space-y-1.5">
                    {pendingLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--bg-surface)', border: '0.5px solid var(--border)' }}>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: FERRAMENTA_COLOR[link.ferramenta] + '22', color: FERRAMENTA_COLOR[link.ferramenta], border: `0.5px solid ${FERRAMENTA_COLOR[link.ferramenta]}44` }}>
                          {FERRAMENTA_LABEL[link.ferramenta]}
                        </span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-xs truncate flex items-center gap-1 hover:underline" style={{ color: 'var(--text-secondary)' }} onClick={(e) => e.stopPropagation()}>
                          {link.url}<ExternalLink size={10} className="flex-shrink-0" />
                        </a>
                        <button type="button" onClick={() => handleRemoveLink(i)} className="p-1 rounded transition-colors hover:bg-[var(--bg-elevated)] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Imagens */}
              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Imagens <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
                </label>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                {pendingImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {pendingImages.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img src={img.base64} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[var(--bg-surface)] w-full justify-center" style={{ border: '0.5px dashed var(--border)', color: 'var(--text-muted)' }}>
                  <ImagePlus size={14} />Adicionar imagem
                </button>
              </div>

              {error && <p className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: '0.5px solid var(--border)' }}>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface)]" style={{ color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar demanda'}
              </button>
            </div>
          </form>
        )}

        {/* ── Aba Timer — fora do form, nenhum aninhamento ── */}
        {activeTab === 'timer' && isEditing && (
          <div className="p-6">
            <Timer demanda={demanda} />
          </div>
        )}
      </div>
    </div>
  )
}
