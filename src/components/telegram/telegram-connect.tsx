"use client"

import { useEffect, useRef, useReducer } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (opts: {
          client_id: number
          request_access?: string[]
          lang?: string
        }, cb: (data: { id_token?: string; error?: string; user?: TelegramUser }) => void) => void
      }
    }
  }
}

interface TelegramUser {
  id: number
  name?: string
  preferred_username?: string
  picture?: string
}

interface TelegramConnectProps {
  initialTelegramId: string | null
  initialTelegramUsername: string | null
}

interface State {
  connected: boolean
  username: string
  loading: boolean
  error: string | null
}

type Action =
  | { type: "CONNECT_SUCCESS"; telegram_username: string }
  | { type: "DISCONNECT_SUCCESS" }
  | { type: "START_LOADING" }
  | { type: "STOP_LOADING" }
  | { type: "SET_ERROR"; error: string | null }

function createInitialState(telegramId: string | null, telegramUsername: string | null): State {
  return {
    connected: !!telegramId,
    username: telegramUsername ?? "",
    loading: false,
    error: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CONNECT_SUCCESS":
      return { ...state, connected: true, username: action.telegram_username, loading: false }
    case "DISCONNECT_SUCCESS":
      return { ...state, connected: false, username: "", loading: false }
    case "START_LOADING":
      return { ...state, loading: true, error: null }
    case "STOP_LOADING":
      return { ...state, loading: false }
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false }
    default:
      return state
  }
}

export function TelegramConnect({ initialTelegramId, initialTelegramUsername }: TelegramConnectProps) {
  const t = useTranslations("profile")
  const [state, dispatch] = useReducer(reducer, { initialTelegramId, initialTelegramUsername }, (init) =>
    createInitialState(init.initialTelegramId, init.initialTelegramUsername)
  )
  const sdkReadyRef = useRef(false)

  useEffect(() => {
    if (window.Telegram?.Login) {
      sdkReadyRef.current = true
      return
    }

    const script = document.createElement("script")
    script.src = "https://oauth.telegram.org/js/telegram-login.js"
    script.async = true
    script.onload = () => { sdkReadyRef.current = true }
    script.onerror = () => dispatch({ type: "SET_ERROR", error: "Failed to load Telegram SDK" })
    document.head.appendChild(script)
  }, [])

  const handleConnect = () => {
    dispatch({ type: "SET_ERROR", error: null })
    const clientId = Number(process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID)
    if (!clientId) {
      dispatch({ type: "SET_ERROR", error: "Telegram client ID not configured" })
      return
    }

    if (!window.Telegram?.Login) {
      dispatch({ type: "SET_ERROR", error: "Telegram SDK not loaded yet" })
      return
    }

    window.Telegram.Login.auth(
      {
        client_id: clientId,
        request_access: ["profile", "write"],
      },
      async (data) => {
        if (data.id_token) {
          dispatch({ type: "START_LOADING" })
          try {
            const res = await fetch("/api/telegram/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: data.id_token }),
            })
            const result = await res.json()
            if (res.ok) {
              dispatch({ type: "CONNECT_SUCCESS", telegram_username: result.telegram_username ?? "" })
            } else {
              dispatch({ type: "SET_ERROR", error: result.error ?? t("error") })
            }
          } catch {
            dispatch({ type: "SET_ERROR", error: t("error") })
          }
        } else if (data.error) {
          dispatch({ type: "SET_ERROR", error: data.error })
        }
      },
    )
  }

  const handleDisconnect = async () => {
    dispatch({ type: "START_LOADING" })
    try {
      const res = await fetch("/api/telegram/connect", { method: "DELETE" })
      if (res.ok) {
        dispatch({ type: "DISCONNECT_SUCCESS" })
      } else {
        const result = await res.json()
        dispatch({ type: "SET_ERROR", error: result.error ?? t("error") })
      }
    } catch {
      dispatch({ type: "SET_ERROR", error: t("error") })
    }
  }

  if (state.connected) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-white/50 p-4 dark:bg-graphite/50">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
            <svg viewBox="0 0 24 24" className="size-5 text-sky-600 dark:text-sky-400" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248c-.18 1.158-.96 6.593-1.356 8.75-.166 1.004-.488 1.342-.803 1.374-.684.07-1.203-.453-1.866-.888-1.09-.714-1.705-1.159-2.764-1.856-1.222-.805-.43-1.247.268-1.97.183-.19 3.36-3.083 3.422-3.345.007-.033.014-.158-.06-.224-.073-.066-.182-.043-.26-.026-.112.026-1.892 1.203-5.34 3.535-.505.347-.963.516-1.373.507-.452-.01-1.323-.256-1.97-.467-.793-.259-1.424-.396-1.369-.837.028-.23.345-.466.95-.707 3.744-1.632 6.243-2.708 7.496-3.229 3.57-1.49 4.312-1.748 4.796-1.756.107-.002.346.025.5.15.13.107.166.25.183.354.017.104.038.342.02.528z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-graphite dark:text-snow">
              {t("telegramConnected", { username: state.username })}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisconnect}
          disabled={state.loading}
        >
          {t("disconnectTelegram")}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white/50 p-4 dark:bg-graphite/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <svg viewBox="0 0 24 24" className="size-5 text-muted-foreground" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248c-.18 1.158-.96 6.593-1.356 8.75-.166 1.004-.488 1.342-.803 1.374-.684.07-1.203-.453-1.866-.888-1.09-.714-1.705-1.159-2.764-1.856-1.222-.805-.43-1.247.268-1.97.183-.19 3.36-3.083 3.422-3.345.007-.033.014-.158-.06-.224-.073-.066-.182-.043-.26-.026-.112.026-1.892 1.203-5.34 3.535-.505.347-.963.516-1.373.507-.452-.01-1.323-.256-1.97-.467-.793-.259-1.424-.396-1.369-.837.028-.23.345-.466.95-.707 3.744-1.632 6.243-2.708 7.496-3.229 3.57-1.49 4.312-1.748 4.796-1.756.107-.002.346.025.5.15.13.107.166.25.183.354.017.104.038.342.02.528z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-graphite dark:text-snow">
              {t("connectTelegram")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("telegramNotConnected")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={state.loading}
        >
          {state.loading ? t("connecting") : t("connectTelegram")}
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-red-500">{state.error}</p>
      )}
    </div>
  )
}
