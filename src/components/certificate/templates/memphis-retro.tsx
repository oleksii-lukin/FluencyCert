"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "./memphis-retro.css"

export function MemphisRetroCertificate({
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
    <div className="memphis-bg relative overflow-hidden p-0">
      <div className="memphis-zigzag" />

      <div className="relative p-10 md:p-14">
        <div className="memphis-circle absolute right-8 top-8" />
        <div className="memphis-triangle absolute bottom-20 left-6 opacity-40" />
        <div className="memphis-dot absolute right-16 bottom-32" />
        <div className="memphis-dot absolute left-12 top-40" style={{ width: 6, height: 6 }} />

        <div className="memphis-panel-pink mb-8 p-6">
          <p className="text-xs font-bold tracking-[0.2em] text-[#86CCCA] dark:text-[#5DA8A6] uppercase">
            {t('fluencyCert')}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {t('certificateOfProficiency')}
          </h1>
        </div>

        <div className="memphis-panel-yellow mb-8 p-8">
          <p className="mb-3 text-xs font-bold text-[#6A7BB4] dark:text-[#4E5A8C] uppercase tracking-wider">
            {t('thisIsToCertify')}
          </p>
          <p className="text-3xl font-bold text-black dark:text-white md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="mt-4 text-xs font-bold text-[#6A7BB4] dark:text-[#4E5A8C] uppercase tracking-wider">
            {t('hasDemonstrated')}
          </p>
          <div className="memphis-pill mt-4 inline-flex items-center px-5 py-2">
            <span className="text-sm font-black uppercase tracking-wider">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="memphis-panel-pink p-5">
            <p className="text-xs font-bold text-[#FF71CE] dark:text-[#E055A0] uppercase tracking-wider">{t('speakingClubs')}</p>
            <p className="mt-1.5 text-2xl font-black text-black dark:text-white">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null ? (
            <div className="memphis-panel-teal p-5">
              <p className="text-xs font-bold text-[#86CCCA] dark:text-[#5DA8A6] uppercase tracking-wider">{t('hoursParticipated')}</p>
              <p className="mt-1.5 text-2xl font-black text-black dark:text-white">{hoursParticipated}</p>
            </div>
          ) : (
            <div className="memphis-panel-teal p-5">
              <p className="text-xs font-bold text-[#86CCCA] dark:text-[#5DA8A6] uppercase tracking-wider">{t('certificateId')}</p>
              <p className="mt-1.5 font-mono text-xs font-bold text-black break-all dark:text-white">{slug}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="memphis-panel-teal mb-8 border-l-[6px] border-l-[#FF71CE] p-5">
            <p className="mb-1 text-xs font-bold text-[#86CCCA] dark:text-[#5DA8A6] uppercase tracking-wider">{t('administratorNote')}</p>
            <p className="text-sm font-bold italic text-black dark:text-white">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs font-bold text-[#6A7BB4] dark:text-[#4E5A8C] uppercase tracking-wider">{t('issuedOn')}</p>
            <p className="mt-0.5 text-sm font-bold text-black dark:text-white">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#6A7BB4] dark:text-[#4E5A8C] uppercase tracking-wider">{t('id')}</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-black dark:text-white">{slug}</p>
          </div>
        </div>
      </div>

      <div className="memphis-zigzag" />
    </div>
  )
}
