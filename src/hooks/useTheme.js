import { useEffect } from 'react'
import { useSettings } from '../store/settings.js'

const DARK = '(prefers-color-scheme: dark)'

// index.html sets data-theme before first paint; this keeps it in sync with
// the setting and with the OS when the setting is 'system'.
export function useTheme() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    const media = window.matchMedia(DARK)
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.content = resolved === 'dark' ? '#101416' : '#f4f3ee'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
