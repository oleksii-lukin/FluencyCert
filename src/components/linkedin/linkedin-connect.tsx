"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"

interface LinkedInProfileData {
  name?: string
  email?: string
  picture?: string
  profileUrl?: string
}

interface LinkedInConnectProps {
  initialLinkedInUrl: string | null
  initialLinkedInProfileData: LinkedInProfileData | null
  oauthEnabled?: boolean
}

export function LinkedInConnect({ initialLinkedInUrl, initialLinkedInProfileData, oauthEnabled = false }: LinkedInConnectProps) {
  const t = useTranslations('profile')
  const [connected, setConnected] = useState(!!initialLinkedInUrl)
  const [profileData, setProfileData] = useState<LinkedInProfileData | null>(initialLinkedInProfileData)
  const [profileUrl, setProfileUrl] = useState(initialLinkedInUrl ?? '')
  const [manualUrl, setManualUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'linkedin-auth' && event.data?.code) {
        const redirectUri = `${window.location.origin}/linkedin/callback`
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
      const res = await fetch('/api/linkedin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode: code, redirectUri }),
      })
      const result = await res.json()
      if (res.ok) {
        setConnected(true)
        setProfileData(result.profileData ?? null)
        setProfileUrl(result.linkedinUrl ?? '')
      } else {
        setError(result.error ?? t('linkedinError'))
      }
    } catch {
      setError(t('linkedinError'))
    }
    setLoading(false)
  }

  const handleConnect = () => {
    setError(null)
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    if (!clientId) {
      setError(t('linkedinNotConfigured'))
      return
    }

    const state = crypto.randomUUID()
    sessionStorage.setItem('linkedin_oauth_state', state)

    const redirectUri = `${window.location.origin}/linkedin/callback`
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent('r_profile_basicinfo')}`

    window.open(authUrl, 'LinkedInAuth', 'width=600,height=700,left=200,top=100')
  }

  const handleSaveManual = async () => {
    const url = manualUrl.trim()
    if (!url) return

    const validPrefixes = ['https://www.linkedin.com/in/', 'https://linkedin.com/in/']
    if (!validPrefixes.some(p => url.startsWith(p))) {
      setError(t('linkedinInvalidUrl'))
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/linkedin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: url }),
      })
      const result = await res.json()
      if (res.ok) {
        setConnected(true)
        setProfileUrl(url)
        setManualUrl('')
      } else {
        setError(result.error ?? t('linkedinError'))
      }
    } catch {
      setError(t('linkedinError'))
    }
    setLoading(false)
  }

  const handleRemove = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/linkedin/connect', { method: 'DELETE' })
      if (res.ok) {
        setConnected(false)
        setProfileData(null)
        setProfileUrl('')
      } else {
        const result = await res.json()
        setError(result.error ?? t('linkedinError'))
      }
    } catch {
      setError(t('linkedinError'))
    }
    setLoading(false)
  }

  const icon = (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
                {profileData?.name ?? t('linkedinConnected')}
              </p>
              {profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {profileUrl}
                </a>
              )}
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={loading}
          >
            {t('linkedinRemove')}
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white/50 p-4 dark:bg-graphite/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-graphite dark:text-snow">
              {t('connectLinkedin')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('linkedinNotConnected')}
            </p>
          </div>
        </div>
        {oauthEnabled && (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? t('connecting') : t('linkedinConnectButton')}
          </Button>
        )}
      </div>
      {oauthEnabled && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/50 dark:bg-graphite/50 px-2 text-muted-foreground">
              {t('linkedinOr')}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder={t('linkedinUrlPlaceholder')}
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          className="flex-1 rounded-lg border bg-white/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-graphite/50"
        />
        <Button size="sm" onClick={handleSaveManual} disabled={loading || !manualUrl.trim()}>
          {t('linkedinSave')}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
