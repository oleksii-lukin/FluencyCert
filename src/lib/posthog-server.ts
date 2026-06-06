import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null
const noopCapture = { capture: () => {} } as unknown as PostHog

export function getPostHogClient() {
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") {
    return noopCapture
  }
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
  return posthogClient
}
