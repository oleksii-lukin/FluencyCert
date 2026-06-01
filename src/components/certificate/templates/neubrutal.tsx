"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "./neubrutal.css"

export const NeubrutalTemplate = {
  id: "neubrutal",
  name: "neubrutal",
  component: NeubrutalCertificate,
}

export function NeubrutalCertificate({
  fullName,
  englishLevel,
  speakingClubsCount,
  hoursParticipated,
  adminFeedback,
  createdAt,
  claimId,
}: CertificateTemplateProps) {
  const t = useTranslations('certificateLabels')

  return (
    <div className="neubrutal-card overflow-hidden p-0">
      <div className="flex flex-col p-10 md:p-14">
        <div className="neubrutal-accent-bar mb-8" />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.15em] text-graphite dark:text-white uppercase">
              {t('fluencyCert')}
            </p>
            <h1 className="font-mono mt-1 text-2xl font-black tracking-tight uppercase md:text-3xl">
              {t('certificateOfProficiency')}
            </h1>
          </div>
          <div className="flex size-14 items-center justify-center border-2 border-black bg-white dark:border-white dark:bg-black">
            <span className="font-mono text-base font-black text-black dark:text-white">FC</span>
          </div>
        </div>

        <div className="neubrutal-panel mb-8 p-8">
          <p className="font-mono mb-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('thisIsToCertify')}
          </p>
          <p className="text-3xl font-bold text-black dark:text-white md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="font-mono mt-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('hasDemonstrated')}
          </p>
          <div className="neubrutal-badge mt-4 inline-flex items-center px-5 py-2">
            <span className="font-mono text-sm font-black uppercase tracking-wider">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="neubrutal-stat p-5">
            <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('speakingClubs')}</p>
            <p className="mt-1.5 text-2xl font-black text-black dark:text-white">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null ? (
            <div className="neubrutal-stat p-5">
              <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('hoursParticipated')}</p>
              <p className="mt-1.5 text-2xl font-black text-black dark:text-white">{hoursParticipated}</p>
            </div>
          ) : (
            <div className="neubrutal-stat p-5">
              <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('certificateId')}</p>
              <p className="mt-1.5 font-mono text-xs font-bold text-neutral-500 break-all dark:text-neutral-400">{claimId.slice(0, 8)}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="neubrutal-panel mb-8 border-l-[6px] border-l-[#FF5252] p-5">
            <p className="font-mono mb-1 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('administratorNote')}</p>
            <p className="text-sm font-bold italic text-[#FF5252]">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="neubrutal-bottom-bar mb-8" />

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('issuedOn')}</p>
            <p className="font-mono mt-0.5 text-sm font-bold text-black dark:text-white">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('id')}</p>
            <p className="font-mono mt-0.5 text-xs font-bold text-neutral-500 dark:text-neutral-400">{claimId.slice(0, 8)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
