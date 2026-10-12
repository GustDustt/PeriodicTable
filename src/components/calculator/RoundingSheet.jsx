import Sheet from '../ui/Sheet.jsx'
import RoundingControls from './RoundingControls.jsx'
import { useTranslation } from 'react-i18next'

export default function RoundingSheet({ open, onClose }) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onClose={onClose} title={t('rounding.title')}>
      <RoundingControls />
      <button type="button" className="btn btn--primary sheet__done" onClick={onClose}>
        {t('rounding.done')}
      </button>
    </Sheet>
  )
}
