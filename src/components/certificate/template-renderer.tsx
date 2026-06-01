"use client"

import type { CertificateTemplateProps } from "./template"
import { GuillocheSecurityCertificate } from "./templates/guilloche-security"
import { ModernGlassCertificate } from "./templates/modern-glass"
import { NeubrutalCertificate } from "./templates/neubrutal"
import { MemphisRetroCertificate } from "./templates/memphis-retro"
import { CyberNeonCertificate } from "./templates/cyber-neon"
import { NaturalGreenCertificate } from "./templates/natural-green"

interface TemplateRendererProps extends CertificateTemplateProps {
  templateId: string
}

const templates: Record<string, React.ComponentType<CertificateTemplateProps>> = {
  "guilloche-security": GuillocheSecurityCertificate,
  "modern-glass": ModernGlassCertificate,
  "neubrutal": NeubrutalCertificate,
  "memphis-retro": MemphisRetroCertificate,
  "cyber-neon": CyberNeonCertificate,
  "natural-green": NaturalGreenCertificate,
}

export function TemplateRenderer({ templateId, ...props }: TemplateRendererProps) {
  const Component = templates[templateId]

  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-8 text-center text-sm text-red-600">
        Unknown certificate template: {templateId}
      </div>
    )
  }

  return <Component {...props} />
}
