import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../lib/storage.js'
import { DEFAULT_MODE, normalizeMode } from '../lib/rounding.js'

export const SETTINGS_KEY = 'molarmasse-settings'

export const useSettings = create(
  persist(
    (set) => ({
      mode: DEFAULT_MODE,
      perElement: false,
      lang: 'nb',
      theme: 'system',
      keypad: true,
      breakdownOpen: true,
      setMode: (mode) => set({ mode: normalizeMode(mode) }),
      setPerElement: (perElement) => set({ perElement: !!perElement }),
      setLang: (lang) => set({ lang: lang === 'en' ? 'en' : 'nb' }),
      setTheme: (theme) => set({ theme: ['light', 'dark'].includes(theme) ? theme : 'system' }),
      setKeypad: (keypad) => set({ keypad: !!keypad }),
      setBreakdownOpen: (breakdownOpen) => set({ breakdownOpen: !!breakdownOpen }),
    }),
    {
      name: SETTINGS_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Stored data is untrusted (older versions, hand edits), so the mode is
      // re-validated instead of trusted.
      merge: (stored, current) => {
        const s = stored && typeof stored === 'object' ? stored : {}
        return {
          ...current,
          mode: normalizeMode(s.mode ?? current.mode),
          perElement: s.perElement === true,
          lang: s.lang === 'en' ? 'en' : 'nb',
          theme: ['light', 'dark'].includes(s.theme) ? s.theme : 'system',
          keypad: s.keypad !== false,
          breakdownOpen: s.breakdownOpen !== false,
        }
      },
    },
  ),
)
