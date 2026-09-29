// Consent banner + Google Tag Manager loader.
// Rules: Consent Banner 1 (R-x.y). Reference implementation: Consent Banner 2, part VI.
//
// - Nothing optional is loaded before a choice or after a refusal (R-7.1).
// - Consent Mode: Basic only. `consent default` goes into dataLayer BEFORE the
//   container is loaded (R-7.4, R-7.5). No <noscript> GTM snippet (R-7.3).
// - GTM is loaded by code only if "analytics" (or "marketing") is accepted (R-7.8).
// - Any change of a saved choice: consent update → clear cookies → reload (R-11.4).
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import '../styles/consent.css';
import { buildTranslations } from './consent-texts';
import {
  activeCategories,
  consentConfig,
  cookiesToClear,
  type ConsentCategory,
} from './services';
import { site } from './site';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const hasMarketing = activeCategories.includes('marketing');
let gtmLoaded = false;

window.dataLayer = window.dataLayer || [];
// GTM needs the real `arguments` object for gtag commands.
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function accepted(category: ConsentCategory) {
  return (
    activeCategories.includes(category) &&
    CookieConsent.acceptedCategory(category)
  );
}

function consentState() {
  const stats = accepted('analytics');
  const marketing = hasMarketing && accepted('marketing');
  return {
    stats,
    marketing,
    google: {
      analytics_storage: stats ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    },
  };
}

// Called on every page load with a saved choice and after the first decision.
function startTracking() {
  const { stats, marketing, google } = consentState();
  if (!stats && !marketing) return; // R-7.8: no GTM without consent
  if (!gtmLoaded) {
    gtag('consent', 'default', google); // before the container (R-7.5)
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${consentConfig.gtmId}`;
    document.head.appendChild(script);
    gtmLoaded = true;
  }
  // R-7.9: one event per accepted category; names must match the GTM triggers.
  if (stats)
    window.dataLayer.push({
      event: 'consent_statistics_granted',
      consent_statistics: 'granted',
    });
  if (marketing)
    window.dataLayer.push({
      event: 'consent_marketing_granted',
      consent_marketing: 'granted',
    });
}

// Removes a cookie on the host and on every parent domain (Google sets _ga on
// the registrable domain), so revocation works on www. and apex alike.
function deleteCookieEverywhere(name: string) {
  const host = location.hostname;
  const parts = host.split('.');
  const domains = [undefined, host];
  for (let i = 1; i < parts.length - 1; i++)
    domains.push(parts.slice(i).join('.'));
  for (const domain of [...domains]) if (domain) domains.push('.' + domain);
  for (const domain of domains)
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
}

function clearRevokedCookies() {
  const names = document.cookie
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);
  for (const category of activeCategories) {
    if (accepted(category)) continue;
    for (const pattern of cookiesToClear[category])
      for (const name of names)
        if (typeof pattern === 'string' ? pattern === name : pattern.test(name))
          deleteCookieEverywhere(name);
  }
}

// R-11.4: any change of an already saved choice.
function handleChange() {
  if (gtmLoaded) gtag('consent', 'update', consentState().google);
  clearRevokedCookies();
  window.location.reload();
}

// R-6.7: reserve room under the fixed bar so the footer is never covered.
function watchBarHeight() {
  const root = document.documentElement;
  const bar = document.querySelector<HTMLElement>('#cc-main .cm');
  if (!bar || typeof ResizeObserver === 'undefined') return;
  const update = () =>
    root.style.setProperty('--consent-bar-height', `${bar.offsetHeight}px`);
  update();
  new ResizeObserver(update).observe(bar);
}

export function initConsent() {
  if (!activeCategories.length) return; // R-4.2: no optional services → no banner
  const categories: Record<string, unknown> = {
    necessary: { enabled: true, readOnly: true },
  };
  for (const category of activeCategories)
    categories[category] = {
      autoClear: {
        cookies: cookiesToClear[category].map((name) => ({ name })),
      },
    };

  CookieConsent.run({
    mode: 'opt-in',
    revision: consentConfig.revision,
    hideFromBots: true,
    disablePageInteraction: false, // non-modal bar
    cookie: {
      name: consentConfig.cookieName,
      expiresAfterDays: consentConfig.expiresAfterDays,
      sameSite: 'Lax',
    },
    guiOptions: {
      consentModal: {
        layout: 'bar',
        position: 'bottom',
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: 'box',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: categories as never,
    onConsent: startTracking,
    onChange: handleChange,
    onModalShow: ({ modalName }) => {
      if (modalName === 'consentModal') watchBarHeight();
    },
    onModalHide: ({ modalName }) => {
      if (modalName === 'consentModal')
        document.documentElement.style.removeProperty('--consent-bar-height');
    },
    language: {
      default: site.defaultLanguage,
      autoDetect: 'document', // <html lang>, R-12.8
      translations: buildTranslations() as never,
    },
  });
}
