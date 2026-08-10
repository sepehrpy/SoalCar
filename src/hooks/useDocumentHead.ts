import { useEffect } from 'react';

export interface MetaConfig {
  title: string;
  description?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  canonicalUrl?: string;
}

const DEFAULT_TITLE = 'سوال‌کار | پلتفرم تخصصی پرسش و پاسخ و عیب‌یابی خودرو';
const DEFAULT_DESCRIPTION = 'مشاوره فنی آنلاین خودرو، عیب‌یابی هوشمند هوش مصنوعی و پاسخ‌دهی توسط تعمیرکاران و مکانیک‌های تأییدشده.';

function setMetaTag(nameOrProperty: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${nameOrProperty}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(nameOrProperty, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(url?: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  const href = url || window.location.origin + window.location.pathname;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function updateDocumentHead(config: MetaConfig) {
  const fullTitle = config.title ? `${config.title}` : DEFAULT_TITLE;
  const description = config.description || DEFAULT_DESCRIPTION;

  // Title
  document.title = fullTitle;

  // Standard Meta Tags
  setMetaTag('name', 'description', description);

  // Open Graph / Facebook
  setMetaTag('property', 'og:site_name', 'سوال‌کار');
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', config.ogType || 'website');
  if (config.ogImage) {
    setMetaTag('property', 'og:image', config.ogImage);
  }

  // Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', description);
  if (config.ogImage) {
    setMetaTag('name', 'twitter:image', config.ogImage);
  }

  // Canonical URL
  setCanonicalLink(config.canonicalUrl);
}

export function useDocumentHead(config: MetaConfig) {
  useEffect(() => {
    updateDocumentHead(config);
  }, [config.title, config.description, config.ogType, config.ogImage, config.canonicalUrl]);
}
