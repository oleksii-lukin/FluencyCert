"use client"

import { useState } from "react"
import { ZoomConnect } from "./zoom-connect"
import { Button } from "@/components/ui/button"

interface ZoomUserInfo {
  id: string
  email: string
  display_name: string
}

interface ZoomAdminProps {
  initialZoomUserInfo: ZoomUserInfo | null
}

export function ZoomAdmin({ initialZoomUserInfo }: ZoomAdminProps) {
  const [zoomUserInfo, setZoomUserInfo] = useState<ZoomUserInfo | null>(initialZoomUserInfo)
  const [previewData, setPreviewData] = useState<unknown | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const handleZoomConnected = (info: ZoomUserInfo) => {
    setZoomUserInfo(info)
    setPreviewData(null)
    setPreviewError(null)
  }

  const handleZoomDisconnected = () => {
    setZoomUserInfo(null)
    setPreviewData(null)
    setPreviewError(null)
  }

  const handleFetchPreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewData(null)
    try {
      const res = await fetch('/api/zoom/preview')
      const data = await res.json()
      if (res.ok) {
        setPreviewData(data)
      } else {
        setPreviewError(data.error ?? 'Failed to fetch preview')
      }
    } catch {
      setPreviewError('Network error')
    }
    setPreviewLoading(false)
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold text-graphite dark:text-snow mb-4">
        Zoom Integration
      </h2>
      <ZoomConnect
        initialZoomUserInfo={zoomUserInfo}
        onConnected={handleZoomConnected}
        onDisconnected={handleZoomDisconnected}
      />
      {zoomUserInfo && (
        <div className="mt-4">
          <Button
            size="sm"
            onClick={handleFetchPreview}
            disabled={previewLoading}
          >
            {previewLoading ? 'Fetching...' : 'Fetch & Preview Data'}
          </Button>
          {previewError && (
            <p className="mt-2 text-xs text-red-500">{previewError}</p>
          )}
          {previewData !== null && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Raw API response — use this to understand Zoom data shape for schema design:
              </p>
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
