// Banner texts (Consent Banner 2, parts III.1–III.3). German is the legally
// leading text (R-13.5); the Russian text must keep the same meaning (R-13.2).
// Only categories with connected services are shown (R-5.2).
import { routes, site } from './site';
import { activeCategories, services, type ConsentService } from './services';

type Lang = 'de' | 'ru';

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const settingsLabel = { de: 'Cookie-Einstellungen', ru: 'Настройки cookie' };

const statisticsServices = (lang: Lang) =>
  services
    .filter((s) => s.category === 'analytics')
    .map((s) => s.name[lang].replace(/ \(.*\)$/, ''))
    .join(', ');

const marketingServices = (lang: Lang) =>
  services
    .filter((s) => s.category === 'marketing')
    .map((s) => s.name[lang].replace(/ \(.*\)$/, ''))
    .join(', ');

function serviceBlock(service: ConsentService, lang: Lang) {
  const labels =
    lang === 'de'
      ? {
          provider: 'Anbieter',
          purpose: 'Zweck',
          cookies: 'Cookies',
          us: 'Übermittlung in die USA',
          policy: 'Datenschutzhinweise des Anbieters',
        }
      : {
          provider: 'Провайдер',
          purpose: 'Цель',
          cookies: 'Cookies',
          us: 'Передача в США',
          policy: 'Политика провайдера',
        };
  return `<dl class="cc-service">
<dt>${esc(service.name[lang])}</dt>
<dd><span>${labels.provider}:</span> ${esc(service.provider[lang])}</dd>
<dd><span>${labels.purpose}:</span> ${esc(service.purpose[lang])}</dd>
<dd><span>${labels.cookies}:</span> ${service.cookies[lang]}</dd>
<dd><span>${labels.us}:</span> ${esc(service.usTransfer[lang])}</dd>
<dd><span>${labels.policy}:</span> <a href="${service.policyUrl}" target="_blank" rel="noopener noreferrer">${service.policyUrl}</a></dd>
</dl>`;
}

export function buildTranslations() {
  const operator = esc(site.legal.operator);
  const hasAnalytics = activeCategories.includes('analytics');
  const hasMarketing = activeCategories.includes('marketing');

  const de = {
    consentModal: {
      label: 'Datenschutz-Einstellungen',
      title: 'Datenschutz-Einstellungen',
      description: hasMarketing
        ? `Wir möchten optionale Dienste für Statistik (${statisticsServices('de')}) und Marketing (${marketingServices('de')}) einsetzen. Je nach Ihrer Auswahl können Daten zu Ihrem Besuch und Gerät an Google oder Meta übermittelt und auch außerhalb der EU verarbeitet werden. Jeder Dienst wird erst mit Ihrer Einwilligung aktiviert; die Website funktioniert auch ohne diese Dienste. Ihre Auswahl können Sie jederzeit unter „${settingsLabel.de}“ ändern oder widerrufen.`
        : hasAnalytics
          ? `Wir möchten auf dieser Website einen optionalen Dienst für Statistik (${statisticsServices('de')}) einsetzen. Er wird erst aktiviert, wenn Sie zustimmen – ohne Zustimmung funktioniert die Website vollständig. Dabei können Daten wie Ihre IP-Adresse und Geräteinformationen an Google übermittelt und auch in den USA verarbeitet werden. Ihre Auswahl können Sie jederzeit unter „${settingsLabel.de}“ ändern oder widerrufen.`
          : '',
      acceptAllBtn: 'Alle akzeptieren',
      acceptNecessaryBtn: 'Nur notwendige',
      showPreferencesBtn: 'Einstellungen',
      footer: `<span>Verantwortlich: ${operator} · <a href="${routes.privacy.de}">Datenschutzerklärung</a> · <a href="${routes.imprint.de}">Impressum</a></span>`,
    },
    preferencesModal: {
      title: settingsLabel.de,
      acceptAllBtn: 'Alle akzeptieren',
      acceptNecessaryBtn: 'Alle ablehnen',
      savePreferencesBtn: 'Auswahl speichern',
      closeIconLabel: 'Schließen, ohne die Auswahl zu ändern',
      serviceCounterLabel: 'Dienst|Dienste',
      sections: [
        {
          title: settingsLabel.de,
          description: `Hier entscheiden Sie, welche optionalen Dienste wir verwenden dürfen. Notwendige Funktionen sind immer aktiv. Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Details finden Sie in der <a href="${routes.privacy.de}">Datenschutzerklärung</a>.`,
        },
        {
          title: 'Notwendig <span class="pm__badge">immer aktiv</span>',
          description:
            'Erforderlich für den Betrieb und die Sicherheit der Website sowie zum Speichern Ihrer Auswahl in diesem Fenster (Cookie „cc_cookie“, 12 Monate).',
          linkedCategory: 'necessary',
        },
        ...(hasAnalytics
          ? [
              {
                title: 'Statistik',
                description: `Hilft uns zu verstehen, wie die Website genutzt wird, z. B. welche Seiten aufgerufen werden. Dienst: ${statisticsServices('de')}.${services
                  .filter((s) => s.category === 'analytics')
                  .map((s) => serviceBlock(s, 'de'))
                  .join('')}`,
                linkedCategory: 'analytics',
              },
            ]
          : []),
        ...(hasMarketing
          ? [
              {
                title: 'Marketing',
                description: `Hilft uns, Seitenaufrufe zu erfassen und unsere Werbung auf Facebook und Instagram zu messen und zu verbessern. Dienst: ${marketingServices('de')}.${services
                  .filter((s) => s.category === 'marketing')
                  .map((s) => serviceBlock(s, 'de'))
                  .join('')}`,
                linkedCategory: 'marketing',
              },
            ]
          : []),
      ],
    },
  };

  const ru = {
    consentModal: {
      label: 'Настройки конфиденциальности',
      title: 'Настройки конфиденциальности',
      description: hasMarketing
        ? `Мы хотели бы использовать дополнительные сервисы для статистики (${statisticsServices('ru')}) и маркетинга (${marketingServices('ru')}). В зависимости от вашего выбора сведения о посещении и устройстве могут передаваться Google или Meta и обрабатываться за пределами ЕС. Каждый сервис включается только после вашего согласия; без них сайт работает полностью. Выбор можно в любой момент изменить или отозвать в «${settingsLabel.ru}».`
        : hasAnalytics
          ? `Мы хотели бы использовать на этом сайте дополнительный сервис для статистики (${statisticsServices('ru')}). Он включается только с вашего согласия — без него сайт работает полностью. При этом данные, например IP-адрес и сведения об устройстве, могут передаваться Google и обрабатываться в том числе в США. Выбор можно в любой момент изменить или отозвать в «${settingsLabel.ru}».`
          : '',
      acceptAllBtn: 'Принять все',
      acceptNecessaryBtn: 'Только необходимые',
      showPreferencesBtn: 'Настройки',
      footer: `<span>Ответственный: ${operator} · <a href="${routes.privacy.ru}">Политика конфиденциальности</a> · <a href="${routes.imprint.ru}">Правовая информация</a></span>`,
    },
    preferencesModal: {
      title: settingsLabel.ru,
      acceptAllBtn: 'Принять все',
      acceptNecessaryBtn: 'Отклонить все',
      savePreferencesBtn: 'Сохранить выбор',
      closeIconLabel: 'Закрыть, не меняя выбор',
      serviceCounterLabel: 'сервис|сервиса|сервисов',
      sections: [
        {
          title: settingsLabel.ru,
          description: `Здесь вы решаете, какие дополнительные сервисы мы можем использовать. Необходимые функции всегда активны. Согласие можно в любой момент отозвать на будущее. Подробности — в <a href="${routes.privacy.ru}">политике конфиденциальности</a>.`,
        },
        {
          title: 'Необходимые <span class="pm__badge">всегда активны</span>',
          description:
            'Нужны для работы и безопасности сайта, а также для сохранения вашего выбора в этом окне (cookie «cc_cookie», 12 месяцев).',
          linkedCategory: 'necessary',
        },
        ...(hasAnalytics
          ? [
              {
                title: 'Статистика',
                description: `Помогает понять, как используется сайт, например какие страницы открывают. Сервис: ${statisticsServices('ru')}.${services
                  .filter((s) => s.category === 'analytics')
                  .map((s) => serviceBlock(s, 'ru'))
                  .join('')}`,
                linkedCategory: 'analytics',
              },
            ]
          : []),
        ...(hasMarketing
          ? [
              {
                title: 'Маркетинг',
                description: `Помогает учитывать посещения страниц и оценивать и улучшать нашу рекламу в Facebook и Instagram. Сервис: ${marketingServices('ru')}.${services
                  .filter((s) => s.category === 'marketing')
                  .map((s) => serviceBlock(s, 'ru'))
                  .join('')}`,
                linkedCategory: 'marketing',
              },
            ]
          : []),
      ],
    },
  };

  return { de, ru };
}
