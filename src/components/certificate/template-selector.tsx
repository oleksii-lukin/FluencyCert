"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { listTemplates } from "./template-registry"
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const templateIcons: Record<string, string> = {
  "guilloche-security": "M4 4h16v16H4z",
  "modern-glass": "M4 4h16v8a8 8 0 0 1-8 8H4z",
  "neubrutal": "M4 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z",
  "memphis-retro": "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
  "cyber-neon": "M4 4h16v1H4zm0 3h16v1H4zm0 3h16v1H4zm0 3h16v1H4zm0 3h16v1H4z",
  "natural-green": "M12 4L4 20h16z",
}

interface TemplateSelectorProps {
  currentTemplateId: string
  claimId: string
}

export function TemplateSelector({ currentTemplateId, claimId }: TemplateSelectorProps) {
  const t = useTranslations('templateDescriptions')
  const tn = useTranslations('templateNames')
  const ct = useTranslations('certificateControl')
  const [selected, setSelected] = useState(currentTemplateId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const templates = listTemplates()

  async function handleSelect(templateId: string) {
    if (templateId === selected) return

    setSaving(true)
    setSaved(false)
    setError("")

    const res = await fetch("/api/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background_template: templateId, claimId }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || ct('failedUpdateTemplate'))
      setSaving(false)
      return
    }

    setSelected(templateId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => {
          const isActive = selected === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              disabled={saving}
              className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-bright-sky bg-bright-sky/5 ring-1 ring-bright-sky/30"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`mt-0.5 size-10 shrink-0 rounded-lg ${
                  isActive ? "text-bright-sky" : "text-gray-400 dark:text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d={templateIcons[template.id] || "M4 4h16v16H4z"} opacity="0.5" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isActive ? "text-bright-sky" : "text-graphite dark:text-snow"}`}>
                    {tn(template.name)}
                  </span>
                  {isActive && (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-bright-sky shrink-0" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {t(template.id === "guilloche-security" ? "guillocheSecurity" :
                    template.id === "modern-glass" ? "modernGlass" :
                    template.id === "neubrutal" ? "neubrutal" :
                    template.id === "memphis-retro" ? "memphisRetro" :
                    template.id === "cyber-neon" ? "cyberNeon" :
                    template.id === "natural-green" ? "naturalGreen" : "")}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {saving && (
        <p className="text-sm text-muted-foreground animate-pulse">{ct('savingTemplate')}</p>
      )}
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">{ct('templateSaved')}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
