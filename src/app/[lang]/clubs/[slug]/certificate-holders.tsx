import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import Image from 'next/image'

interface Holder {
  slug: string
  english_level: string | null
  profiles: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

export async function CertificateHolders({
  holders,
  page,
  totalPages,
  slug,
}: {
  holders: Holder[]
  page: number
  totalPages: number
  slug: string
}) {
  const t = await getTranslations('clubs')

  return (
    <div>
      {holders.length === 0 && (
        <p className="text-muted-foreground">{t('noCertificates')}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {holders.map((holder) => (
          <Link
            key={holder.slug}
            href={`/certificate/${holder.slug}`}
            className="flex items-center gap-3 rounded-xl border p-4 hover:shadow-md transition-shadow"
          >
            {holder.profiles.avatar_url ? (
              <Image
                src={holder.profiles.avatar_url}
                alt=""
                width={40}
                height={40}
                className="rounded-full size-10"
              />
            ) : (
              <div className="size-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(holder.profiles.first_name?.[0] ?? '?').toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">
                {[holder.profiles.first_name, holder.profiles.last_name].filter(Boolean).join(' ') || '—'}
              </p>
              {holder.english_level && (
                <p className="text-xs text-muted-foreground">{holder.english_level}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/clubs/${slug}?page=${page - 1}`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/clubs/${slug}?page=${page + 1}`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
