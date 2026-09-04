import { APP_CONFIG } from '../config/appConfig';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
}

/**
 * Dynamically updates document.title, meta tags, Open Graph, Twitter cards, and canonical URL.
 */
export function updateSEOMetadata({ title, description, canonicalPath }: SEOProps) {
  const siteUrl = APP_CONFIG.SITE_URL;
  const pageTitle = title
    ? `${title} — ${APP_CONFIG.name}`
    : `${APP_CONFIG.name} — Private, Local Browser Utilities`;
  const pageDesc = description || APP_CONFIG.heroSubtitle;
  
  let formattedPath = canonicalPath || '/';
  if (!formattedPath.startsWith('/')) {
    formattedPath = '/' + formattedPath;
  }
  const canonicalUrl = `${siteUrl}${formattedPath}`;

  // Update browser document title
  document.title = pageTitle;

  // Helper to update or create <meta> element
  const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // Helper to update or create <link> element
  const setLinkTag = (rel: string, href: string) => {
    let tag = document.querySelector(`link[rel="${rel}"]`);
    if (!tag) {
      tag = document.createElement('link');
      tag.setAttribute('rel', rel);
      document.head.appendChild(tag);
    }
    tag.setAttribute('href', href);
  };

  // Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', pageDesc);

  // Canonical Link and Social Metadata URLs (only if siteUrl is configured)
  if (siteUrl) {
    setLinkTag('canonical', canonicalUrl);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', `${siteUrl}/pwa-512x512.png`);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', `${siteUrl}/pwa-512x512.png`);
  } else {
    // Clean up or omit tags if domain is not configured yet
    document.querySelector('link[rel="canonical"]')?.remove();
    document.querySelector('meta[property="og:url"]')?.remove();
    document.querySelector('meta[property="og:image"]')?.remove();
    document.querySelector('meta[name="twitter:image"]')?.remove();
  }

  // Open Graph Title, Site Name, and Description
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', pageDesc);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', APP_CONFIG.name);

  // Twitter
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', pageDesc);
}
