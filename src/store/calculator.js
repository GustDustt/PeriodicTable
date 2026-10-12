import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../lib/storage.js'

// Lives outside the page so the formula survives switching tabs and reloads.
export const useCalculator = create(
  persist(
    (set) => ({
      formula: '',
      setFormula: (formula) => set({ formula }),
    }),
    {
      name: 'molarmasse-current',
      storage: createJSONStorage(() => safeStorage),
      merge: (stored, current) => ({ ...current, formula: typeof stored?.formula === 'string' ? stored.formula : '' }),
    },
  ),
)
