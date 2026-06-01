export interface CertificateTemplateProps {
  fullName: string
  englishLevel: string
  speakingClubsCount: number
  hoursParticipated: number | null
  adminFeedback: string | null
  createdAt: string
  slug: string
}

export interface CertificateTemplate {
  id: string
  name: string
}
