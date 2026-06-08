import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Zoom Callback | FluencyCert",
  description: "Connecting your Zoom account",
}

export default function ZoomCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
