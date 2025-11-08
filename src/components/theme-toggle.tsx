"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('violet');
    } else {
      setTheme('light');
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
      {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
      {theme === 'violet' && <Sparkles className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
