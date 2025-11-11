
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props} defaultTheme="peazehub-dark" themes={['light', 'dark', 'peazehub-dark', 'violet-dark', 'matrix-dark', 'disney-dark', 'cn-dark']}>{children}</NextThemesProvider>
}
