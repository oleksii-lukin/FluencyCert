import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

export async function ShowcaseSection() {
  const t = await getTranslations('showcase')
  const styles = t.raw('styles') as string[]

  return (
    <section id="showcase" className="bg-gradient-to-b from-bright-sky/15 via-bright-sky/5 to-white px-4 py-20 md:py-28 dark:from-bright-sky/8 dark:via-graphite/90 dark:to-graphite">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex justify-center">
            <Image
              src="/collage-vertical.webp"
              alt=""
              width={2344}
              height={2628}
              className="w-full max-w-md h-auto"
              priority
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-graphite dark:text-snow">
              {t('chooseStyle')}
            </h3>
            <p className="mt-3 text-graphite/60 dark:text-snow/60">
              {t('styleDescription')}
            </p>
            <ul className="mt-6 space-y-3">
              {styles.map((style: string) => (
                <li key={style} className="flex items-center gap-3 text-graphite dark:text-snow">
                  <span className="size-2 shrink-0 rounded-full bg-bright-sky" />
                  <span>{style}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <Image
            src="/collage-horizontal.webp"
            alt=""
            width={2905}
            height={944}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
}
