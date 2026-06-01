import type { Meta, StoryObj } from "@storybook/react"
import { HeroSectionContent } from "./hero-section-content"
import en from "../../../messages/en.json"

const t = en.hero

const meta: Meta<typeof HeroSectionContent> = {
  title: "Landing/HeroSection",
  component: HeroSectionContent,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: t.title,
    titleHighlight: t.titleHighlight,
    titleEnd: t.titleEnd,
    subtitle: t.subtitle,
    claimButton: t.claimButton,
    exploreGallery: t.exploreGallery,
    certificatesIssued: t.certificatesIssued,
    activeMembers: t.activeMembers,
    reactionsSent: t.reactionsSent,
  },
}

export default meta
type Story = StoryObj<typeof HeroSectionContent>

export const Default: Story = {}
