'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import { canUseDOM } from '@/utilities/canUseDOM'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>('light')

  const setTheme = useCallback((themeToSet: Theme | null) => {
    // Temporarily lock theme to light only
    const nextTheme: Theme = 'light'
    setThemeState(nextTheme)
    if (canUseDOM) {
      try {
        window.localStorage.setItem(themeLocalStorageKey, nextTheme)
      } catch {
        // ignore
      }
      document.documentElement.setAttribute('data-theme', nextTheme)
    }
  }, [])

  useEffect(() => {
    const themeToSet: Theme = 'light'
    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)
  }, [])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
