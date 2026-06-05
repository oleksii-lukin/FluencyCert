"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import posthog from "posthog-js"

export function PostHogIdentify() {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
      })
    } else {
      posthog.reset()
    }
  }, [isLoaded, isSignedIn, user])

  return null
}
