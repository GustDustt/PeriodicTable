import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Icon from './Icon.jsx'
import './sheet.css'

// Bottom sheet on phones, centred dialog on wide screens. Escape and the
// backdrop close it; focus moves in on open and back to the opener on close.
// Only lazily loaded code imports this file, which keeps framer-motion out of
// the calculator's first load.
export default function Sheet({ open, onClose, title, children, wide = false }) {
  const { t } = useTranslation()
  const titleId = useId()
  const panel = useRef(null)
  const opener = useRef(null)

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const raf = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }))
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
      opener.current?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <div className="sheet-root">
              <m.div
                className="sheet-backdrop"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
              <m.div
                ref={panel}
                className={`sheet ${wide ? 'sheet--wide' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="sheet__head">
                  <h2 id={titleId} className="sheet__title">{title}</h2>
                  <button type="button" className="icon-btn" onClick={onClose} aria-label={t('sheet.close')}>
                    <Icon name="close" />
                  </button>
                </div>
                <div className="sheet__body">{children}</div>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}
