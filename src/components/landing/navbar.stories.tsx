import type { Meta, StoryObj } from "@storybook/react"
import { Navbar } from "./navbar"

const meta: Meta<typeof Navbar> = {
  title: "Landing/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/en/",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Navbar>

export const Default: Story = {
  args: {
    isAdmin: false,
  },
}

export const Admin: Story = {
  args: {
    isAdmin: true,
  },
}
