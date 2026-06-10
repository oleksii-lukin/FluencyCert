"use client"

import { useMemo, useState } from "react"
import { useTranslations } from 'next-intl'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpDownIcon, ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import Image from 'next/image'
import { ClaimActions } from '@/app/[lang]/admin/claims/claim-actions'
import { SlugDisplay } from '@/app/[lang]/admin/claims/slug-display'
import { ContactButton } from '@/components/ui/contact-button'
import type { ColumnDef } from '@tanstack/react-table'

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  telegram_id: string | null
  telegram_username: string | null
  linkedin_url: string | null
}

interface ClaimRow {
  id: string
  user_id: string
  club_id: string | null
  status: string
  slug: string
  created_at: string
  admin_feedback: string | null
  english_level: string | null
  speaking_clubs_count: number | null
  hours_participated: number | null
  background_template: string | null
  pdf_template_id: string | null
  pdf_template_variant_id: string | null
  profiles: Profile
  pdf_templates: { name: string } | null
  pdf_template_variants: { name: string } | null
}

interface ClaimsTableProps {
  claims: ClaimRow[]
  clubMap: Map<string, string>
  isMaster: boolean
  lang: string
}

function StatusBadge({ status, slug, lang, t }: { status: string; slug: string; lang: string; t: (key: string) => string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    rejected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  }

  const labels: Record<string, string> = {
    pending: t('pending'),
    approved: t('approved'),
    rejected: t('rejected'),
  }

  const className = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || ''}`

  if (status === 'approved') {
    return (
      <a
        href={`/${lang}/certificate/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:underline`}
      >
        {labels[status] || status}
      </a>
    )
  }

  return (
    <span className={className}>
      {labels[status] || status}
    </span>
  )
}

export function ClaimsTable({ claims, clubMap, isMaster, lang }: ClaimsTableProps) {
  const t = useTranslations('admin')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'submitted', desc: true },
  ])

  const data = useMemo(() => claims, [claims])

  const columns = useMemo<ColumnDef<ClaimRow>[]>(() => {
    const cols: ColumnDef<ClaimRow>[] = [
      {
        id: 'user',
        header: t('user'),
        accessorFn: (row) => [row.profiles.first_name, row.profiles.last_name].filter(Boolean).join(' '),
        cell: ({ row }) => {
          const p = row.original.profiles
          return (
            <div className="flex items-center gap-3 min-w-[180px]">
              {p.avatar_url ? (
                <Image src={p.avatar_url} alt="" width={32} height={32} className="rounded-full size-8" />
              ) : (
                <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {(p.first_name?.[0] ?? p.email[0]).toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-medium">
                  {[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                </span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <ContactButton type="email" value={p.email} />
                  <ContactButton type="telegram" value={p.telegram_username} />
                  <ContactButton type="linkedin" value={p.linkedin_url} />
                </div>
              </div>
            </div>
          )
        },
      },
    ]

    if (isMaster) {
      cols.push({
        id: 'club',
        header: t('club'),
        accessorFn: (row) => (row.club_id ? clubMap.get(row.club_id) : null),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? '') || '—'}</span>
        ),
      })
    }

    cols.push({
      id: 'status',
      header: t('status'),
      accessorFn: (row) => row.status,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} slug={row.original.slug} lang={lang} t={t} />
      ),
    },
    {
      id: 'slug',
      header: t('slugLabel'),
      accessorFn: (row) => row.slug,
      cell: ({ row }) => <SlugDisplay slug={row.original.slug} claimId={row.original.id} />,
    },
    {
      id: 'submitted',
      header: t('submitted'),
      accessorFn: (row) => row.created_at,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue() as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'templateType',
      header: t('templateType'),
      accessorFn: (row) => (row.pdf_template_id ? 'pdf' : 'react'),
      cell: ({ getValue }) => {
        const type = getValue() as string
        const isPdf = type === 'pdf'
        return (
          <span
            className={
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ' +
              (isPdf
                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800')
            }
          >
            {isPdf ? t('pdf') : t('react')}
          </span>
        )
      },
    },
    {
      id: 'templateUsed',
      header: t('templateUsed'),
      accessorFn: (row) => row.pdf_templates?.name || row.background_template || '',
      cell: ({ row }) => {
        const claim = row.original
        if (claim.pdf_templates?.name) {
          const variant = claim.pdf_template_variants?.name
          return (
            <span className="text-sm">
              {claim.pdf_templates.name}
              {variant && <span className="text-xs text-muted-foreground ml-1">({variant})</span>}
            </span>
          )
        }
        return (
          <span className="text-sm text-muted-foreground">
            {claim.background_template || '—'}
          </span>
        )
      },
    },
    {
      id: 'feedback',
      header: t('feedback'),
      accessorFn: (row) => row.admin_feedback || '',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {(getValue() as string) || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('actions'),
      enableSorting: false,
      cell: ({ row }) => {
        const claim = row.original
        if (claim.status === 'pending') {
          return <ClaimActions claimId={claim.id} />
        }
        if (claim.status === 'approved') {
          return (
            <ClaimActions
              claimId={claim.id}
              mode="update"
              initialData={{
                english_level: claim.english_level,
                speaking_clubs_count: claim.speaking_clubs_count,
                hours_participated: claim.hours_participated,
                background_template: claim.background_template,
                slug: claim.slug,
                admin_feedback: claim.admin_feedback,
                pdf_template_id: claim.pdf_template_id,
                pdf_template_variant_id: claim.pdf_template_variant_id,
                status: claim.status,
              }}
            />
          )
        }
        return <span className="text-xs text-muted-foreground">{t('processed')}</span>
      },
    },
    )

    return cols
  }, [t, isMaster, clubMap, lang])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const colSpan = columns.length

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={
                    'text-left px-4 py-3 text-sm font-medium text-muted-foreground ' +
                    (header.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : '')
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <HugeiconsIcon
                        icon={
                          header.column.getIsSorted() === 'asc'
                            ? ArrowUp01Icon
                            : header.column.getIsSorted() === 'desc'
                              ? ArrowDown01Icon
                              : ArrowUpDownIcon
                        }
                        size={14}
                        className="text-muted-foreground"
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
                {t('noClaimsFound')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
