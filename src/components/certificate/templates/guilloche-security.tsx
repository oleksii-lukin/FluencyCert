"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "../guilloche-pattern.css"

export const GuillocheSecurityTemplate = {
  id: "guilloche-security",
  name: "guillocheSecurity",
  component: GuillocheSecurityCertificate,
}

export function GuillocheSecurityCertificate({
  fullName,
  englishLevel,
  speakingClubsCount,
  hoursParticipated,
  adminFeedback,
  createdAt,
  slug,
}: CertificateTemplateProps) {
  const t = useTranslations('certificateLabels')

  return (
    <div className="guilloche-bg relative overflow-hidden rounded-xl border-2 border-gray-300 bg-white p-0 shadow-2xl dark:border-gray-600 dark:bg-gray-900">
      <div className="relative z-10 flex flex-col p-10 md:p-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-bright-sky uppercase">
              {t('fluencyCert')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-graphite dark:text-snow md:text-3xl">
              {t('certificateOfProficiency')}
            </h1>
          </div>
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-bright-sky/30 bg-bright-sky/5">
            <span className="text-2xl font-bold text-bright-sky">FC</span>
          </div>
        </div>

        <div className="mb-8 border-t border-b border-gray-200 py-6 dark:border-gray-700">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('thisIsToCertify')}
          </p>
          <p className="text-3xl font-bold text-graphite dark:text-snow md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t('hasDemonstrated')}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-bright-sky/30 bg-bright-sky/10 px-4 py-1.5">
            <span className="text-sm font-bold text-bright-sky">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-muted-foreground">{t('speakingClubs')}</p>
            <p className="mt-1 text-2xl font-bold text-graphite dark:text-snow">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null && (
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-muted-foreground">{t('hoursParticipated')}</p>
              <p className="mt-1 text-2xl font-bold text-graphite dark:text-snow">{hoursParticipated}</p>
            </div>
          )}
          {hoursParticipated == null && (
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-muted-foreground">{t('certificateId')}</p>
              <p className="mt-1 text-xs font-mono text-muted-foreground break-all">{slug}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="mb-8 rounded-lg border-l-4 border-bright-sky bg-bright-sky/5 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('administratorNote')}</p>
            <p className="text-sm italic text-graphite dark:text-snow">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
          <div>
            <p className="text-xs text-muted-foreground">{t('issuedOn')}</p>
            <p className="text-sm font-medium text-graphite dark:text-snow">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('certificateId')}</p>
            <p className="text-xs font-mono text-muted-foreground">{slug}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
