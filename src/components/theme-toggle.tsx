"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"

function getInitialDark(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = stored === "dark" || (!stored && prefersDark)
    document.documentElement.classList.toggle("dark", isDark)
    return isDark
  }
  return false
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialDark)

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex size-8 items-center justify-center rounded-lg text-graphite/60 transition-colors hover:bg-graphite/5 hover:text-graphite dark:text-snow/60 dark:hover:bg-snow/10 dark:hover:text-snow"
      aria-label="Toggle dark mode"
    >
      <HugeiconsIcon icon={dark ? Sun01Icon : Moon02Icon} className="size-4" />
    </button>
  )
}
