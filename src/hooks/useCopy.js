import { useCallback } from 'react'

// Clipboard API needs a secure context and permission; the textarea fallback
// covers older Android WebViews where the button would otherwise do nothing.
export function useCopy() {
  return useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        area.remove()
        return ok
      } catch {
        return false
      }
    }
  }, [])
}
