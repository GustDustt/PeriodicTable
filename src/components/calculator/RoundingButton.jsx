import { lazy, Suspense, useCallback, useState } from 'react'
import Icon from '../ui/Icon.jsx'
import { useFormat } from '../../hooks/useFormat.js'
import { useSettings } from '../../store/settings.js'
import './rounding.css'

// The sheet (and the animation library behind it) is not needed to show the
// first answer, so it loads on demand; Calculator prefetches it when idle.
const RoundingSheet = lazy(() => import('./RoundingSheet.jsx'))

export default function RoundingButton() {
  const { t, modeLabel } = useFormat()
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const perAtom = perElement && mode.type !== 'exact'

  return (
    <>
      <button
        type="button"
        className="pill"
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
        aria-haspopup="dialog"
        aria-label={`${t('rounding.open')}: ${modeLabel(mode)}`}
      >
        <span>{modeLabel(mode)}</span>
        {perAtom && <span className="pill__extra">· {t('rounding.perAtomShort')}</span>}
        <Icon name="chevron" size={18} />
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <RoundingSheet open={open} onClose={close} />
        </Suspense>
      )}
    </>
  )
}
