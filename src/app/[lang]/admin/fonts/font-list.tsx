'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { uploadFiles } from '@/lib/uploadthing'
import { testFontCompatibility } from '@/lib/font-compat'

interface UploadedFont {
  key: string
  name: string
  size: number
  uploadedAt: number
  status: string
}

export function FontList() {
  const t = useTranslations('adminFonts')
  const [fonts, setFonts] = useState<UploadedFont[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [incompatibleKeys, setIncompatibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFonts()
  }, [])

  useEffect(() => {
    if (fonts.length === 0) return
    let cancelled = false
    const newIncKeys = new Set<string>()

    Promise.all(
      fonts.map(async (font) => {
        try {
          const res = await fetch(`/api/fonts/uploaded?key=${font.key}`)
          if (!res.ok) {
            console.warn('[FontCheck] fetch failed for font', font.key, res.status)
            return
          }
          const buf = await res.arrayBuffer()
          const compatible = await testFontCompatibility(new Uint8Array(buf), `uploaded:${font.key}`)
          if (!compatible) {
            newIncKeys.add(font.key)
          }
        } catch (err) {
          console.warn('[FontCheck] error checking font', font.key, err)
        }
      }),
    ).then(() => {
      if (!cancelled) setIncompatibleKeys(newIncKeys)
    })

    return () => { cancelled = true }
  }, [fonts])

  async function fetchFonts() {
    try {
      const res = await fetch('/api/admin/fonts/uploaded')
      if (!res.ok) throw new Error('Failed to fetch fonts')
      const data = await res.json()
      setFonts(data.fonts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fonts')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.ttf')) {
      setError(t('ttfOnly'))
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(t('maxSize'))
      return
    }

    setUploading(true)
    setError('')

    try {
      await uploadFiles('fontFileUpload', { files: [file] })
      await fetchFonts()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(t('deleteConfirm'))) return
    setDeleting(key)

    try {
      const res = await fetch(`/api/admin/fonts/uploaded/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      setFonts((prev) => prev.filter((f) => f.key !== key))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {uploading ? t('uploading') : t('uploadFont')}
            <input
              type="file"
              accept=".ttf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {fonts.length === 0 ? (
        <p className="text-muted-foreground">{t('noFonts')}</p>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('name')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('size')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadedAt')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {fonts.map((font) => (
                <tr key={font.key} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {font.name}
                    {incompatibleKeys.has(font.key) && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-200">
                        {t('fontIncompatibleWarning')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatSize(font.size)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(font.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(font.key)}
                      disabled={deleting === font.key}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === font.key ? t('deleting') : t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
