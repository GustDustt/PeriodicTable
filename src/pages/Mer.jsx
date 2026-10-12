import { Link } from 'react-router-dom'
import Seo from '../components/layout/Seo.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import Icon from '../components/ui/Icon.jsx'
import RoundingControls from '../components/calculator/RoundingControls.jsx'
import { useFormat } from '../hooks/useFormat.js'
import { useSettings } from '../store/settings.js'
import { useHistory } from '../store/history.js'
import { useToast } from '../store/toast.js'
import '../components/extras/extras.css'

const TOOLS = [
  { to: '/stoffmengde', icon: 'flask', title: 'amount.title', desc: 'more.amountDesc' },
  { to: '/konsentrasjon', icon: 'flask', title: 'conc.title', desc: 'more.concDesc' },
  { to: '/masseprosent', icon: 'percent', title: 'percent.title', desc: 'more.percentDesc' },
  { to: '/empirisk', icon: 'calc', title: 'empirical.title', desc: 'more.empiricalDesc' },
  { to: '/quiz', icon: 'check', title: 'quiz.title', desc: 'more.quizDesc' },
]

export default function Mer() {
  const { t } = useFormat()
  const lang = useSettings((s) => s.lang)
  const theme = useSettings((s) => s.theme)
  const keypad = useSettings((s) => s.keypad)
  const setLang = useSettings((s) => s.setLang)
  const setTheme = useSettings((s) => s.setTheme)
  const setKeypad = useSettings((s) => s.setKeypad)
  const recent = useHistory((s) => s.recent)
  const clearRecent = useHistory((s) => s.clearRecent)
  const showToast = useToast((s) => s.show)

  return (
    <div className="page">
      <Seo page="more" path="/mer" />
      <h1 className="page__title">{t('more.title')}</h1>

      <section className="stack">
        <h2 className="section__title">{t('more.tools')}</h2>
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="card linkcard">
            <Icon name={tool.icon} className="linkcard__icon" />
            <span>
              <strong>{t(tool.title)}</strong>
              <span className="note">{t(tool.desc)}</span>
            </span>
            <Icon name="arrow" />
          </Link>
        ))}
      </section>

      <section className="stack">
        <h2 className="section__title">{t('more.settings')}</h2>
        <div className="card stack">
          <div className="field">
            <span className="field__label">{t('more.language')}</span>
            <Segmented
              label={t('more.language')}
              value={lang}
              onChange={setLang}
              options={[
                { value: 'nb', label: t('more.langNb') },
                { value: 'en', label: t('more.langEn') },
              ]}
            />
          </div>
          <div className="field">
            <span className="field__label">{t('more.theme')}</span>
            <Segmented
              label={t('more.theme')}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: t('more.themeSystem') },
                { value: 'light', label: t('more.themeLight') },
                { value: 'dark', label: t('more.themeDark') },
              ]}
            />
          </div>
          <div className="field">
            <span className="field__label">{t('more.keypad')}</span>
            <Segmented
              label={t('more.keypad')}
              value={keypad ? 'custom' : 'native'}
              onChange={(v) => setKeypad(v === 'custom')}
              options={[
                { value: 'custom', label: t('more.keypadCustom') },
                { value: 'native', label: t('more.keypadNative') },
              ]}
            />
          </div>
        </div>
        <div className="card">
          <h3 className="field__label">{t('rounding.title')}</h3>
          <RoundingControls />
        </div>
        <button
          type="button"
          className="btn"
          disabled={!recent.length}
          onClick={() => {
            clearRecent()
            showToast(t('more.cleared'))
          }}
        >
          {t('more.clearRecent')}
        </button>
      </section>

      <section className="stack">
        <h2 className="section__title">{t('more.about')}</h2>
        <p className="note">{t('more.aboutText')}</p>
        <p className="note">{t('more.offline')}</p>
      </section>
    </div>
  )
}
