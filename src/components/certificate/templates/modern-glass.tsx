"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "./modern-glass.css"

export function ModernGlassCertificate({
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
    <div className="modern-glass-bg relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-0 shadow-2xl shadow-bright-sky/5 dark:border-white/5 dark:bg-transparent">
      <div className="relative z-10 flex flex-col p-10 md:p-14">
        <div className="modern-glass-gold-bar mb-8" />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-bright-sky uppercase">
              {t('fluencyCert')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ fontFamily: "var(--font-serif)" }}>
              {t('certificateOfProficiency')}
            </h1>
          </div>
          <div className="modern-glass-seal shrink-0">
            <span className="modern-glass-gold-text text-lg font-bold">FC</span>
          </div>
        </div>

        <div className="modern-glass-panel mb-8 rounded-xl p-8">
          <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('thisIsToCertify')}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {t('hasDemonstrated')}
          </p>
          <div className="modern-glass-gold-pill mt-4 inline-flex items-center rounded-full px-5 py-1.5">
            <span className="modern-glass-gold-text text-sm font-bold">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="modern-glass-panel-strong rounded-xl p-5">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('speakingClubs')}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null ? (
            <div className="modern-glass-panel-strong rounded-xl p-5">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('hoursParticipated')}</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{hoursParticipated}</p>
            </div>
          ) : (
            <div className="modern-glass-panel-strong rounded-xl p-5">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('certificateId')}</p>
              <p className="mt-1.5 font-mono text-xs text-slate-500 break-all dark:text-slate-400">{slug}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="modern-glass-panel mb-8 rounded-xl border-l-4 border-[#CA8A04]/50 p-5">
            <p className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('administratorNote')}</p>
            <p className="modern-glass-gold-text text-sm italic">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="modern-glass-gold-bar mb-8" />

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('issuedOn')}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('certificateId')}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{slug}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
