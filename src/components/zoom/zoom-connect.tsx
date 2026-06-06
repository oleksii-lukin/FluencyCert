"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ZoomUserInfo {
  id: string
  email: string
  display_name: string
}

interface ZoomConnectProps {
  initialZoomUserInfo: ZoomUserInfo | null
  onConnected?: (info: ZoomUserInfo) => void
  onDisconnected?: () => void
}

export function ZoomConnect({ initialZoomUserInfo, onConnected, onDisconnected }: ZoomConnectProps) {
  const [connected, setConnected] = useState(!!initialZoomUserInfo)
  const [userInfo, setUserInfo] = useState<ZoomUserInfo | null>(initialZoomUserInfo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'zoom-auth' && event.data?.code) {
        const redirectUri = `${window.location.origin}/zoom/callback`
        handleAuthorizationCode(event.data.code, redirectUri)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleAuthorizationCode = async (code: string, redirectUri: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/zoom/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode: code, redirectUri }),
      })
      const result = await res.json()
      if (res.ok) {
        setConnected(true)
        const info = result.zoomUserInfo ?? null
        setUserInfo(info)
        if (info && onConnected) onConnected(info)
      } else {
        setError(result.error ?? 'Failed to connect Zoom')
      }
    } catch {
      setError('Failed to connect Zoom')
    }
    setLoading(false)
  }

  const handleConnect = () => {
    setError(null)
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID
    if (!clientId) {
      setError('Zoom client ID not configured')
      return
    }

    const state = crypto.randomUUID()
    sessionStorage.setItem('zoom_oauth_state', state)

    const redirectUri = `${window.location.origin}/zoom/callback`
    const scopes = 'meeting:read:list_meetings meeting:read:list_past_instances meeting:read:list_past_participants user:read:user'
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`
    window.open(authUrl, 'ZoomAuth', 'width=600,height=700,left=200,top=100')
  }

  const handleDisconnect = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/zoom/connect', { method: 'DELETE' })
      if (res.ok) {
        setConnected(false)
        setUserInfo(null)
        if (onDisconnected) onDisconnected()
      } else {
        const result = await res.json()
        setError(result.error ?? 'Failed to disconnect')
      }
    } catch {
      setError('Failed to disconnect')
    }
    setLoading(false)
  }

  const icon = (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-7.5-3.75c-.414 0-.75.336-.75.75v6c0 .414.336.75.75.75h.75c.414 0 .75-.336.75-.75V9c0-.414-.336-.75-.75-.75h-.75zm-4.5 0c-.414 0-.75.336-.75.75v6c0 .414.336.75.75.75h.75c.414 0 .75-.336.75-.75V9c0-.414-.336-.75-.75-.75h-.75zm-4.5 0c-.414 0-.75.336-.75.75v6c0 .414.336.75.75.75h.75c.414 0 .75-.336.75-.75V9c0-.414-.336-.75-.75-.75h-.75z" />
    </svg>
  )

  if (connected) {
    return (
      <div className="rounded-xl border bg-white/50 p-4 dark:bg-graphite/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-graphite dark:text-snow">
                {userInfo?.display_name ?? 'Zoom Connected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {userInfo?.email ?? ''}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
          >
            Disconnect
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white/50 p-4 dark:bg-graphite/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-graphite dark:text-snow">
              Connect Zoom Account
            </p>
            <p className="text-xs text-muted-foreground">
              Connect to fetch meetings and participant data
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
