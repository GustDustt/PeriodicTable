import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../ui/Icon.jsx'
import './layout.css'

// Max five tabs; the calculator is always first. The two calculators and the
// reaction tool get their own tabs; single-purpose tools live under "Mer",
// which stays highlighted on those routes.
const TABS = [
  { to: '/', icon: 'calc', key: 'calculator', end: true },
  { to: '/sum', icon: 'sigma', key: 'sum' },
  { to: '/reaksjon', icon: 'reaction', key: 'reaction' },
  { to: '/periodesystem', icon: 'table', key: 'table' },
  { to: '/mer', icon: 'more', key: 'more', also: ['/stoffmengde', '/konsentrasjon', '/masseprosent', '/empirisk', '/quiz'] },
]

export default function TabBar({ pathname }) {
  const { t } = useTranslation()
  return (
    <nav className="tabbar" aria-label={t('nav.label')}>
      {TABS.map((tab) => {
        const extra = tab.also?.includes(pathname)
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tabbar__item ${isActive || extra ? 'is-active' : ''}`}
          >
            <Icon name={tab.icon} size={22} />
            <span className="tabbar__label">{t(`nav.${tab.key}`)}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
