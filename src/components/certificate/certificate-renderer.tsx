import type { CertificateTemplateProps } from "./template"
import { TemplateRenderer } from "./template-renderer"

interface CertificateRendererProps extends CertificateTemplateProps {
  templateId: string
}

export function CertificateRenderer(props: CertificateRendererProps) {
  return <TemplateRenderer {...props} />
}
