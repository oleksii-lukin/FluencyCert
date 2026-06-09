'use client'

import { useState } from 'react'

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
  const [addName, setAddName] = useState('Landscape')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const [menuVariantId, setMenuVariantId] = useState<string | null>(null)

  async function handleAdd() {
    if (!addName.trim() || !addFile) return
    setAdding(true)
    setAddError('')
    const result = await onAddVariant(addName.trim(), addFile)
    if (result.success) {
      setShowAddModal(false)
      setAddName('Landscape')
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
          <div key={v.id} className="relative">
            <button
              type="button"
              onClick={() => onSelectTab(v.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === v.id
                  ? 'bg-harvest-orange/10 text-harvest-orange border-b-2 border-harvest-orange'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
              }`}
            >
              {v.name}
              {activeTab === v.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuVariantId(menuVariantId === v.id ? null : v.id)
                  }}
                  className="rounded px-0.5 py-0.5 text-xs leading-none hover:bg-harvest-orange/20"
                  aria-label={`Options for ${v.name}`}
                >
                  ⋮
                </button>
              )}
            </button>
            {menuVariantId === v.id && (
              <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border bg-background shadow-lg">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setRenameId(v.id)
                    setRenameName(v.name)
                    setMenuVariantId(null)
                  }}
                >
                  {t('renameVariant')}
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuVariantId(null)
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
                <label className="block text-sm font-medium mb-2">{t('variantOrientation')}</label>
                <div className="flex gap-2">
                  {(['Landscape', 'Portrait', 'Custom'] as const).map((opt) => {
                    const isCustom = opt === 'Custom'
                    const isActive = isCustom
                      ? addName !== 'Landscape' && addName !== 'Portrait'
                      : addName === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (isCustom) {
                            setAddName('')
                          } else {
                            setAddName(opt)
                          }
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                          isActive
                            ? 'bg-bright-sky text-white border-bright-sky'
                            : 'bg-background text-muted-foreground border hover:bg-muted'
                        }`}
                      >
                        {opt === 'Custom' ? t('variantOrientationCustom') : opt}
                      </button>
                    )
                  })}
                </div>
                {addName !== 'Landscape' && addName !== 'Portrait' && (
                  <input
                    type="text"
                    className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky mt-2"
                    placeholder={t('variantCustomName')}
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    aria-label="Custom variant name"
                  />
                )}
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
