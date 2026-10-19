import type { Language } from '../lib/site';

export interface TiPractitioner {
  id: string;
  image: string;
  name: string;
  qualification: string;
  game: string;
  tagline: string;
  body: string;
  fit: string[];
  note: string;
}

export interface TiProgramItem {
  time: string;
  label: string;
}

export interface TiTicket {
  key: 'guest' | 'guest_peak';
  name: string;
  price: string;
  includes: string[];
}

export interface TiGamesContent {
  eyebrow: string;
  datePill: string;
  title: string[];
  intro: string;
  when: string;
  where: string;
  date: string;
  venue: string;
  address: string;
  chooseTicket: string;
  basicTicket: string;
  peakTicket: string;
  basicIncludes: string;
  peakIncludes: string;
  buyTicket: string;
  host: string;
  ticketNote: string;
  aboutEyebrow: string;
  aboutTitle: string[];
  aboutBody: string;
  features: Array<{ title: string; body: string }>;
  programEyebrow: string;
  programTitle: string;
  program: TiProgramItem[];
  practitionersEyebrow: string;
  practitionersTitle: string;
  practitioners: TiPractitioner[];
  practitionerCounter: string;
  gameLabel: string;
  fitLabel: string;
  otherPractitioners: string;
  allPractitioners: string;
  close: string;
  ticketsEyebrow: string;
  ticketsTitle: string;
  tickets: TiTicket[];
  questionsTitle: string;
  questionsBody: string;
  contactLink: string;
}

const programRu: TiProgramItem[] = [
  { time: '09:30–10:00', label: 'Регистрация' },
  { time: '10:00–10:10', label: 'Открытие дня' },
  { time: '10:10–11:30', label: 'Нетворкинг' },
  { time: '11:30–11:45', label: 'Знакомство с ведущими' },
  { time: '11:45–14:00', label: 'Первая линейка игр' },
  { time: '14:00–15:15', label: 'Обед' },
  { time: '15:15–15:30', label: 'Знакомство с ведущими' },
  { time: '15:30–17:45', label: 'Вторая линейка игр' },
  { time: '17:45–18:15', label: 'Награждение и розыгрыш' },
  { time: '18:30–22:00', label: 'Ужин VIP · тариф «Пик трансформации»' },
];

const programDe: TiProgramItem[] = [
  { time: '09:30–10:00', label: 'Anmeldung' },
  { time: '10:00–10:10', label: 'Eröffnung des Tages' },
  { time: '10:10–11:30', label: 'Networking' },
  { time: '11:30–11:45', label: 'Begegnung mit den Spielleitenden' },
  { time: '11:45–14:00', label: 'Erste Spielrunde' },
  { time: '14:00–15:15', label: 'Mittagessen' },
  { time: '15:15–15:30', label: 'Begegnung mit den Spielleitenden' },
  { time: '15:30–17:45', label: 'Zweite Spielrunde' },
  { time: '17:45–18:15', label: 'Auszeichnung und Verlosung' },
  {
    time: '18:30–22:00',
    label: 'VIP-Abendessen · Tarif „Gipfel der Transformation“',
  },
];

const practitionersRu: TiPractitioner[] = [
  {
    id: 'kristina',
    image: '/images/ti-games/kristina.webp',
    name: 'Кристина Бауэр',
    qualification: 'Коуч и тренер эмоциональных состояний',
    game: 'AinSof',
    tagline: 'Увидеть новые возможности и найти следующий шаг',
    body: 'На встрече можно исследовать свой запрос, заметить ограничения и найти ресурсы для движения к цели.',
    fit: ['Если нужна ясность и мотивация', 'Если хотите увидеть новые возможности'],
    note: 'Опыт игры не требуется',
  },
  {
    id: 'katharina',
    image: '/images/ti-games/katharina.webp',
    name: 'Катарина Базаль',
    qualification: 'Интегративный аромапрактик, проводник трансформационных процессов',
    game: 'Вопрос в эфире. Круг трансформаций',
    tagline: 'Посмотреть на ситуацию под новым углом',
    body: 'Через ароматы и интуитивные практики исследовать запрос, увидеть скрытые причины и найти внутреннюю опору.',
    fit: ['Если стоите на пороге перемен', 'Если ищете ясность в своём запросе'],
    note: 'Опыт игры не требуется',
  },
  {
    id: 'elena',
    image: '/images/ti-games/elena.webp',
    name: 'Елена Гельмель',
    qualification:
      'Сертифицированный игропрактик, специалист по метафорическим картам, бизнес-тренер',
    game: 'Путь Желаний',
    tagline: 'Разобраться, какие желания ваши',
    body: 'Отделить свои желания от навязанных ожиданий и найти опору для действия.',
    fit: [
      'Если хочется перемен в работе или своём деле',
      'Если устали подстраиваться под чужие ожидания',
    ],
    note: 'Опыт игры не требуется',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Зинаида Ланглитц',
    qualification: 'Коуч, ментор, практический психолог',
    game: 'Путь к себе — волшебство самооценки',
    tagline: 'Вернуть уверенность и внутреннюю опору',
    body: 'Поговорить об уверенности, самоценности и выборе следующего шага.',
    fit: [
      'Если устали от тревоги и ощущения «я потерялась»',
      'Если хотите выбрать себя',
    ],
    note: 'Опыт игры не требуется',
  },
  {
    id: 'alla',
    image: '/images/ti-games/alla.webp',
    name: 'Алла Афанасенко',
    qualification:
      'Врач, клинический психолог, психотерапевт, сертифицированный супервизор',
    game: 'Секс, Деньги и Любовь · Дивергент',
    tagline: 'Исследовать отношения, роли и перемены',
    body: 'Исследовать отношения, внутренние роли, принятие и перемены в жизни.',
    fit: [
      'Если чувствуете внутренние запреты на любовь, удовольствие и деньги',
      'Если переживаете смену жизненного этапа',
    ],
    note: 'Опыт игры не требуется',
  },
];

const practitionersDe: TiPractitioner[] = [
  {
    id: 'kristina',
    image: '/images/ti-games/kristina.webp',
    name: 'Kristina Bauer',
    qualification: 'Coach und Trainerin für emotionale Zustände',
    game: 'AinSof',
    tagline: 'Neue Möglichkeiten sehen und den nächsten Schritt finden',
    body: 'In der Runde kannst du dein Anliegen untersuchen, Begrenzungen bemerken und Ressourcen für deinen Weg finden.',
    fit: ['Wenn du Klarheit und Motivation suchst', 'Wenn du neue Möglichkeiten sehen möchtest'],
    note: 'Spielerfahrung ist nicht nötig',
  },
  {
    id: 'katharina',
    image: '/images/ti-games/katharina.webp',
    name: 'Katharina Basal',
    qualification:
      'Integrative Aromapraktikerin, Begleiterin transformativer Prozesse',
    game: 'Frage im Äther. Kreis der Transformationen',
    tagline: 'Die Situation aus einem neuen Blickwinkel betrachten',
    body: 'Mit Aromen und intuitiven Praktiken dein Anliegen erforschen, verborgene Ursachen sehen und innere Stabilität finden.',
    fit: ['Wenn du an der Schwelle zu Veränderungen stehst', 'Wenn du Klarheit in deinem Anliegen suchst'],
    note: 'Spielerfahrung ist nicht nötig',
  },
  {
    id: 'elena',
    image: '/images/ti-games/elena.webp',
    name: 'Elena Gelmel',
    qualification:
      'Zertifizierte Spielpraktikerin, Expertin für metaphorische Karten, Business-Trainerin',
    game: 'Der Weg der Wünsche',
    tagline: 'Herausfinden, welche Wünsche die eigenen sind',
    body: 'Eigene Wünsche von übernommenen Erwartungen trennen und eine Grundlage für Handeln finden.',
    fit: [
      'Wenn du Veränderung in der Arbeit oder im eigenen Projekt möchtest',
      'Wenn du es leid bist, dich an fremden Erwartungen auszurichten',
    ],
    note: 'Spielerfahrung ist nicht nötig',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Sinaida Langlitz',
    qualification: 'Coach, Mentorin, praktische Psychologin',
    game: 'Der Weg zu sich selbst — die Magie des Selbstwerts',
    tagline: 'Selbstvertrauen und innere Stabilität zurückgewinnen',
    body: 'Über Selbstvertrauen, Selbstwert und den nächsten Schritt sprechen.',
    fit: [
      'Wenn du unter Unruhe und dem Gefühl „ich habe mich verloren“ leidest',
      'Wenn du dich selbst wählen möchtest',
    ],
    note: 'Spielerfahrung ist nicht nötig',
  },
  {
    id: 'alla',
    image: '/images/ti-games/alla.webp',
    name: 'Alla Afanasenko',
    qualification:
      'Ärztin, klinische Psychologin, Psychotherapeutin, zertifizierte Supervisorin',
    game: 'Sex, Geld und Liebe · Divergent',
    tagline: 'Beziehungen, Rollen und Veränderungen erforschen',
    body: 'Beziehungen, innere Rollen, Annahme und Veränderungen im Leben erforschen.',
    fit: [
      'Wenn du innere Verbote gegenüber Liebe, Freude und Geld spürst',
      'Wenn du einen neuen Lebensabschnitt beginnst',
    ],
    note: 'Spielerfahrung ist nicht nötig',
  },
];

export const tiGames: Record<Language, TiGamesContent> = {
  ru: {
    eyebrow: 'Мероприятия / Трансформационные игры',
    datePill: '7 ноября · Мюнхен',
    title: ['День', 'трансформационных', 'игр в Мюнхене'],
    intro:
      'Две игровые сессии, нетворкинг и время, чтобы познакомиться с людьми ближе.',
    when: 'Когда',
    where: 'Где',
    date: '7 ноября 2026',
    venue: 'Мюнхен',
    address: 'Perchtinger Straße 12 · 81379 München',
    chooseTicket: 'Выберите билет участника',
    basicTicket: 'Базовый импульс',
    peakTicket: 'Пик трансформации',
    basicIncludes: 'Игры, общие зоны, напитки и фото',
    peakIncludes: 'Всё выше + Zoom, фото, ужин и консультация',
    buyTicket: 'Купить билет участника',
    host: 'Хочу провести игру',
    ticketNote: 'Состав билетов — ниже на странице',
    aboutEyebrow: 'О мероприятии',
    aboutTitle: ['Провести день с пользой', 'и в хорошей компании'],
    aboutBody:
      'Вы выбираете игру, знакомитесь с ведущими и участниками, а затем пробуете новые взгляды на свой запрос в небольших группах.',
    features: [
      { title: 'Знакомства', body: 'Модерируемый нетворкинг' },
      { title: 'Игры', body: 'Две игровые линейки' },
      { title: 'Общение', body: 'Перерывы, обед и новые связи' },
    ],
    programEyebrow: 'Программа',
    programTitle: 'Как пройдёт день',
    program: programRu,
    practitionersEyebrow: 'Игропрактики',
    practitionersTitle: 'С кем можно сыграть',
    practitioners: practitionersRu,
    practitionerCounter: 'Игропрактик · 1 из 5',
    gameLabel: 'Игра',
    fitLabel: 'Подойдёт, если',
    otherPractitioners: 'Другие ведущие',
    allPractitioners: 'Все игропрактики',
    close: 'Закрыть описание игропрактика',
    ticketsEyebrow: 'Билеты',
    ticketsTitle: 'Что входит в участие',
    tickets: [
      {
        key: 'guest',
        name: 'Базовый импульс',
        price: '80 €',
        includes: [
          'Участие в играх',
          'Доступ к общим зонам',
          'Вода, чай, кофе',
          'Общая фотография участников',
        ],
      },
      {
        key: 'guest_peak',
        name: 'Пик трансформации',
        price: '180 €',
        includes: [
          'Всё из «Базового импульса»',
          'Групповой Zoom и профессиональные фото',
          'Закрытый чат, ужин с ведущими',
          'Приоритет места и консультация 15–20 минут',
        ],
      },
    ],
    questionsTitle: 'Есть вопросы перед встречей?',
    questionsBody: 'Напишите нам — поможем выбрать формат участия.',
    contactLink: 'Связаться с нами →',
  },
  de: {
    eyebrow: 'Veranstaltungen / Transformationsspiele',
    datePill: '7. November · München',
    title: ['Tag der', 'Transformationsspiele', 'in München'],
    intro:
      'Zwei Spielrunden, Networking und Zeit, um Menschen näher kennenzulernen.',
    when: 'Wann',
    where: 'Wo',
    date: '7. November 2026',
    venue: 'München',
    address: 'Perchtinger Straße 12 · 81379 München',
    chooseTicket: 'Wähle dein Ticket',
    basicTicket: 'Basisimpuls',
    peakTicket: 'Gipfel der Transformation',
    basicIncludes: 'Spiele, Gemeinschaftsbereiche, Getränke und Foto',
    peakIncludes: 'Alles oben + Zoom, Fotos, Abendessen und Beratung',
    buyTicket: 'Ticket für Teilnehmende kaufen',
    host: 'Ich möchte ein Spiel leiten',
    ticketNote: 'Ticketinhalt — weiter unten auf der Seite',
    aboutEyebrow: 'Über die Veranstaltung',
    aboutTitle: ['Einen Tag mit Sinn', 'und in guter Gesellschaft'],
    aboutBody:
      'Du wählst ein Spiel, lernst Spielleitende und Teilnehmende kennen und betrachtest dein Anliegen anschließend in kleinen Gruppen aus neuen Blickwinkeln.',
    features: [
      { title: 'Begegnungen', body: 'Moderiertes Networking' },
      { title: 'Spiele', body: 'Zwei Spielrunden' },
      { title: 'Austausch', body: 'Pausen, Mittagessen und neue Kontakte' },
    ],
    programEyebrow: 'Programm',
    programTitle: 'Wie der Tag abläuft',
    program: programDe,
    practitionersEyebrow: 'Spielleitende',
    practitionersTitle: 'Mit wem du spielen kannst',
    practitioners: practitionersDe,
    practitionerCounter: 'Spielleitende · 1 von 5',
    gameLabel: 'Spiel',
    fitLabel: 'Passt, wenn',
    otherPractitioners: 'Weitere Spielleitende',
    allPractitioners: 'Alle Spielleitenden',
    close: 'Beschreibung schließen',
    ticketsEyebrow: 'Tickets',
    ticketsTitle: 'Was in der Teilnahme enthalten ist',
    tickets: [
      {
        key: 'guest',
        name: 'Basisimpuls',
        price: '80 €',
        includes: [
          'Teilnahme an den Spielen',
          'Zugang zu den Gemeinschaftsbereichen',
          'Wasser, Tee, Kaffee',
          'Gemeinsames Foto der Teilnehmenden',
        ],
      },
      {
        key: 'guest_peak',
        name: 'Gipfel der Transformation',
        price: '180 €',
        includes: [
          'Alles aus „Basisimpuls“',
          'Gruppen-Zoom und professionelle Fotos',
          'Geschlossener Chat, Abendessen mit Spielleitenden',
          'Bevorzugter Platz und Beratung 15–20 Minuten',
        ],
      },
    ],
    questionsTitle: 'Noch Fragen vor der Veranstaltung?',
    questionsBody: 'Schreib uns — wir helfen bei der Wahl des Formats.',
    contactLink: 'Kontakt aufnehmen →',
  },
};
