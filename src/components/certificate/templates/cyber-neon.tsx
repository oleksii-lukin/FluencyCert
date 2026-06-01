"use client"

import { useTranslations } from 'next-intl'
import type { CertificateTemplateProps } from "../template"
import "./cyber-neon.css"

export const CyberNeonTemplate = {
  id: "cyber-neon",
  name: "cyberNeon",
  component: CyberNeonCertificate,
}

export function CyberNeonCertificate({
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
    <div className="cyber-bg cyber-grid-overlay relative overflow-hidden p-0">
      <div className="flex flex-col p-10 md:p-14">
        <div className="cyber-accent-line mb-8" />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#22C55E]/70 uppercase">
              {t('fluencyCert')}
            </p>
            <h1 className="font-mono mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              {t('certificateOfProficiency')}
            </h1>
          </div>
          <div className="relative flex size-14 items-center justify-center border border-[#22C55E]/40 bg-[#22C55E]/5">
            <span className="cyber-glow-text font-mono text-sm font-bold">FC</span>
          </div>
        </div>

        <div className="cyber-panel mb-8 p-8">
          <div className="flex items-start justify-between">
            <p className="font-mono mb-3 text-xs font-medium text-[#22C55E]/60 uppercase tracking-wider">
              {t('thisIsToCertify')}
            </p>
            <div className="flex gap-1">
              <span className="cyber-corner-bracket cyber-corner-tr" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            {fullName}
          </p>
          <p className="font-mono mt-4 text-xs font-medium text-[#22C55E]/60 uppercase tracking-wider">
            {t('hasDemonstrated')}
          </p>
          <div className="cyber-badge mt-4 inline-flex items-center px-5 py-2">
            <span className="cyber-glow-text font-mono text-sm font-bold uppercase tracking-wider">{englishLevel}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="cyber-panel-strong p-5">
            <p className="font-mono text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('speakingClubs')}</p>
            <p className="mt-1.5 text-2xl font-bold text-white">{speakingClubsCount}</p>
          </div>
          {hoursParticipated != null ? (
            <div className="cyber-panel-strong p-5">
              <p className="font-mono text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('hoursParticipated')}</p>
              <p className="mt-1.5 text-2xl font-bold text-white">{hoursParticipated}</p>
            </div>
          ) : (
            <div className="cyber-panel-strong p-5">
              <p className="font-mono text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('certificateId')}</p>
              <p className="mt-1.5 font-mono text-xs font-medium text-[#22C55E]/60 break-all">{claimId.slice(0, 8)}</p>
            </div>
          )}
        </div>

        {adminFeedback && (
          <div className="cyber-panel mb-8 border-l-[3px] border-l-[#22C55E] p-5">
            <p className="font-mono mb-1 text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('administratorNote')}</p>
            <p className="cyber-glow-text text-sm italic">&ldquo;{adminFeedback}&rdquo;</p>
          </div>
        )}

        <div className="cyber-accent-line mb-8" />

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="font-mono text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('issuedOn')}</p>
            <p className="font-mono mt-0.5 text-sm font-semibold text-white">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-medium text-[#22C55E]/50 uppercase tracking-wider">{t('id')}</p>
            <p className="font-mono mt-0.5 text-xs font-medium text-[#22C55E]/60">{claimId.slice(0, 8)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
