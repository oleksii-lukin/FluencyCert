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
      className="flex size-7 items-center justify-center rounded-xl border border-bright-sky/40 shadow-sm shadow-bright-sky/10 text-graphite/60 transition-colors hover:bg-bright-sky/10 hover:text-bright-sky dark:text-snow/60 dark:hover:bg-bright-sky/15 dark:hover:text-bright-sky"
      aria-label="Toggle dark mode"
    >
      <HugeiconsIcon icon={dark ? Sun01Icon : Moon02Icon} className="size-3.5" />
    </button>
  )
}
