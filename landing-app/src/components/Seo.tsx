import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  schema?: Record<string, unknown>[];
}

const DEFAULTS = {
  title: 'EduPlexo — AI School Management System & School ERP Pakistan',
  description:
    'EduPlexo is the #1 AI-powered school management system and school ERP in Pakistan. Automate attendance, fees, exams, parent communication & more. Start free trial.',
  keywords:
    'school management system, school ERP, school software Pakistan, student management system, school automation software, education ERP, parent portal, teacher portal, attendance management system, fee management system',
  ogImage: 'https://www.eduplexo.com/og-image.jpg',
  ogType: 'website',
  twitterImage: 'https://www.eduplexo.com/og-image.jpg',
};

export function Seo({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noindex,
  schema,
}: SeoProps) {
  useEffect(() => {
    const t = title || DEFAULTS.title;
    const d = description || DEFAULTS.description;
    const k = keywords || DEFAULTS.keywords;
    const c = canonical || 'https://www.eduplexo.com/';
    const ogT = ogTitle || t;
    const ogD = ogDescription || d;
    const ogI = ogImage || DEFAULTS.ogImage;
    const ogTp = ogType || DEFAULTS.ogType;
    const twT = twitterTitle || t;
    const twD = twitterDescription || d;
    const twI = twitterImage || DEFAULTS.twitterImage;

    document.title = t;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setProp = (property: string, content: string) => setMeta(property, content, 'property');

    setMeta('description', d);
    setMeta('keywords', k);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('canonical', c, 'rel');

    setProp('og:type', ogTp);
    setProp('og:url', c);
    setProp('og:title', ogT);
    setProp('og:description', ogD);
    setProp('og:image', ogI);
    setProp('og:site_name', 'EduPlexo');
    setProp('og:locale', 'en_US');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', twT, 'name');
    setMeta('twitter:description', twD, 'name');
    setMeta('twitter:image', twI, 'name');

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = c;

    // Inject additional schema if provided
    if (schema && schema.length > 0) {
      // Remove old dynamic schemas
      document.querySelectorAll('script[data-dynamic-schema]').forEach((el) => el.remove());

      schema.forEach((s) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-dynamic-schema', 'true');
        script.textContent = JSON.stringify(s);
        document.head.appendChild(script);
      });
    }

    return () => {
      // Clean up dynamic schemas on unmount
      document.querySelectorAll('script[data-dynamic-schema]').forEach((el) => el.remove());
    };
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, twitterTitle, twitterDescription, twitterImage, noindex, schema]);

  return null;
}
