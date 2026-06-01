"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "./natural-green.css"

export const NaturalGreenTemplate = {
  id: "natural-green",
  name: "naturalGreen",
  component: NaturalGreenCertificate,
}

export function NaturalGreenCertificate({
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
    <div className="natural-bg relative overflow-hidden p-0">
      <div className="natural-leaf absolute right-6 top-6" />
      <div className="natural-leaf absolute bottom-8 left-8" style={{ width: 20, height: 20 }} />
      <div className="natural-dot absolute right-12 top-20" />
      <div className="natural-dot absolute left-10 bottom-16" />

      <div className="flex flex-col p-10 md:p-14">
        <div className="natural-accent-line mb-8" />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase">
              {t('fluencyCert')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100 md:text-3xl" style={{ fontFamily: "var(--font-serif)" }}>
              {t('certificateOfProficiency')}
            </h1>
          </div>
          <div className="natural-badge flex size-14 items-center justify-center">
            <span className="text-sm font-bold text-white">FC</span>
          </div>
        </div>

        <div className="natural-panel mb-8 p-8">
          <p className="mb-3 text-sm font-medium text-emerald-700/60 dark:text-emerald-300/60">
            {t('thisIsToCertify')}
          </p>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="mt-4 text-sm font-medium text-emerald-700/60 dark:text-emerald-300/60">
            {t('hasDemonstrated')}
          </p>
          <div className="natural-badge mt-4 inline-flex items-center px-5 py-2">
            <span className="text-sm font-bold">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="natural-panel-strong p-5">
            <p className="text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('speakingClubs')}</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null ? (
            <div className="natural-panel-strong p-5">
              <p className="text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('hoursParticipated')}</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{hoursParticipated}</p>
            </div>
          ) : (
            <div className="natural-panel-strong p-5">
              <p className="text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('certificateId')}</p>
              <p className="mt-1.5 font-mono text-xs font-medium text-emerald-700/60 break-all dark:text-emerald-300/60">{slug}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="natural-panel mb-8 border-l-[4px] border-l-[#FBBF24] p-5">
            <p className="mb-1 text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('administratorNote')}</p>
            <p className="natural-gold-text text-sm italic">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="natural-accent-line mb-8" />

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('issuedOn')}</p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-emerald-600/50 dark:text-emerald-300/50 uppercase tracking-wider">{t('id')}</p>
            <p className="mt-0.5 font-mono text-xs font-medium text-emerald-700/60 dark:text-emerald-300/60">{slug}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
