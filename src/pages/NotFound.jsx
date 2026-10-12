import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="page">
      <Helmet>
        <title>{t('notFound.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="page__title">{t('notFound.title')}</h1>
      <Link to="/" className="btn btn--primary">{t('notFound.back')}</Link>
    </div>
  )
}
