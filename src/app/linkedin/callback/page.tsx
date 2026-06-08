import type { Metadata } from "next"
import LinkedInCallbackContent from "./callback-content"

export const metadata: Metadata = {
  title: "LinkedIn Authorization | FluencyCert",
  description: "Connecting your LinkedIn account",
  robots: { index: false },
}

export default function LinkedInCallbackPage() {
  return <LinkedInCallbackContent />
}
