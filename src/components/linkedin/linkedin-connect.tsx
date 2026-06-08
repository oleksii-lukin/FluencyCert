"use client"

import { useReducer, useEffect } from "react"
import { useTranslations } from "next-intl"
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

interface ConnectionState {
  connected: boolean
  profileData: LinkedInProfileData | null
  profileUrl: string
}

interface UiState {
  manualUrl: string
  loading: boolean
  error: string | null
}

type ConnectionAction =
  | { type: "CONNECT_SUCCESS"; profileData: LinkedInProfileData | null; linkedinUrl: string }
  | { type: "DISCONNECT_SUCCESS" }

type UiAction =
  | { type: "SET_MANUAL_URL"; value: string }
  | { type: "START_LOADING" }
  | { type: "STOP_LOADING" }
  | { type: "SET_ERROR"; error: string | null }

function initialConnectionState(initialLinkedInUrl: string | null, initialLinkedInProfileData: LinkedInProfileData | null): ConnectionState {
  return {
    connected: !!initialLinkedInUrl,
    profileData: initialLinkedInProfileData,
    profileUrl: initialLinkedInUrl ?? "",
  }
}

const initialUiState: UiState = {
  manualUrl: "",
  loading: false,
  error: null,
}

function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case "CONNECT_SUCCESS":
      return { ...state, connected: true, profileData: action.profileData, profileUrl: action.linkedinUrl }
    case "DISCONNECT_SUCCESS":
      return { ...state, connected: false, profileData: null, profileUrl: "" }
    default:
      return state
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "SET_MANUAL_URL":
      return { ...state, manualUrl: action.value }
    case "START_LOADING":
      return { ...state, loading: true, error: null }
    case "STOP_LOADING":
      return { ...state, loading: false }
    case "SET_ERROR":
      return { ...state, error: action.error }
    default:
      return state
  }
}

const icon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export function LinkedInConnect({ initialLinkedInUrl, initialLinkedInProfileData, oauthEnabled = false }: LinkedInConnectProps) {
  const t = useTranslations("profile")
  const [connection, dispatchConnection] = useReducer(connectionReducer, { initialLinkedInUrl, initialLinkedInProfileData }, (init) =>
    initialConnectionState(init.initialLinkedInUrl, init.initialLinkedInProfileData)
  )
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "linkedin-auth" && event.data?.code) {
        const redirectUri = `${window.location.origin}/linkedin/callback`
        dispatchUi({ type: "START_LOADING" })
        fetch("/api/linkedin/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authorizationCode: event.data.code, redirectUri }),
        }).then(async (res) => {
          const result = await res.json()
          if (res.ok) {
            dispatchConnection({ type: "CONNECT_SUCCESS", profileData: result.profileData ?? null, linkedinUrl: result.linkedinUrl ?? "" })
          } else {
            dispatchUi({ type: "SET_ERROR", error: result.error ?? t("linkedinError") })
          }
        }).catch(() => {
          dispatchUi({ type: "SET_ERROR", error: t("linkedinError") })
        }).finally(() => {
          dispatchUi({ type: "STOP_LOADING" })
        })
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [t])

  const handleConnect = () => {
    dispatchUi({ type: "SET_ERROR", error: null })
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    if (!clientId) {
      dispatchUi({ type: "SET_ERROR", error: t("linkedinNotConfigured") })
      return
    }

    const state = crypto.randomUUID()
    sessionStorage.setItem("linkedin_oauth_state", state)

    const redirectUri = `${window.location.origin}/linkedin/callback`
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent("r_profile_basicinfo")}`

    window.open(authUrl, "LinkedInAuth", "width=600,height=700,left=200,top=100")
  }

  const handleSaveManual = async () => {
    const url = ui.manualUrl.trim()
    if (!url) return

    const validPrefixes = ["https://www.linkedin.com/in/", "https://linkedin.com/in/"]
    if (!validPrefixes.some((p) => url.startsWith(p))) {
      dispatchUi({ type: "SET_ERROR", error: t("linkedinInvalidUrl") })
      return
    }

    dispatchUi({ type: "START_LOADING" })
    try {
      const res = await fetch("/api/linkedin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: url }),
      })
      const result = await res.json()
      if (res.ok) {
        dispatchConnection({ type: "CONNECT_SUCCESS", profileData: null, linkedinUrl: url })
        dispatchUi({ type: "SET_MANUAL_URL", value: "" })
      } else {
        dispatchUi({ type: "SET_ERROR", error: result.error ?? t("linkedinError") })
      }
    } catch {
      dispatchUi({ type: "SET_ERROR", error: t("linkedinError") })
    }
    dispatchUi({ type: "STOP_LOADING" })
  }

  const handleRemove = async () => {
    dispatchUi({ type: "START_LOADING" })
    try {
      const res = await fetch("/api/linkedin/connect", { method: "DELETE" })
      if (res.ok) {
        dispatchConnection({ type: "DISCONNECT_SUCCESS" })
      } else {
        const result = await res.json()
        dispatchUi({ type: "SET_ERROR", error: result.error ?? t("linkedinError") })
      }
    } catch {
      dispatchUi({ type: "SET_ERROR", error: t("linkedinError") })
    }
    dispatchUi({ type: "STOP_LOADING" })
  }

  if (connection.connected) {
    return (
      <div className="rounded-xl border bg-white/50 p-4 dark:bg-graphite/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-graphite dark:text-snow">
                {connection.profileData?.name ?? t("linkedinConnected")}
              </p>
              {connection.profileUrl && (
                <a
                  href={connection.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {connection.profileUrl}
                </a>
              )}
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={ui.loading}
          >
            {t("linkedinRemove")}
          </Button>
        </div>
        {ui.error && <p className="mt-2 text-xs text-red-500">{ui.error}</p>}
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
              {t("connectLinkedin")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("linkedinNotConnected")}
            </p>
          </div>
        </div>
        {oauthEnabled && (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={ui.loading}
          >
            {ui.loading ? t("connecting") : t("linkedinConnectButton")}
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
              {t("linkedinOr")}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="url"
          aria-label="LinkedIn profile URL"
          placeholder={t("linkedinUrlPlaceholder")}
          value={ui.manualUrl}
          onChange={(e) => dispatchUi({ type: "SET_MANUAL_URL", value: e.target.value })}
          className="flex-1 rounded-lg border bg-white/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-graphite/50"
        />
        <Button size="sm" onClick={handleSaveManual} disabled={ui.loading || !ui.manualUrl.trim()}>
          {t("linkedinSave")}
        </Button>
      </div>
      {ui.error && <p className="text-xs text-red-500">{ui.error}</p>}
    </div>
  )
}
