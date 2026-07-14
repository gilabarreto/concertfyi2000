import { Helmet } from 'react-helmet-async';

export function SEOHead({ title, description, image, url }) {
  const siteTitle = 'concertfyi';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'Discover live music, concerts, and setlists. Track your favorite artists and never miss a show.';
  const metaDescription = description || defaultDescription;
  const siteUrl = 'https://concertfyi.com';
  const metaImage = image || `${siteUrl}/og-image.png`;
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="og:title" content={fullTitle} />
      <meta name="og:description" content={metaDescription} />
      <meta name="og:image" content={metaImage} />
      <meta name="og:url" content={metaUrl} />
      <meta name="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <link rel="canonical" href={metaUrl} />
    </Helmet>
  );
}
