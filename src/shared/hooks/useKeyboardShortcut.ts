import { useEffect, useRef } from 'react'

function isInputActive(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

/**
 * Registers a global keydown listener for a single key.
 * Does NOT fire when an input/textarea/select or contenteditable is focused,
 * or when any modifier key (Ctrl, Meta, Alt, Shift) is held.
 * `enabled` can be set to false to temporarily disable (e.g. when a modal is open).
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  enabled = true,
) {
  // Stable ref so the effect doesn't re-run on every render
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isInputActive()) return
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      e.preventDefault()
      callbackRef.current()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [key, enabled])
}
