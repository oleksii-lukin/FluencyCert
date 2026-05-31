import type { Meta, StoryObj } from "@storybook/react"
import { ThemeToggle } from "./theme-toggle"

const meta: Meta<typeof ThemeToggle> = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
}

export default meta
type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = {}

export const InDarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
}
