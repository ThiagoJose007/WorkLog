import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../store/useToastStore'
import type { ToastItem } from '../store/useToastStore'

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLE = {
  success: {
    bg: 'var(--color-success-fill)',
    text: 'var(--color-success-text)',
    border: 'rgba(159,225,203,0.12)',
  },
  error: {
    bg: 'var(--color-danger-fill)',
    text: 'var(--color-danger-text)',
    border: 'rgba(247,193,193,0.12)',
  },
  info: {
    bg: 'var(--bg-elevated)',
    text: 'var(--text-primary)',
    border: 'var(--border-hover)',
  },
}

function ToastCard({ id, message, type }: ToastItem) {
  const { removeToast } = useToastStore()
  const Icon = ICON[type]
  const s = STYLE[type]

  return (
    <div
      className="toast-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px 10px 14px',
        borderRadius: '10px',
        border: `0.5px solid ${s.border}`,
        backgroundColor: s.bg,
        boxShadow: '0 8px 32px rgba(0,0,0,0.48)',
        minWidth: '220px',
        maxWidth: '340px',
      }}
    >
      <Icon size={15} style={{ color: s.text, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: s.text, flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <button
        onClick={() => removeToast(id)}
        style={{
          padding: '2px',
          borderRadius: '4px',
          color: s.text,
          opacity: 0.55,
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Fechar"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function Toast() {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastCard {...t} />
        </div>
      ))}
    </div>
  )
}
