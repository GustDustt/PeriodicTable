import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../lib/storage.js'

const MAX_RECENT = 20

export const useHistory = create(
  persist(
    (set) => ({
      recent: [],
      favourites: [],
      remember: (formula) =>
        set((s) => ({ recent: [formula, ...s.recent.filter((f) => f !== formula)].slice(0, MAX_RECENT) })),
      toggleFavourite: (formula) =>
        set((s) => ({
          favourites: s.favourites.includes(formula)
            ? s.favourites.filter((f) => f !== formula)
            : [formula, ...s.favourites],
        })),
      clearRecent: () => set({ recent: [] }),
    }),
    {
      name: 'molarmasse-history',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      merge: (stored, current) => {
        const list = (v) => (Array.isArray(v) ? v.filter((f) => typeof f === 'string') : [])
        return { ...current, recent: list(stored?.recent).slice(0, MAX_RECENT), favourites: list(stored?.favourites) }
      },
    },
  ),
)
