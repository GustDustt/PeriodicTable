import { create } from 'zustand'

let timer = null

export const useToast = create((set) => ({
  toast: null,
  show: (message, action) => {
    clearTimeout(timer)
    const id = Date.now()
    set({ toast: { id, message, action } })
    timer = setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), action ? 5000 : 2200)
  },
  hide: () => {
    clearTimeout(timer)
    set({ toast: null })
  },
}))
