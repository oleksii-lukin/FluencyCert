'use client'

import { useRef, useState } from 'react'

interface VariantData {
  id: string
  name: string
  file_url: string
}

interface VariantTabsProps {
  variants: VariantData[]
  activeTab: string
  onSelectTab: (tab: string) => void
  onAddVariant: (name: string, file: File) => Promise<{ success: boolean; error?: string }>
  onRenameVariant: (variantId: string, name: string) => Promise<boolean>
  onDeleteVariant: (variantId: string) => Promise<boolean>
  t: (key: string) => string
}

export function VariantTabs({
  variants,
  activeTab,
  onSelectTab,
  onAddVariant,
  onRenameVariant,
  onDeleteVariant,
  t,
}: VariantTabsProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function handleAdd() {
    if (!addName.trim() || !addFile) return
    setAdding(true)
    setAddError('')
    const result = await onAddVariant(addName.trim(), addFile)
    if (result.success) {
      setShowAddModal(false)
      setAddName('')
      setAddFile(null)
    } else {
      setAddError(result.error ?? 'Failed to add variant')
    }
    setAdding(false)
  }

  async function handleRename() {
    if (!renameId || !renameName.trim()) return
    setRenaming(true)
    const ok = await onRenameVariant(renameId, renameName.trim())
    if (ok) setRenameId(null)
    setRenaming(false)
  }

  async function handleDelete(variantId: string) {
    if (!confirm(t('deleteVariantConfirm'))) return
    await onDeleteVariant(variantId)
  }

  return (
    <>
      <div className="flex items-center gap-1 border-b pb-2">
        <button
          type="button"
          onClick={() => onSelectTab('main')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'main'
              ? 'bg-harvest-orange/10 text-harvest-orange border-b-2 border-harvest-orange'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
          }`}
        >
          {t('defaultConfig')}
        </button>
        {variants.map((v) => (
          <div key={v.id} className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => onSelectTab(v.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === v.id
                  ? 'bg-harvest-orange/10 text-harvest-orange border-b-2 border-harvest-orange'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
              }`}
            >
              {v.name}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenDropdown(openDropdown === v.id ? null : v.id)
              }}
              className="ml-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
              aria-label={`Options for ${v.name}`}
              style={{ position: 'absolute', right: -16, top: 2 }}
            >
              ⋮
            </button>
            {openDropdown === v.id && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border bg-background shadow-lg">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setRenameId(v.id)
                    setRenameName(v.name)
                    setOpenDropdown(null)
                  }}
                >
                  {t('renameVariant')}
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setOpenDropdown(null)
                    handleDelete(v.id)
                  }}
                >
                  {t('deleteVariant')}
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted ml-2"
        >
          + {t('addVariant')}
        </button>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t('addVariant')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('variantName')}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  aria-label="Variant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pdfFile')}</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  className="w-full text-sm"
                  aria-label="Upload variant PDF file"
                  onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {addError && <p className="text-sm text-red-500">{addError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || !addName.trim() || !addFile}
                  className="rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {adding ? t('uploading') : t('addVariant')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renameId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setRenameId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t('renameVariant')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('variantName')}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  aria-label="New variant name"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRenameId(null)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={renaming || !renameName.trim()}
                  className="rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {renaming ? t('saving') : t('renameVariant')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
