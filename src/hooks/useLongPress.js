import { useCallback, useEffect, useRef } from 'react'

// Tap -> onPress, hold -> onLongPress (and the following click is swallowed).
export function useLongPress(onLongPress, onPress, ms = 550) {
  const timer = useRef(null)
  const fired = useRef(false)

  const cancel = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return
      fired.current = false
      cancel()
      timer.current = setTimeout(() => {
        fired.current = true
        onLongPress()
      }, ms)
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    // Mobile browsers open a context menu on long touch, which would steal
    // the gesture.
    onContextMenu: (e) => e.preventDefault(),
    onClick: () => {
      if (fired.current) {
        fired.current = false
        return
      }
      onPress()
    },
  }
}
