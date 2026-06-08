"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

function CallbackContent() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Processing...")

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      queueMicrotask(() => setMessage(`Authorization failed: ${error}`))
      if (window.opener) {
        window.opener.postMessage({ type: 'linkedin-auth', error }, window.opener.location.origin)
      }
      return
    }

    if (!code) {
      queueMicrotask(() => setMessage("No authorization code received."))
      return
    }

    const savedState = sessionStorage.getItem('linkedin_oauth_state')
    if (state && savedState && state !== savedState) {
      queueMicrotask(() => setMessage("State mismatch — possible CSRF attack."))
      return
    }
    sessionStorage.removeItem('linkedin_oauth_state')

    const origin = window.opener?.location.origin ?? window.location.origin
    window.opener?.postMessage({ type: 'linkedin-auth', code, state }, origin)
    queueMicrotask(() => setMessage("Connected! You can close this window."))
    const timer = setTimeout(() => window.close(), 1000)
    return () => clearTimeout(timer)
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Processing...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
