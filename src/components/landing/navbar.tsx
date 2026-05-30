import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-2xl border border-banana-cream/20 bg-gradient-to-r from-banana-cream/20 via-banana-cream/60 to-banana-cream/10 px-6 py-3 shadow-lg shadow-banana-cream/15 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="FluencyCert" width={50} height={36} className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-tight text-graphite">
            Fluency<span className="text-bright-sky">Cert</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite">How it works</a>
          <a href="#showcase" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite">Showcase</a>
          <a href="#features" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite">Features</a>
          <a href="#testimonials" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite">Testimonials</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden text-sm text-graphite/70 md:inline-flex hover:text-graphite hover:bg-graphite/5">Sign In</Button>
          <Button size="sm" className="bg-bright-sky text-white shadow-sm shadow-bright-sky/30 hover:bg-bright-sky/90">
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  )
}
