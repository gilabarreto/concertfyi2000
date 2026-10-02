import { useEffect } from "react";

// Updates the <head> tags in place: reuses the ones index.html already ships and creates the
// rest once, so navigating never stacks duplicates. Replaces react-helmet-async, which cost
// 14 kB of the entry chunk for this; React 19 does it natively but its react-dom is 80 kB
// bigger. The data-rh attributes in index.html are Helmet leftovers, harmless.
function setTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key, name, content) =>
  setTag(`meta[${key}="${name}"]`, { tag: "meta", attrs: { [key]: name } }, "content", content);

export function SEOHead({ title, description, image, url }) {
  const siteTitle = "concertfyi";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription =
    "Discover live music, concerts, and setlists. Track your favorite artists and never miss a show.";
  const metaDescription = description || defaultDescription;
  const siteUrl = "https://concertfyi.com";
  const metaImage = image || `${siteUrl}/og-image.png`;
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl;

  useEffect(() => {
    document.title = fullTitle;
    meta("name", "description", metaDescription);
    meta("property", "og:title", fullTitle);
    meta("property", "og:description", metaDescription);
    meta("property", "og:image", metaImage);
    meta("property", "og:url", metaUrl);
    meta("property", "og:type", "website");
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", fullTitle);
    meta("name", "twitter:description", metaDescription);
    meta("name", "twitter:image", metaImage);
    setTag('link[rel="canonical"]', { tag: "link", attrs: { rel: "canonical" } }, "href", metaUrl);
  }, [fullTitle, metaDescription, metaImage, metaUrl]);

  return null;
}
