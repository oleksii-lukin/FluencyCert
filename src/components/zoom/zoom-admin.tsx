"use client"

import { useState } from "react"
import { ZoomConnect } from "./zoom-connect"
import { Button } from "@/components/ui/button"

interface ZoomUserInfo {
  id: string
  email: string
  display_name: string
  type?: number
}

const ZOOM_FREE_TIER_LIMITATIONS = [
  'Participant attendance data (names, emails, join/leave times) is only available on Zoom Pro or higher plans.',
  'Instant meetings (ad-hoc, type 1) cannot be discovered via the API for any plan tier.',
]

function ZoomPremiumWarning() {
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
        Free Zoom Account Detected
      </p>
      <ul className="mt-1.5 list-inside list-disc space-y-1">
        {ZOOM_FREE_TIER_LIMITATIONS.map((msg) => (
          <li key={msg} className="text-xs text-amber-700 dark:text-amber-400">
            {msg}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
        Upgrade your Zoom account to a paid plan (Pro or higher) and reconnect to access participant data.
      </p>
    </div>
  )
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
        if (data.zoomUserInfo) {
          setZoomUserInfo(data.zoomUserInfo)
        }
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
      {!zoomUserInfo && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Participant attendance data (names, emails, join/leave times) is only available on Zoom Pro or higher plans.
            You will be able to verify your account tier after connecting.
          </p>
        </div>
      )}
      {zoomUserInfo && (
        <div className="mt-4">
          {zoomUserInfo.type === 1 && <ZoomPremiumWarning />}
          <div className={zoomUserInfo.type === 1 ? 'mt-4' : undefined}>
            <Button
              size="sm"
              onClick={handleFetchPreview}
              disabled={previewLoading}
            >
              {previewLoading ? 'Fetching...' : 'Fetch & Preview Data'}
            </Button>
          </div>
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
