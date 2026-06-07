"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SlugDisplay({ slug: initialSlug, claimId }: { slug: string; claimId: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialSlug)
  const [displaySlug, setDisplaySlug] = useState(initialSlug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: value }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to update slug')
      setSaving(false)
      return
    }

    setDisplaySlug(value)
    setEditing(false)
    setSaving(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <code className="text-xs font-mono font-medium">{displaySlug}</code>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-bright-sky transition-colors"
          title="Edit slug"
        >
          ✎
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="text"
        aria-label="Slug"
        className="w-28 rounded border px-1.5 py-0.5 text-xs font-mono uppercase"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={20}
        autoFocus
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !value.trim()}
        className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
      >
        {saving ? '...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => { setEditing(false); setValue(displaySlug); setError('') }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}
