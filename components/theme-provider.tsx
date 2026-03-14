'use client'

import * as React from 'react'
import {
  useTheme,
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useStore } from '@/lib/store'

function ThemeStoreSync() {
  const { theme } = useTheme()
  const setTheme = useStore((state) => state.setTheme)

  React.useEffect(() => {
    if (!theme) return

    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      setTheme(theme)
    }
  }, [theme, setTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeStoreSync />
      {children}
    </NextThemesProvider>
  )
}
