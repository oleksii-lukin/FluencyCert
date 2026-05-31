import type { CertificateTemplate } from "./template"
import { GuillocheSecurityTemplate } from "./templates/guilloche-security"
import { ModernGlassTemplate } from "./templates/modern-glass"
import { NeubrutalTemplate } from "./templates/neubrutal"
import { MemphisRetroTemplate } from "./templates/memphis-retro"
import { CyberNeonTemplate } from "./templates/cyber-neon"
import { NaturalGreenTemplate } from "./templates/natural-green"

const templates: Map<string, CertificateTemplate> = new Map()

function register(template: CertificateTemplate) {
  templates.set(template.id, template)
}

register(GuillocheSecurityTemplate)
register(ModernGlassTemplate)
register(NeubrutalTemplate)
register(MemphisRetroTemplate)
register(CyberNeonTemplate)
register(NaturalGreenTemplate)

export function getTemplate(id: string): CertificateTemplate | undefined {
  return templates.get(id)
}

export function listTemplates(): CertificateTemplate[] {
  return Array.from(templates.values())
}
