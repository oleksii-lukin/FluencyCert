"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { uploadFiles } from "@/lib/uploadthing"
import { Link } from "@/i18n/routing"

interface PdfTemplate {
  id: string
  name: string
  description: string | null
  file_url: string
  created_at: string
  pdf_template_fields: { count: number }[]
}

export function ClubPdfTemplateList() {
  const t = useTranslations("adminPdfTemplates")
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()

  const [templates, setTemplates] = useState<PdfTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/clubs/${slug}/pdf-templates`)
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setUploading(true)
    setUploadError("")

    const fileInput = document.getElementById("club-pdf-upload") as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setUploadError(t("selectFileFirst"))
      setUploading(false)
      return
    }

    try {
      const result = await uploadFiles("pdfTemplateUpload", { files: [file] })
      const uploaded = result[0]

      const res = await fetch(`/api/clubs/${slug}/pdf-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          file_url: uploaded.url,
          file_key: uploaded.key,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create template")
      }

      const { template } = await res.json()

      const parseRes = await fetch(`/api/admin/pdf-templates/${template.id}/parse`, { method: "POST" })
      if (!parseRes.ok) {
        const data = await parseRes.json()
        console.warn("Field parsing warning:", data.error)
      }

      setUploadOpen(false)
      setNewName("")
      setNewDescription("")
      router.refresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm(t("deleteConfirm"))) return
    setDeleting(templateId)

    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId))
    } catch (err) {
      console.error("Delete error:", err)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>
  }

  return (
    <div>
      <button
        onClick={() => setUploadOpen(true)}
        className="mb-6 rounded-lg bg-bright-sky px-4 py-2 text-white hover:opacity-90"
      >
        {t("uploadNew")}
      </button>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setUploadOpen(false)}>
          <div
            className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t("uploadTitle")}</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("templateName")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("description")}</label>
                <textarea
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("pdfFile")}</label>
                <input id="club-pdf-upload" type="file" accept=".pdf" required className="w-full text-sm" />
              </div>
              {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? t("uploading") : t("upload")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("name")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("fields")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("created")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{template.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {template.pdf_template_fields?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(template.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/pdf-templates/${template.id}`}
                      className="text-xs text-bright-sky hover:underline"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deleting === template.id}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === template.id ? t("deleting") : t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t("noTemplates")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
