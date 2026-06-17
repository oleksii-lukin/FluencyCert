'use client'

import dynamic from 'next/dynamic'
import type { FieldMapping } from './pdf-certificate-renderer'

const Renderer = dynamic(
  () => import('@/components/certificate/pdf-certificate-renderer').then((m) => ({ default: m.PdfCertificateRenderer })),
  { ssr: false },
)

interface LazyPdfCertificateRendererProps {
  templateFileUrl: string
  fields: FieldMapping[]
  certificateData: {
    fullName: string
    englishLevel: string
    speakingClubsCount: number
    hoursParticipated: number | null
    adminFeedback: string | null
    createdAt: string
    slug: string
  }
  customValues: Record<string, string>
  certificateUrl: string
  viewerLocale?: string
}

export function LazyPdfCertificateRenderer(props: LazyPdfCertificateRendererProps) {
  return <Renderer {...props} />
}
