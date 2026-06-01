import type { CertificateTemplate } from "./template"

const templates: CertificateTemplate[] = [
  { id: "guilloche-security", name: "guillocheSecurity" },
  { id: "modern-glass", name: "modernGlass" },
  { id: "neubrutal", name: "neubrutal" },
  { id: "memphis-retro", name: "memphisRetro" },
  { id: "cyber-neon", name: "cyberNeon" },
  { id: "natural-green", name: "naturalGreen" },
]

export function getTemplate(id: string): CertificateTemplate | undefined {
  return templates.find((t) => t.id === id)
}

export function listTemplates(): CertificateTemplate[] {
  return templates
}
