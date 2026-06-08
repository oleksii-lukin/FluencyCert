"use client"

import { useReducer } from "react"
import { useRouter } from "next/navigation"

interface State {
  editing: boolean
  value: string
  displaySlug: string
  saving: boolean
  error: string
}

type Action =
  | { type: "START_EDITING" }
  | { type: "SET_VALUE"; value: string }
  | { type: "START_SAVING" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "CANCEL"; displaySlug: string }

function createInitialState(slug: string): State {
  return { editing: false, value: slug, displaySlug: slug, saving: false, error: "" }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_EDITING":
      return { ...state, editing: true }
    case "SET_VALUE":
      return { ...state, value: action.value }
    case "START_SAVING":
      return { ...state, saving: true, error: "" }
    case "SAVE_SUCCESS":
      return { ...state, editing: false, saving: false, displaySlug: state.value }
    case "SAVE_ERROR":
      return { ...state, saving: false, error: action.error }
    case "CANCEL":
      return { ...state, editing: false, value: action.displaySlug, error: "" }
    default:
      return state
  }
}

export function SlugDisplay({ slug: initialSlug, claimId }: { slug: string; claimId: string }) {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, initialSlug, createInitialState)

  async function handleSave() {
    dispatch({ type: "START_SAVING" })

    const res = await fetch(`/api/admin/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: state.value }),
    })

    if (!res.ok) {
      const data = await res.json()
      dispatch({ type: "SAVE_ERROR", error: data.error || "Failed to update slug" })
      return
    }

    dispatch({ type: "SAVE_SUCCESS" })
    router.refresh()
  }

  if (!state.editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <code className="text-xs font-mono font-medium">{state.displaySlug}</code>
        <button
          type="button"
          onClick={() => dispatch({ type: "START_EDITING" })}
          className="text-muted-foreground hover:text-bright-sky transition-colors"
          title="Edit slug"
        >
          ✎
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="text"
        aria-label="Slug"
        className="w-28 rounded border px-1.5 py-0.5 text-xs font-mono uppercase"
        value={state.value}
        onChange={(e) => dispatch({ type: "SET_VALUE", value: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
        maxLength={20}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={state.saving || !state.value.trim()}
        className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
      >
        {state.saving ? "..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "CANCEL", displaySlug: state.displaySlug })}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
    </span>
  )
}
