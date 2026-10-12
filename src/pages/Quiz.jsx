import { useCallback, useState } from 'react'
import Seo from '../components/layout/Seo.jsx'
import Formula from '../components/chem/Formula.jsx'
import Breakdown from '../components/calculator/Breakdown.jsx'
import { useFormat } from '../hooks/useFormat.js'
import { useSettings } from '../store/settings.js'
import { useQuizStore } from '../store/quiz.js'
import { makeQuestion } from '../lib/quiz.js'
import { molarMass } from '../lib/mass.js'
import '../components/extras/extras.css'

export default function Quiz() {
  const { t, lang, num, modeLabel } = useFormat()
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  const streak = useQuizStore((s) => s.streak)
  const best = useQuizStore((s) => s.best)
  const answered = useQuizStore((s) => s.answered)

  const next = useCallback((avoid) => makeQuestion({ mode, perElement, avoid }), [mode, perElement])
  const [q, setQ] = useState(() => next())
  const [chosen, setChosen] = useState(null)

  // Settings changed mid-question: rebuild so the answers use the new rounding.
  const [key, setKey] = useState(`${JSON.stringify(mode)}${perElement}`)
  const nowKey = `${JSON.stringify(mode)}${perElement}`
  if (key !== nowKey) {
    setKey(nowKey)
    setQ(next())
    setChosen(null)
  }

  const choose = (c) => {
    if (chosen) return
    setChosen(c)
    answered(c.kind === 'correct')
  }

  const reason = (c) => {
    if (c.kind === 'noHydrate') return t('quiz.noHydrate')
    if (c.kind === 'wrongCount') return t('quiz.wrongCount', { sym: c.sym })
    if (c.kind === 'swapped') return t('quiz.swapped', { sym: c.sym, swap: c.swap })
    return ''
  }

  const working = chosen ? molarMass(q.parsed.counts, { mode, perElement }) : null

  return (
    <div className="page">
      <Seo page="quiz" path="/quiz" />
      <div className="quiz__top">
        <h1 className="page__title">{t('quiz.title')}</h1>
        <div className="quiz__stats num">
          <span>{t('quiz.streak')}: <strong>{streak}</strong></span>
          <span>{t('quiz.best')}: <strong>{best}</strong></span>
        </div>
      </div>

      <section className="card quiz__q">
        <p className="note">{t('quiz.question')}</p>
        <Formula value={q.compound.formula} className="quiz__formula" />
        <p className="note">{q.compound.name[lang] || q.compound.name.nb}</p>
        <p className="note">{t('quiz.rounding', { mode: modeLabel(mode) })}</p>
      </section>

      <div className="quiz__choices">
        {q.choices.map((c) => {
          const state = !chosen ? '' : c.kind === 'correct' ? 'is-right' : c === chosen ? 'is-wrong' : 'is-dim'
          return (
            <button key={c.value} type="button" className={`quiz__choice num ${state}`} onClick={() => choose(c)} aria-disabled={!!chosen}>
              <span>{num(c.value)} g/mol</span>
              {chosen && c.kind !== 'correct' && (c === chosen) && <span className="quiz__why">{reason(c)}</span>}
            </button>
          )
        })}
      </div>

      {chosen && (
        <>
          <p className={`quiz__feedback ${chosen.kind === 'correct' ? 'is-right' : 'is-wrong'}`} role="status">
            {chosen.kind === 'correct' ? t('quiz.correct') : t('quiz.wrong', { value: num(q.correct) })}
          </p>
          <Breakdown result={working} mode={mode} />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setQ(next(q.compound.formula))
              setChosen(null)
            }}
          >
            {t('quiz.next')}
          </button>
        </>
      )}
    </div>
  )
}
