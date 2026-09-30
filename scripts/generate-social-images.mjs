import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const publicDir = join(process.cwd(), 'public');
const outputDir = join(publicDir, 'images', 'social');
const asDataUrl = async (path, mime) =>
  `data:${mime};base64,${(await readFile(join(publicDir, path))).toString('base64')}`;

const [logo, homePhoto, eventsPhoto, ...portraits] = await Promise.all([
  asDataUrl('brand-tree.png', 'image/png'),
  asDataUrl('images/video/events.webp', 'image/webp'),
  asDataUrl('images/video/znakomstvo.png', 'image/png'),
  ...['kristina', 'timur-portrait', 'maksim', 'margo', 'sergey'].map((person) =>
    asDataUrl(`images/team/${person}.webp`, 'image/webp'),
  ),
]);
const [onest, onestBold, marmelad] = await Promise.all([
  asDataUrl('fonts/Onest-Regular.woff2', 'font/woff2'),
  asDataUrl('fonts/Onest-Bold.woff2', 'font/woff2'),
  asDataUrl('fonts/Marmelad-Regular.woff2', 'font/woff2'),
]);

const cards = {
  home: {
    ru: {
      label: 'ГЛАВНАЯ',
      title: ['Знакомимся', 'и растём вместе'],
      description: 'Сообщество людей, с которыми интересно встречаться снова.',
      brand: 'РУССКОЯЗЫЧНОЕ СООБЩЕСТВО В ГЕРМАНИИ',
    },
    de: {
      label: 'STARTSEITE',
      title: ['Kennenlernen.', 'Gemeinsam wachsen.'],
      description: 'Eine Gemeinschaft für Begegnungen, aus denen mehr wird.',
      brand: 'RUSSISCHSPRACHIGE GEMEINSCHAFT IN DEUTSCHLAND',
    },
  },
  events: {
    ru: {
      label: 'МЕРОПРИЯТИЯ',
      title: ['Встречаемся', 'вживую'],
      description: 'Повод познакомиться и провести время вместе.',
      brand: 'РУССКОЯЗЫЧНОЕ СООБЩЕСТВО В ГЕРМАНИИ',
    },
    de: {
      label: 'VERANSTALTUNGEN',
      title: ['Wir treffen uns', 'persönlich'],
      description: 'Ein Anlass, sich kennenzulernen und Zeit zu teilen.',
      brand: 'RUSSISCHSPRACHIGE GEMEINSCHAFT IN DEUTSCHLAND',
    },
  },
  about: {
    ru: {
      label: 'О НАС',
      title: ['Люди, которые', 'делают R.O.S.T.'],
      description: 'За каждой встречей стоят люди.',
      brand: 'РУССКОЯЗЫЧНОЕ СООБЩЕСТВО В ГЕРМАНИИ',
    },
    de: {
      label: 'ÜBER UNS',
      title: ['Menschen hinter', 'R.O.S.T.'],
      description: 'Hinter jedem Treffen stehen Menschen.',
      brand: 'RUSSISCHSPRACHIGE GEMEINSCHAFT IN DEUTSCHLAND',
    },
  },
  contacts: {
    ru: {
      label: 'КОНТАКТЫ',
      title: ['Мы на связи'],
      description: 'Есть вопрос о встрече? Напишите нам.',
      brand: 'РУССКОЯЗЫЧНОЕ СООБЩЕСТВО В ГЕРМАНИИ',
    },
    de: {
      label: 'KONTAKT',
      title: ['Wir sind da'],
      description: 'Eine Frage zum Treffen? Schreib uns.',
      brand: 'RUSSISCHSPRACHIGE GEMEINSCHAFT IN DEUTSCHLAND',
    },
  },
};

const illustration = (page) => {
  if (page === 'home' || page === 'events') {
    const photo = page === 'home' ? homePhoto : eventsPhoto;
    return `<div class="photo-frame"><img src="${photo}" alt="" /></div>`;
  }
  if (page === 'about') {
    return `<div class="portrait-frame">
      <div class="portrait-heading">R.O.S.T. <span>✦</span></div>
      <div class="portraits">${portraits.map((src) => `<img src="${src}" alt="" />`).join('')}</div>
      <div class="portrait-rule"></div>
    </div>`;
  }
  return `<div class="contact-frame">
    <div class="contact-orbit orbit-one"></div><div class="contact-orbit orbit-two"></div>
    <div class="contact-bubble bubble-back">✦</div>
    <div class="contact-bubble bubble-front"><svg viewBox="0 0 160 160" aria-hidden="true"><path d="M28 42c0-12 10-22 22-22h60c12 0 22 10 22 22v53c0 12-10 22-22 22H69l-31 23v-23c-6-4-10-12-10-22V42Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/><path d="M55 69h50M55 89h35" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg></div>
    <div class="contact-dot"></div>
  </div>`;
};

const render = (
  page,
  language,
  copy,
) => `<!doctype html><html lang="${language}"><head><meta charset="utf-8"/><style>
@font-face{font-family:Onest;src:url('${onest}');font-weight:400}
@font-face{font-family:Onest;src:url('${onestBold}');font-weight:700}
@font-face{font-family:Marmelad;src:url('${marmelad}')}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:Onest,Arial,sans-serif;color:#214c3f;background:linear-gradient(112deg,#f8faf6 0%,#edf3e8 45%,#c8d9bf 100%)}
.canvas{position:relative;width:1200px;height:630px;overflow:hidden}
.ring{position:absolute;right:-178px;top:-270px;width:760px;height:760px;border:82px solid rgba(33,76,63,.08);border-radius:50%}
.ring-small{position:absolute;right:430px;bottom:-225px;width:430px;height:430px;border:48px solid rgba(240,207,99,.16);border-radius:50%}
.brand{position:absolute;left:72px;top:54px;display:flex;align-items:center;gap:18px}
.brand-logo{width:80px;height:80px;display:grid;place-items:center;background:#fff;border-radius:50%;box-shadow:0 8px 25px rgba(33,76,63,.1)}
.brand-logo img{width:69px;height:69px;object-fit:contain}
.brand-name{font-weight:700;font-size:29px;letter-spacing:.08em;line-height:1}
.brand-sub{margin-top:10px;max-width:535px;font-size:12px;font-weight:700;letter-spacing:.13em;line-height:1.25}
.copy{position:absolute;left:72px;top:210px;width:655px}
.eyebrow{font-size:17px;font-weight:700;letter-spacing:.17em;color:#426557}
.title{margin:25px 0 0;font:normal 66px/1.11 Marmelad,Georgia,serif;letter-spacing:-.01em}
.title span{display:block;white-space:nowrap}
.title.contacts{font-size:80px}
.gold-line{width:250px;height:7px;margin-top:17px;background:#f0cf63;border-radius:8px}
.description{width:620px;margin-top:23px;font-size:23px;line-height:1.38;color:#506562}
.site{position:absolute;left:72px;bottom:47px;font-size:18px;font-weight:700;letter-spacing:.055em}
.photo-frame{position:absolute;right:68px;top:104px;width:370px;height:445px;border:7px solid white;border-radius:31px;overflow:hidden;box-shadow:0 22px 45px rgba(33,76,63,.2);background:#cbd3d0;transform:rotate(2.5deg)}
.photo-frame img{width:100%;height:100%;object-fit:cover;object-position:center}
.portrait-frame{position:absolute;right:64px;top:109px;width:385px;height:430px;border:7px solid white;border-radius:31px;box-shadow:0 22px 45px rgba(33,76,63,.15);background:#e7efe3;transform:rotate(2.5deg);padding:32px 20px}
.portrait-heading{text-align:center;font:normal 36px Marmelad,Georgia,serif}.portrait-heading span{color:#d8a82e}
.portraits{display:flex;flex-wrap:wrap;justify-content:center;gap:15px 18px;margin-top:34px}
.portraits img{width:88px;height:88px;object-fit:cover;border:5px solid white;border-radius:50%;box-shadow:0 5px 12px rgba(33,76,63,.14)}
.portrait-rule{width:125px;height:6px;margin:30px auto;background:#f0cf63;border-radius:8px}
.contact-frame{position:absolute;right:66px;top:104px;width:385px;height:445px;border:7px solid white;border-radius:31px;overflow:hidden;box-shadow:0 22px 45px rgba(33,76,63,.18);background:#214c3f;transform:rotate(2.5deg)}
.contact-orbit{position:absolute;border:3px solid rgba(255,255,255,.24);border-radius:50%}.orbit-one{width:410px;height:410px;top:-150px;left:-108px}.orbit-two{width:330px;height:330px;bottom:-160px;right:-110px}
.contact-bubble{position:absolute;display:grid;place-items:center;border-radius:50%}.bubble-back{top:76px;right:48px;width:110px;height:110px;background:#f0cf63;color:#214c3f;font-size:58px}.bubble-front{left:70px;top:135px;width:220px;height:220px;background:#f8faf6;color:#214c3f;box-shadow:0 18px 30px rgba(0,0,0,.17)}.bubble-front svg{width:140px;height:140px}.contact-dot{position:absolute;left:45px;bottom:52px;width:30px;height:30px;border-radius:50%;background:#f0cf63}
</style></head><body><div class="canvas"><div class="ring"></div><div class="ring-small"></div>
<div class="brand"><div class="brand-logo"><img src="${logo}" alt="" /></div><div><div class="brand-name">R.O.S.T.</div><div class="brand-sub">${copy.brand}</div></div></div>
<div class="copy"><div class="eyebrow">${copy.label}</div><h1 class="title ${page === 'contacts' ? 'contacts' : ''}">${copy.title.map((line) => `<span>${line}</span>`).join('')}</h1><div class="gold-line"></div><div class="description">${copy.description}</div></div>
<div class="site">rost.community</div>${illustration(page)}</div></body></html>`;

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const tab = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const [page, languages] of Object.entries(cards)) {
    for (const [language, copy] of Object.entries(languages)) {
      await tab.setContent(render(page, language, copy), { waitUntil: 'load' });
      await tab.evaluate(() => document.fonts.ready);
      const fileName =
        page === 'about'
          ? `about-${language}-v2.png`
          : `${page}-${language}.png`;
      const target = join(outputDir, fileName);
      await tab.screenshot({ path: target });
      console.log(target);
    }
  }
} finally {
  await browser.close();
}
