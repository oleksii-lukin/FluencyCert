import { getTranslations } from 'next-intl/server'
import { HeroSectionContent } from "./hero-section-content"

export async function HeroSection() {
  const t = await getTranslations('hero')

  return (
    <HeroSectionContent
      title={t('title')}
      titleHighlight={t('titleHighlight')}
      titleEnd={t('titleEnd')}
      subtitle={t('subtitle')}
      claimButton={t('claimButton')}
      exploreGallery={t('exploreGallery')}
      certificatesIssued={t('certificatesIssued')}
      activeMembers={t('activeMembers')}
      reactionsSent={t('reactionsSent')}
    />
  )
}
