'use client'

import { useState, useRef } from 'react'

const PREDEFINED_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'Navy', value: '#1a1a2e' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Gold', value: '#d4a843' },
]

function normalizeHex(input: string): string | null {
  const clean = input.replace(/^#/, '')
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) return `#${clean.toUpperCase()}`
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    const full = clean.split('').map((c) => c + c).join('')
    return `#${full.toUpperCase()}`
  }
  return null
}

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customInput, setCustomInput] = useState(value === '#000000' ? '' : value)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPredefined = PREDEFINED_COLORS.some((c) => c.value.toLowerCase() === value.toLowerCase())

  function handleCustomInputChange(raw: string) {
    setCustomInput(raw)
    const normalized = normalizeHex(raw)
    if (normalized) {
      onChange(normalized)
    }
  }

  function handleCustomBlur() {
    const normalized = normalizeHex(customInput)
    if (normalized) {
      setCustomInput(normalized)
      onChange(normalized)
    } else if (customInput.trim()) {
      setCustomInput(value)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            onClick={() => {
              onChange(color.value)
              setShowCustom(false)
              setCustomInput('')
            }}
            className={`size-8 rounded-full border-2 transition-all ${
              value.toLowerCase() === color.value.toLowerCase()
                ? 'border-bright-sky scale-110 shadow-md'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showCustom || (!isPredefined && value !== '#000000')}
            onChange={(e) => {
              setShowCustom(e.target.checked)
              if (!e.target.checked) {
                onChange('#000000')
                setCustomInput('')
              } else {
                setTimeout(() => inputRef.current?.focus(), 0)
              }
            }}
            className="rounded"
          />
          Custom
        </label>
        {(showCustom || (!isPredefined && value !== '#000000')) && (
          <div className="flex items-center gap-1.5 flex-1">
            <label className="relative cursor-pointer">
              <div
                className="size-6 shrink-0 rounded border"
                style={{ backgroundColor: value }}
              />
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value)
                  setCustomInput(e.target.value)
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <input
              ref={inputRef}
              type="text"
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              onBlur={handleCustomBlur}
              placeholder="#484747"
              className="w-28 rounded border bg-background px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-bright-sky"
            />
          </div>
        )}
      </div>
    </div>
  )
}
