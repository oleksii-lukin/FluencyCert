"use client"

import Link from "next/link"
import Image from "next/image"
import { SignUpButton, UserButton, Show } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-2xl border border-banana-cream/20 bg-gradient-to-r from-banana-cream/20 via-banana-cream/60 to-banana-cream/10 px-6 py-3 shadow-lg shadow-banana-cream/15 backdrop-blur-xl dark:border-snow/10 dark:from-graphite dark:via-graphite/95 dark:to-graphite/90 dark:shadow-black/20">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="FluencyCert" width={50} height={36} className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-tight text-graphite dark:text-snow">
            Fluency<span className="text-bright-sky">Cert</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite dark:text-snow/60 dark:hover:text-snow">How it works</a>
          <a href="#showcase" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite dark:text-snow/60 dark:hover:text-snow">Showcase</a>
          <a href="#features" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite dark:text-snow/60 dark:hover:text-snow">Features</a>
          <a href="#testimonials" className="text-sm font-medium text-graphite/70 transition-colors hover:text-graphite dark:text-snow/60 dark:hover:text-snow">Testimonials</a>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-bright-sky text-white shadow-sm shadow-bright-sky/30 hover:bg-bright-sky/90 dark:shadow-bright-sky/20">
                Get Started
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  )
}
