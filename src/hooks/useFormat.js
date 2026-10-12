import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDecimal } from '../utils/format.js'

export function useFormat() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const num = useCallback((v) => formatDecimal(v, lang), [lang])
  const modeLabel = useCallback(
    (mode) => (mode.type === 'exact' ? t('rounding.exact') : t(`rounding.${mode.type}`, { count: mode.digits })),
    [t],
  )
  const errorText = useCallback(
    (error) => (error ? t(`errors.${error.code}`, { ...error.params, pos: error.pos }) : ''),
    [t],
  )
  return { t, lang, num, modeLabel, errorText }
}
