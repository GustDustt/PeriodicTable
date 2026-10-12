import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../lib/storage.js'

export const useQuizStore = create(
  persist(
    (set) => ({
      streak: 0,
      best: 0,
      answered: (right) =>
        set((s) => {
          const streak = right ? s.streak + 1 : 0
          return { streak, best: Math.max(s.best, streak) }
        }),
    }),
    {
      name: 'molarmasse-quiz',
      storage: createJSONStorage(() => safeStorage),
      merge: (stored, current) => ({
        ...current,
        streak: Number.isInteger(stored?.streak) ? stored.streak : 0,
        best: Number.isInteger(stored?.best) ? stored.best : 0,
      }),
    },
  ),
)
