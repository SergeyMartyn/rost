// Registry of optional services that need consent (Consent Banner 1, R-15.1).
// Every service listed here must also be described in the Datenschutzerklärung
// (site.config.json → legalText.privacy) and, if it is loaded by the banner,
// must be started ONLY after its category was accepted (R-7.1).
//
// A category exists only if it has at least one real service (R-5.2).
// "necessary" is always present and is not listed here.

export type ConsentCategory = 'analytics' | 'marketing';

export interface ConsentService {
  id: string;
  category: ConsentCategory;
  name: { de: string; ru: string };
  provider: { de: string; ru: string };
  purpose: { de: string; ru: string };
  cookies: { de: string; ru: string };
  usTransfer: { de: string; ru: string };
  policyUrl: string;
}

export const consentConfig = {
  /**
   * Version of the consent configuration (R-10.5). Raise it whenever a service,
   * purpose or provider is added/changed or the texts change materially:
   * everybody is asked again. Keep the history here.
   *   1 — 2026-09: GTM + GA4 (category "analytics").
   */
  revision: 1,
  /** Validity of the choice in days (R-10.4: 6–13 months). */
  expiresAfterDays: 365,
  cookieName: 'cc_cookie',
  /** Google Tag Manager container. Loaded by code only after consent (R-7.8). */
  gtmId: 'GTM-PTPV7JBZ',
} as const;

const google = {
  de: 'Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland',
  ru: 'Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ирландия',
};

export const services: ConsentService[] = [
  {
    id: 'ga4',
    category: 'analytics',
    name: {
      de: 'Google Analytics 4 (über den Google Tag Manager)',
      ru: 'Google Analytics 4 (через Google Tag Manager)',
    },
    provider: google,
    purpose: {
      de: 'Auswertung der Websitenutzung, z. B. welche Seiten aufgerufen werden',
      ru: 'анализ использования сайта, например какие страницы открывают',
    },
    cookies: {
      de: '„_ga“, „_ga_DMY7BHLRLX“ (bis zu 2 Jahre)',
      ru: '«_ga», «_ga_DMY7BHLRLX» (до 2 лет)',
    },
    usTransfer: {
      de: 'ja, Grundlage: EU-US Data Privacy Framework',
      ru: 'да, основание — EU-US Data Privacy Framework',
    },
    policyUrl: 'https://policies.google.com/privacy',
  },
];

export const activeCategories: ConsentCategory[] = [
  ...new Set(services.map((service) => service.category)),
];

/** Cookies deleted when a category is revoked (R-11.2). */
export const cookiesToClear: Record<ConsentCategory, Array<string | RegExp>> = {
  analytics: [/^_ga/],
  marketing: ['_fbp', '_fbc', /^_gcl/],
};
