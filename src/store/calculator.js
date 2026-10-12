import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../lib/storage.js'

const text = (v) => (typeof v === 'string' ? v : '')

// Lives outside the pages so each input survives switching tabs and reloads.
export const useCalculator = create(
  persist(
    (set) => ({
      formula: '',
      expression: '',
      equation: '',
      setFormula: (formula) => set({ formula }),
      setExpression: (expression) => set({ expression }),
      setEquation: (equation) => set({ equation }),
    }),
    {
      name: 'molarmasse-current',
      storage: createJSONStorage(() => safeStorage),
      merge: (stored, current) => ({
        ...current,
        formula: text(stored?.formula),
        expression: text(stored?.expression),
        equation: text(stored?.equation),
      }),
    },
  ),
)
