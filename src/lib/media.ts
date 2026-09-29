// External media placeholders (Consent Banner 1, R-9.1 variant B: click-to-load).
// Nothing here is requested from the provider before the visitor clicks.

/**
 * YouTube video IDs for the hero blocks. PLACEHOLDER: not an existing video.
 * Replace a value with the real ID (the part after `v=` in the YouTube URL).
 */
export const heroVideos = {
  home: 'xxxxxxxxxxx',
  events: 'xxxxxxxxxxx',
  about: 'xxxxxxxxxxx',
  contacts: 'xxxxxxxxxxx',
} as const;

export type HeroVideoPage = keyof typeof heroVideos;

/** Privacy-friendly YouTube embed host (R-9.5). */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`;

/** Meeting place in Regensburg (shown as text and as a click-to-load map). */
export const regensburgPlace = {
  street: 'St. Katharinenplatz 5',
  city: '93059 Regensburg',
  mapQuery: 'St. Katharinenplatz 5, 93059 Regensburg',
};

export const googleMapsEmbed = (query: string, lang: 'de' | 'ru') =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=${lang}&output=embed`;
