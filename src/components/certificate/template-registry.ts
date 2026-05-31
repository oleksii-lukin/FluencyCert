import type { CertificateTemplate } from "./template"
import { GuillocheSecurityTemplate } from "./templates/guilloche-security"

const templates: Map<string, CertificateTemplate> = new Map()

function register(template: CertificateTemplate) {
  templates.set(template.id, template)
}

register(GuillocheSecurityTemplate)

export function getTemplate(id: string): CertificateTemplate | undefined {
  return templates.get(id)
}

export function listTemplates(): CertificateTemplate[] {
  return Array.from(templates.values())
}
