import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = create<{ mode: ThemeMode; setMode: (mode: ThemeMode) => void }>()(
  persist((set) => ({ mode: 'system', setMode: (mode) => set({ mode }) }), { name: 'uwcb-theme' }),
)

/** Resolved light/dark, following the OS when mode is "system". Applies the `dark` class. */
export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    if (mode !== 'system') return
    const onChange = () => document.documentElement.classList.toggle('dark', media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode, resolved, media])
  return resolved
}
