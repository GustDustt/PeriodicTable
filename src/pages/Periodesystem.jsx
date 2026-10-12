import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Seo from '../components/layout/Seo.jsx'
import PeriodicTable from '../components/periodic/PeriodicTable.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { useFormat } from '../hooks/useFormat.js'
import '../components/periodic/periodic.css'

const CATS = ['nonmetal', 'semimetal', 'metal']

export default function Periodesystem() {
  const { t, lang, num } = useFormat()
  const navigate = useNavigate()
  const [el, setEl] = useState(null)
  const close = useCallback(() => setEl(null), [])

  return (
    <div className="page page--wide">
      <Seo page="table" path="/periodesystem" />
      <h1 className="page__title">{t('table.title')}</h1>
      <div className="legend">
        {CATS.map((c) => (
          <span key={c} className="legend__item">
            <span className={`legend__swatch cat-${c}`} aria-hidden="true" />
            {t(`table.${c}`)}
          </span>
        ))}
      </div>
      <p className="note table-hint">{t('table.scrollHint')}</p>
      <div className="ptable-scroll">
        <PeriodicTable lang={lang} onSelect={setEl} selected={el?.z} />
      </div>

      <Sheet open={!!el} onClose={close} title={el ? el.name[lang] || el.name.nb : ''}>
        {el && (
          <>
            <div className="detail__head">
              <span className={`detail__sym cat-${el.cat}`}>{el.sym}</span>
              <div>
                <p className="detail__name">{el.name[lang] || el.name.nb}</p>
                {lang === 'en' && <p className="note">{el.name.nb}</p>}
              </div>
            </div>
            <dl className="detail__list num">
              <dt>{t('table.atomicNumber')}</dt>
              <dd>{el.z}</dd>
              <dt>{t('table.mass')}</dt>
              <dd>{el.stable ? `${num(el.mass)} u` : `(${el.mass})`}</dd>
              <dt>{t('table.electronegativity')}</dt>
              <dd>{el.en ? num(el.en) : t('table.none')}</dd>
              <dt>{t('table.state')}</dt>
              <dd>{t(`table.state_${el.state}`)}</dd>
              <dt>{t('table.category')}</dt>
              <dd>{t(`table.${el.cat}`)}</dd>
            </dl>
            {!el.stable && <p className="note">{t('table.unstableNote')}</p>}
            <button
              type="button"
              className="btn btn--primary sheet__done"
              onClick={() => navigate(`/?f=${encodeURIComponent(el.sym)}`)}
            >
              {t('table.insert')}
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}
