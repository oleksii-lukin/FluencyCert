import type { ReactNode } from "react"

export interface CertificateTemplateProps {
  fullName: string
  englishLevel: string
  speakingClubsCount: number
  hoursParticipated: number | null
  adminFeedback: string | null
  createdAt: string
  claimId: string
}

export interface CertificateTemplate {
  id: string
  name: string
  component: (props: CertificateTemplateProps) => ReactNode
}
