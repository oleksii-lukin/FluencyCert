import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon } from "@hugeicons/core-free-icons"

const links = [
  { label: "How it Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Gallery", href: "/gallery" },
  { label: "FAQ", href: "/faq" },
]

const communityLinks = [
  { label: "Speaking Clubs", href: "/clubs" },
  { label: "Blog", href: "/blog" },
  { label: "Forum", href: "/forum" },
  { label: "Contact", href: "/contact" },
]

function FooterLinks({ items }: { items: { label: string; href: string }[] }) {
  return (
    <>
      {items.map((item) => (
        <li key={item.label}>
          <Link href={item.href} className="text-sm text-graphite/50 transition-colors hover:text-bright-sky">{item.label}</Link>
        </li>
      ))}
    </>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-bright-sky/10 bg-gradient-to-b from-white to-bright-sky/[0.03] px-4 py-12 md:py-16" suppressHydrationWarning>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-bright-sky">
                <HugeiconsIcon icon={Certificate02Icon} className="size-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-graphite">
                Fluency<span className="text-bright-sky">Cert</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-graphite/50">
              The platform for speaking club members to showcase their English proficiency certificates and connect with the community.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-graphite">Platform</h4>
            <ul className="space-y-2.5">
              <FooterLinks items={links} />
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-graphite">Community</h4>
            <ul className="space-y-2.5">
              <FooterLinks items={communityLinks} />
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-graphite/40 md:flex-row">
          <p>&copy; {year} FluencyCert. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-bright-sky">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-bright-sky">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
