import { useState, useEffect, useRef } from 'react'
import { X, Bold, Italic, List, ImagePlus, Trash2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Demanda } from '../../../db/types'
import {
  useRegistroDiarioPorData,
  useDiarioDemandas,
  useDiarioImagens,
  upsertRegistroDiario,
  updateRegistroDiario,
  vincularDemandaAoRegistro,
  desvincularDemandaDoRegistro,
  addDiarioImagem,
  deleteDiarioImagem,
} from '../../../db/hooks/useRegistros'
import { useProjeto } from '../../../db/hooks/useProjetos'
import {
  DemandaTipoBadge,
  DemandaStatusBadge,
} from '../../projetos/components/StatusBadge'
import { resizeImageToBase64 } from '../../../shared/utils/image'
import { DemandaSelector } from './DemandaSelector'

// ── Chip de demanda vinculada ────────────────────────────────────────────────

function DemandaChip({
  demanda,
  onRemove,
}: {
  demanda: Demanda
  onRemove: () => void
}) {
  const projeto = useProjeto(demanda.projeto_id)

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      <DemandaTipoBadge tipo={demanda.tipo} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {demanda.titulo}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {projeto?.nome ?? '…'}
        </p>
      </div>

      <DemandaStatusBadge status={demanda.status} />

      <button
        onClick={onRemove}
        className="p-1 rounded flex-shrink-0 transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ color: 'var(--text-muted)' }}
        title="Desvincular"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Editor principal ─────────────────────────────────────────────────────────

interface RegistroEditorProps {
  data: string       // YYYY-MM-DD
  empresaId: string
  accentColor: string
}

export function RegistroEditor({ data, empresaId, accentColor }: RegistroEditorProps) {
  const existingRecord = useRegistroDiarioPorData(empresaId, data)

  // diarioId é null até o registro ser criado (lazy)
  const [diarioId, setDiarioId] = useState<string | null>(null)
  const diarioIdRef = useRef<string | null>(null)

  // Sync diarioId quando o registro existente carrega
  useEffect(() => {
    if (existingRecord?.id) {
      setDiarioId(existingRecord.id)
      diarioIdRef.current = existingRecord.id
    }
  }, [existingRecord?.id])

  const linkedDemandas = useDiarioDemandas(diarioId)
  const imagens = useDiarioImagens(diarioId)

  // ── TipTap ────────────────────────────────────────────────────────────────

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [pendingAutoSave, setPendingAutoSave] = useState(false)
  const editorInitialized = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'O que foi feito hoje? Registre reuniões, decisões, bloqueios…',
      }),
    ],
    content: '',
    editorProps: { attributes: { class: 'tiptap-content' } },
    onUpdate: () => setPendingAutoSave(true),
  })

  // Inicializar conteúdo quando registro existente carrega
  useEffect(() => {
    if (!editor || editorInitialized.current) return
    if (existingRecord !== undefined) {
      editor.commands.setContent(existingRecord?.texto ?? '')
      editorInitialized.current = true
    }
  }, [editor, existingRecord])

  // Fallback: se após 250ms ainda não inicializou (sem registro), inicializa vazio
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!editor || editorInitialized.current) return
      editor.commands.setContent('')
      editorInitialized.current = true
    }, 250)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // ── Auto-save com debounce ─────────────────────────────────────────────────

  useEffect(() => {
    if (!pendingAutoSave) return

    const timer = setTimeout(async () => {
      const html = editor?.getHTML()
      const texto = html && html !== '<p></p>' ? html : undefined

      // Não criar registro vazio (RN-09): só salva se houver texto OU registro já existe
      if (!texto && !diarioIdRef.current) {
        setPendingAutoSave(false)
        return
      }

      setSaveStatus('saving')
      try {
        let id = diarioIdRef.current
        if (!id) {
          id = await upsertRegistroDiario(empresaId, data)
          setDiarioId(id)
          diarioIdRef.current = id
        }
        await updateRegistroDiario(id, { texto })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
      setPendingAutoSave(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [pendingAutoSave, editor, empresaId, data])

  // ── Lazy create ────────────────────────────────────────────────────────────

  async function ensureDiario(): Promise<string> {
    if (diarioIdRef.current) return diarioIdRef.current
    const id = await upsertRegistroDiario(empresaId, data)
    setDiarioId(id)
    diarioIdRef.current = id
    return id
  }

  // ── Demandas ──────────────────────────────────────────────────────────────

  async function handleVincular(demandaId: string) {
    const id = await ensureDiario()
    await vincularDemandaAoRegistro(id, demandaId)
  }

  async function handleDesvincular(demandaId: string) {
    if (!diarioId) return
    await desvincularDemandaDoRegistro(diarioId, demandaId)
  }

  // ── Imagens ───────────────────────────────────────────────────────────────

  const imageInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const id = await ensureDiario()
    for (const file of files) {
      const base64 = await resizeImageToBase64(file)
      await addDiarioImagem({ diario_id: id, arquivo_base64: base64 })
    }
    e.target.value = ''
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Status do auto-save */}
      <div className="flex items-center justify-end h-4">
        {saveStatus !== 'idle' && (
          <span
            className="text-xs transition-opacity"
            style={{
              color: saveStatus === 'saving' ? 'var(--text-muted)' : 'var(--color-success-text)',
            }}
          >
            {saveStatus === 'saving' ? 'Salvando…' : 'Salvo ✓'}
          </span>
        )}
      </div>

      {/* TipTap */}
      <div
        className="rounded-xl overflow-hidden tiptap-wrapper"
        style={{
          border: '0.5px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center gap-0.5 px-2 py-1.5"
          style={{ borderBottom: '0.5px solid var(--border)' }}
        >
          {([
            { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), name: 'bold' },
            { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), name: 'italic' },
            { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), name: 'bulletList' },
          ] as const).map(({ icon: Icon, action, name }) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); action() }}
              className="p-1.5 rounded transition-colors hover:bg-[var(--bg-elevated)]"
              style={{
                color: editor?.isActive(name) ? accentColor : 'var(--text-muted)',
                backgroundColor: editor?.isActive(name) ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Área de texto */}
        <div
          className="px-4 py-3 text-sm"
          style={{ color: 'var(--text-primary)', minHeight: '160px' }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Demandas referenciadas ── */}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Demandas referenciadas
          {linkedDemandas && linkedDemandas.length > 0 && (
            <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
              · {linkedDemandas.length}
            </span>
          )}
        </p>

        {linkedDemandas && linkedDemandas.length > 0 && (
          <div className="space-y-1.5">
            {linkedDemandas.map((d) => (
              <DemandaChip
                key={d.id}
                demanda={d}
                onRemove={() => handleDesvincular(d.id)}
              />
            ))}
          </div>
        )}

        <DemandaSelector
          empresaId={empresaId}
          linkedIds={linkedDemandas?.map((d) => d.id) ?? []}
          onVincular={handleVincular}
        />
      </div>

      {/* ── Imagens ── */}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Imagens
          {imagens && imagens.length > 0 && (
            <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
              · {imagens.length}
            </span>
          )}
        </p>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />

        {imagens && imagens.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-1">
            {imagens.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-square rounded-lg overflow-hidden"
                style={{ border: '0.5px solid var(--border)' }}
              >
                <img
                  src={img.arquivo_base64}
                  alt={img.legenda ?? ''}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deleteDiarioImagem(img.id)}
                  className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.72)', color: '#fff' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full justify-center transition-colors hover:bg-[var(--bg-surface)]"
          style={{ border: '0.5px dashed var(--border)', color: 'var(--text-muted)' }}
        >
          <ImagePlus size={13} />
          Adicionar imagem
        </button>
      </div>
    </div>
  )
}
