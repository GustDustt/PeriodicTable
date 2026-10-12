import { Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TabBar from './TabBar.jsx'
import Toast from '../ui/Toast.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import './layout.css'

export default function AppShell({ children }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  useTheme()
  return (
    <div className="shell">
      <main className="shell__main">
        <Suspense fallback={<p className="shell__loading">{t('app.loading')}</p>}>{children}</Suspense>
      </main>
      <TabBar pathname={pathname} />
      <Toast />
    </div>
  )
}
