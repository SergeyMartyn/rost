import config from '../../site.config.json';
export type Language = 'de' | 'ru';
export type Page = keyof typeof config.routes;
export const languages: Language[] = ['de', 'ru'];
export const site = config;
export const routes = config.routes;
export const origin = config.domain || 'https://example.invalid';
export const name = config.name || 'Website / Сайт';
export const text = {
  de: {
    home: 'Startseite',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    skip: 'Zum Inhalt',
    settings: 'Datenschutzeinstellungen',
    title: 'Raum für Ihre Ideen',
    description: 'Ein klarer Anfang für Ihre neue Website.',
    intro:
      'Hier entsteht Ihre Website. Gestalten Sie diesen Platz mit Ihren Inhalten.',
    legal: 'Noch auszufüllen',
    legalNote:
      'Diese Seite ist ein unvollständiger Rahmen. Angaben und Texte müssen vor der Veröffentlichung ergänzt und geprüft werden.',
    operator: 'Verantwortlich',
    address: 'Anschrift',
    email: 'E-Mail',
    privacyContact: 'Datenschutzkontakt',
  },
  ru: {
    home: 'Главная',
    imprint: 'Правовая информация',
    privacy: 'Конфиденциальность',
    skip: 'К содержанию',
    settings: 'Настройки конфиденциальности',
    title: 'Место для ваших идей',
    description: 'Понятное начало для вашего нового сайта.',
    intro:
      'Здесь будет ваш сайт. Наполните это пространство своим содержанием.',
    legal: 'Нужно заполнить',
    legalNote:
      'Это незавершённый каркас страницы. Перед публикацией необходимо дополнить и проверить сведения и тексты.',
    operator: 'Ответственное лицо',
    address: 'Адрес',
    email: 'Электронная почта',
    privacyContact: 'Контакт по защите данных',
  },
};
