import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'

// The calculator chunk starts downloading as soon as this module runs, in
// parallel with React mounting, so lazy() costs no extra round trip on "/".
const loadCalculator = () => import('./pages/Calculator.jsx')
loadCalculator()

const Calculator = lazy(loadCalculator)
const Sum = lazy(() => import('./pages/Sum.jsx'))
const Reaksjon = lazy(() => import('./pages/Reaksjon.jsx'))
const Stoffmengde = lazy(() => import('./pages/Stoffmengde.jsx'))
const Konsentrasjon = lazy(() => import('./pages/Konsentrasjon.jsx'))
const Masseprosent = lazy(() => import('./pages/Masseprosent.jsx'))
const Empirisk = lazy(() => import('./pages/Empirisk.jsx'))
const Periodesystem = lazy(() => import('./pages/Periodesystem.jsx'))
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const Mer = lazy(() => import('./pages/Mer.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/sum" element={<Sum />} />
        <Route path="/reaksjon" element={<Reaksjon />} />
        <Route path="/stoffmengde" element={<Stoffmengde />} />
        <Route path="/konsentrasjon" element={<Konsentrasjon />} />
        <Route path="/masseprosent" element={<Masseprosent />} />
        <Route path="/empirisk" element={<Empirisk />} />
        <Route path="/periodesystem" element={<Periodesystem />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/mer" element={<Mer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}
