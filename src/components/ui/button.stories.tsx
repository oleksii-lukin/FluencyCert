import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Clock01Icon } from "@hugeicons/core-free-icons"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const IconSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="icon-xs"><HugeiconsIcon icon={Clock01Icon} /></Button>
      <Button size="icon-sm"><HugeiconsIcon icon={Clock01Icon} /></Button>
      <Button size="icon"><HugeiconsIcon icon={Clock01Icon} /></Button>
      <Button size="icon-lg"><HugeiconsIcon icon={Clock01Icon} /></Button>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button>
        Continue
        <HugeiconsIcon icon={ArrowRight02Icon} className="ml-1.5 size-4" />
      </Button>
      <Button variant="outline">
        <HugeiconsIcon icon={Clock01Icon} className="mr-1.5 size-4" />
        Pending
      </Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
}
