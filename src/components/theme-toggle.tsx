"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = stored === "dark" || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      className="flex size-8 items-center justify-center rounded-lg text-graphite/60 transition-colors hover:bg-graphite/5 hover:text-graphite dark:text-snow/60 dark:hover:bg-snow/10 dark:hover:text-snow"
      aria-label="Toggle dark mode"
    >
      <HugeiconsIcon icon={dark ? Sun01Icon : Moon02Icon} className="size-4" />
    </button>
  )
}
