import Link from 'next/link'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 p-6 flex flex-col gap-6">
      <Link href="/admin" className="text-lg font-bold">
        Admin Panel
      </Link>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
