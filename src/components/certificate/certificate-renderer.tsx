import { getTemplate } from "./template-registry"
import type { CertificateTemplateProps } from "./template"

interface CertificateRendererProps extends CertificateTemplateProps {
  templateId: string
}

export function CertificateRenderer({
  templateId,
  ...props
}: CertificateRendererProps) {
  const template = getTemplate(templateId)

  if (!template) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-8 text-center text-sm text-red-600">
        Unknown certificate template: {templateId}
      </div>
    )
  }

  const Component = template.component
  return <Component {...props} />
}
