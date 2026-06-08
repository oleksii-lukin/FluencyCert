import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "LinkedIn Callback | FluencyCert",
  description: "Connecting your LinkedIn account",
}

export default function LinkedInCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
