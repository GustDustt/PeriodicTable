import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SITE_NAME, SITE_URL } from '../../config.js'

// One call per route: title, description, canonical and Open Graph in the
// active language (nb_NO by default).
export default function Seo({ page, path, app = false }) {
  const { t, i18n } = useTranslation()
  const title = `${t(`seo.${page}.title`)} | ${SITE_NAME}`
  const description = t(`seo.${page}.description`)
  const url = SITE_URL + path
  const en = i18n.language === 'en'
  return (
    <Helmet>
      <html lang={en ? 'en' : 'nb'} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={en ? 'en_GB' : 'nb_NO'} />
      <meta property="og:image" content={`${SITE_URL}/icon-512.png`} />
      {app && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: SITE_NAME,
            url: SITE_URL + '/',
            description,
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            inLanguage: en ? 'en' : 'nb',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
          })}
        </script>
      )}
    </Helmet>
  )
}
