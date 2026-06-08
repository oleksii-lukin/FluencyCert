import type { Metadata } from "next"
import ZoomCallbackContent from "./callback-content"

export const metadata: Metadata = {
  title: "Zoom Authorization | FluencyCert",
  description: "Connecting your Zoom account",
  robots: { index: false },
}

export default function ZoomCallbackPage() {
  return <ZoomCallbackContent />
}
