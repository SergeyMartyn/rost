import type { Language } from '../lib/site';

export interface TiPractitioner {
  id: string;
  image: string;
  name: string;
  qualification: string;
  game: string;
  tagline: string;
  body: string;
  facts: string[];
  fit: string[];
  results: string[];
  otherGame?: { name: string; fit: string[]; results: string[] };
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
  heroHighlights: string[];
  when: string;
  where: string;
  date: string;
  arrival: string;
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
  gameLabel: string;
  fitLabel: string;
  factsLabel: string;
  resultsLabel: string;
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

const registrationTime = '09:30';
const openingTime = '10:00';

const programRu: TiProgramItem[] = [
  { time: `${registrationTime}–${openingTime}`, label: 'Регистрация' },
  { time: `${openingTime}–10:10`, label: 'Открытие дня' },
  { time: '10:10–11:30', label: 'Модерируемый нетворкинг' },
  { time: '11:30–11:45', label: 'Знакомство с ведущими' },
  { time: '11:45–14:00', label: 'Первая линейка игр' },
  { time: '14:00–15:15', label: 'Совместный обед (оплачивается отдельно)' },
  { time: '15:15–15:30', label: 'Знакомство с ведущими' },
  { time: '15:30–17:45', label: 'Вторая линейка игр' },
  { time: '17:45–18:15', label: 'Награждение и розыгрыш' },
  { time: '18:30–22:00', label: 'Ужин VIP · тариф «Пик трансформации»' },
];

const programDe: TiProgramItem[] = [
  { time: `${registrationTime}–${openingTime}`, label: 'Anmeldung' },
  { time: `${openingTime}–10:10`, label: 'Eröffnung des Tages' },
  { time: '10:10–11:30', label: 'Moderiertes Networking' },
  { time: '11:30–11:45', label: 'Begegnung mit den Spielleitenden' },
  { time: '11:45–14:00', label: 'Erste Spielrunde' },
  {
    time: '14:00–15:15',
    label: 'Gemeinsames Mittagessen (separat zu bezahlen)',
  },
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
    qualification: 'Неопсихолог, коуч и тренер эмоциональных состояний',
    game: 'AinSof',
    tagline: 'Увидеть новые возможности и найти следующий шаг',
    body: 'На встрече можно исследовать свой запрос, заметить ограничения и найти ресурсы для движения к цели.',
    facts: [
      'Более четырёх лет практики, свыше 500 клиентов в индивидуальных и групповых сессиях.',
      'По данным страницы мероприятия, 98% участников отмечают перемены уже после первой встречи.',
      'Сооснователь пространства R.O.S.T. в Мюнхене, которое посетили более 300 человек.',
      'Сертифицированная ведущая игры AinSof в Германии.',
    ],
    fit: [
      'Хотите понять, куда двигаться дальше.',
      'Мешают страхи или внутренние ограничения.',
      'Ищете ресурсы и мотивацию для достижения цели.',
      'Уже знаете цель, но хотите быстрее к ней прийти.',
    ],
    results: [
      'По-новому посмотрите на свои ресурсы и возможности.',
      'Увидите установки, которые мешают действовать.',
      'Найдёте новые стратегии и потренируете принятие решений.',
      'Исследуете свой подход к финансам и личным целям.',
    ],
    note: 'AinSof помогает исследовать свой запрос и увидеть новые варианты действий.',
  },
  {
    id: 'katharina',
    image: '/images/ti-games/katharina.webp',
    name: 'Катарина Базаль',
    qualification:
      'Интегративный аромапрактик, проводник трансформационных процессов',
    game: 'Вопрос в эфире. Круг трансформаций',
    tagline: 'Посмотреть на ситуацию под новым углом',
    body: 'Через ароматы и интуитивные практики исследовать запрос, увидеть скрытые причины и найти внутреннюю опору.',
    facts: [
      'Соединяет ароматерапию, интуитивные практики и работу с подсознанием.',
      'Использует ароматы как способ обратиться к эмоциям, памяти и внутренним ресурсам.',
      'Помогает искать ответы, когда привычная логика не даёт ясности.',
    ],
    fit: [
      'Стоите на пороге перемен.',
      'Чувствуете тупик и хотите посмотреть на ситуацию иначе.',
      'Ищете ресурс и внутреннюю опору для следующего шага.',
      'Открыты к мягкой работе через ощущения и ароматы.',
      'Хотите услышать ответы, которые трудно найти одной логикой.',
    ],
    results: [
      'Точнее сформулируете свой запрос.',
      'Замечаете скрытые причины и уже доступные вам ресурсы.',
      'Найдёте возможный следующий шаг; в завершение получите ресурсный аромат.',
      'Поисследуете связь ароматов, воспоминаний и эмоциональных состояний.',
    ],
    note: 'Игра «Вопрос в эфире. Круг трансформаций» приглашает задать важный для вас вопрос.',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Зинаида Ланглитц',
    qualification: 'Коуч, ментор, практический психолог',
    game: 'Путь к себе: волшебство самооценки',
    tagline: 'Вернуть уверенность и внутреннюю опору',
    body: 'Поговорить об уверенности, самоценности и выборе следующего шага.',
    facts: [
      'Сертифицированный коуч Академии 5 Prism, практический психолог.',
      'Два года сопровождает клиентов индивидуально.',
      'Более 80 клиентов прошли с ней коучинг, трансформационные сессии и игровые практики.',
      'Работает с самооценкой, идентичностью и поиском внутренней силы.',
    ],
    fit: [
      'Хотите вернуть уверенность и внутреннюю опору.',
      'Чувствуете тревогу или потеряли ощущение себя.',
      'Стоите на перепутье и хотите понять свои желания.',
      'Хотите разобраться со страхами и личными ограничениями.',
      'Готовы снова поставить собственные потребности на первое место.',
    ],
    results: [
      'Лучше поймёте, что мешает двигаться вперёд.',
      'Услышите свои желания и почувствуете больше ясности.',
      'Найдёте внутреннюю поддержку для дальнейших действий.',
      'Поищете способ действовать из уверенности, а не из страха.',
    ],
    note: '«Путь к себе: волшебство самооценки» помогает взглянуть на себя по-новому.',
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
    facts: [
      '23 года практики в психологии и психотерапии.',
      'Более 20 000 индивидуальных и групповых консультаций.',
      'Автор программ посттравматического роста; провела более 30 трансформационных игр.',
      'Соединяет психологию, медицину, телесные и творческие методы.',
    ],
    fit: [
      'Чувствуете внутренние запреты на любовь, удовольствие или деньги.',
      'Сложно доверять и строить отношения.',
      'Хотите соединить материальное и эмоциональное без стыда и напряжения.',
    ],
    results: [
      'Замечаете установки, влияющие на отношения и достаток.',
      'Исследуете старые роли и ограничивающие привычки.',
      'Поищете опору для нового этапа жизни.',
      'Исследуете связь с телом, чувственностью и самоценностью.',
    ],
    otherGame: {
      name: 'Дивергент',
      fit: [
        'Переживаете переезд, кризис или профессиональный переход.',
        'Узнаёте в себе роли спасателя, перфекциониста или «выжившего».',
        'Хотите меньше выгорать и работать с большей радостью.',
      ],
      results: [
        'Увидите, как старые роли влияют на нынешние решения.',
        'Поищете более подходящие способы действовать.',
        'Найдёте направление для следующего жизненного этапа.',
      ],
    },
    note: 'Алла проводит две игры: «Секс, Деньги и Любовь» и «Дивергент».',
  },
];

const practitionersDe: TiPractitioner[] = [
  {
    id: 'kristina',
    image: '/images/ti-games/kristina.webp',
    name: 'Kristina Bauer',
    qualification:
      'Neopsychologin, Coach und Trainerin für emotionale Zustände',
    game: 'AinSof',
    tagline: 'Neue Möglichkeiten sehen und den nächsten Schritt finden',
    body: 'In der Runde kannst du dein Anliegen untersuchen, Begrenzungen bemerken und Ressourcen für deinen Weg finden.',
    facts: [
      'Mehr als vier Jahre Praxis und über 500 Klientinnen und Klienten in Einzel- und Gruppensitzungen.',
      'Laut der Veranstaltungsseite berichten 98 % der Teilnehmenden nach dem ersten Treffen von Veränderungen.',
      'Mitgründerin des R.O.S.T.-Raums in München, den mehr als 300 Menschen besucht haben.',
      'Zertifizierte Spielleiterin für AinSof in Deutschland.',
    ],
    fit: [
      'Du möchtest wissen, wie es für dich weitergeht.',
      'Ängste oder innere Hürden halten dich zurück.',
      'Du suchst Ressourcen und Motivation für dein Ziel.',
      'Du kennst dein Ziel und möchtest schneller vorankommen.',
    ],
    results: [
      'Du siehst deine Ressourcen und Möglichkeiten aus einer neuen Perspektive.',
      'Du erkennst Überzeugungen, die dich bremsen.',
      'Du entwickelst mögliche Strategien und übst Entscheidungen.',
      'Du erkundest deinen Umgang mit Geld und persönlichen Zielen.',
    ],
    note: 'AinSof hilft dir, dein Anliegen zu erkunden und neue Handlungsmöglichkeiten zu sehen.',
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
    facts: [
      'Verbindet Aromatherapie, intuitive Methoden und die Arbeit mit dem Unterbewusstsein.',
      'Nutzt Düfte als Zugang zu Emotionen, Erinnerungen und inneren Ressourcen.',
      'Begleitet Menschen bei Fragen, auf die reine Logik keine Antwort gibt.',
    ],
    fit: [
      'Du stehst vor einer Veränderung.',
      'Du fühlst dich festgefahren und möchtest anders auf die Situation schauen.',
      'Du suchst Kraft und innere Orientierung für deinen nächsten Schritt.',
      'Du bist offen für eine behutsame Arbeit mit Düften und Wahrnehmung.',
      'Du suchst Antworten jenseits der gewohnten Logik.',
    ],
    results: [
      'Du formulierst dein Anliegen genauer.',
      'Du erkennst mögliche Ursachen und vorhandene Ressourcen.',
      'Du findest einen möglichen nächsten Schritt und erhältst zum Schluss einen persönlichen Ressourcenduft.',
      'Du erkundest die Verbindung zwischen Düften, Erinnerungen und Gefühlen.',
    ],
    note: '„Frage im Äther. Kreis der Transformationen“ lädt dich ein, deine wichtige Frage zu stellen.',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Sinaida Langlitz',
    qualification: 'Coach, Mentorin, praktische Psychologin',
    game: 'Der Weg zu sich selbst: die Magie des Selbstwerts',
    tagline: 'Selbstvertrauen und innere Stabilität zurückgewinnen',
    body: 'Über Selbstvertrauen, Selbstwert und den nächsten Schritt sprechen.',
    facts: [
      'Zertifizierter Coach der 5-Prism-Akademie und praktische Psychologin.',
      'Begleitet Menschen seit zwei Jahren individuell.',
      'Mehr als 80 Menschen nahmen bei ihr an Coaching, Transformationssitzungen und Spielmethoden teil.',
      'Arbeitet mit Selbstwert, Identität und innerer Stärke.',
    ],
    fit: [
      'Du möchtest Selbstvertrauen und innere Stabilität zurückgewinnen.',
      'Du fühlst Unruhe oder hast das Gefühl, dich selbst verloren zu haben.',
      'Du stehst an einer Weggabelung und möchtest deine Wünsche verstehen.',
      'Du möchtest Ängste und persönliche Grenzen erkunden.',
      'Du bist bereit, deine eigenen Bedürfnisse wieder ernst zu nehmen.',
    ],
    results: [
      'Du verstehst besser, was dich bisher aufgehalten hat.',
      'Du hörst deine Wünsche deutlicher und gewinnst Klarheit.',
      'Du findest innere Unterstützung für deine nächsten Schritte.',
      'Du suchst einen Weg, aus Zuversicht statt aus Angst zu handeln.',
    ],
    note: '„Der Weg zu sich selbst – die Magie des Selbstwerts“ eröffnet einen neuen Blick auf dich selbst.',
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
    facts: [
      '23 Jahre Erfahrung in Psychologie und Psychotherapie.',
      'Mehr als 20 000 Einzel- und Gruppengespräche.',
      'Entwicklerin von Programmen für posttraumatisches Wachstum; leitete über 30 Transformationsspiele.',
      'Verbindet Psychologie und Medizin mit körperorientierten und kreativen Methoden.',
    ],
    fit: [
      'Du spürst innere Verbote gegenüber Liebe, Freude oder Geld.',
      'Vertrauen und Beziehungen fallen dir schwer.',
      'Du möchtest Materielles und Emotionales ohne Scham miteinander verbinden.',
    ],
    results: [
      'Du bemerkst Überzeugungen rund um Beziehungen und Geld.',
      'Du erkundest alte Rollen und begrenzende Muster.',
      'Du suchst Halt für eine neue Lebensphase.',
      'Du erkundest Körpergefühl, Sinnlichkeit und Selbstwert.',
    ],
    otherGame: {
      name: 'Divergent',
      fit: [
        'Du erlebst einen Umzug, eine Krise oder einen beruflichen Übergang.',
        'Du erkennst dich in Rollen wie Retter, Perfektionistin oder Überlebende wieder.',
        'Du möchtest Erschöpfung vermeiden und mit mehr Freude arbeiten.',
      ],
      results: [
        'Du erkennst, wie alte Rollen deine heutigen Entscheidungen beeinflussen.',
        'Du suchst passendere Wege zu handeln.',
        'Du findest eine Richtung für deinen nächsten Lebensabschnitt.',
      ],
    },
    note: 'Alla leitet zwei Spiele: „Sex, Geld und Liebe“ und „Divergent“.',
  },
];

export const tiGames: Record<Language, TiGamesContent> = {
  ru: {
    eyebrow: 'Мероприятия · Трансформационные игры',
    datePill: '7 ноября · Мюнхен',
    title: ['День', 'трансформационных', 'игр в Мюнхене'],
    intro:
      'Познакомьтесь с ведущими и участниками, выберите игры для двух игровых линеек и проведите день в хорошей компании.',
    heroHighlights: [
      '10:10 · Модерируемый нетворкинг',
      '11:45 и 15:30 · 1-я и 2-я игровые линейки',
      'Чай и кофе включены в оба билета',
    ],
    when: 'Когда',
    where: 'Где',
    date: '7 ноября 2026',
    arrival: `Регистрация с ${registrationTime} · начало в ${openingTime}`,
    venue: 'Мюнхен',
    address: 'Perchtinger Straße 12 · 81379 München',
    chooseTicket: 'Выберите билет участника',
    basicTicket: 'Базовый импульс',
    peakTicket: 'Пик трансформации',
    basicIncludes: 'Игры, общие зоны, напитки и фото',
    peakIncludes: 'Всё выше + Zoom, фото, ужин и консультация',
    buyTicket: 'Купить билет участника',
    host: 'Хочу провести игру',
    ticketNote: 'Состав билетов: ниже на странице',
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
    gameLabel: 'Игра',
    factsLabel: 'О ведущей',
    fitLabel: 'Подойдёт, если',
    resultsLabel: 'Что можно получить от игры',
    otherPractitioners: 'Другие ведущие',
    allPractitioners: 'Все игропрактики',
    close: 'Закрыть описание игропрактика',
    ticketsEyebrow: 'Билеты',
    ticketsTitle: 'Что входит в участие',
    tickets: [
      {
        key: 'guest',
        name: 'Базовый импульс',
        price: '€80',
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
        price: '€180',
        includes: [
          'Всё из «Базового импульса»',
          'Групповой Zoom и профессиональные фото',
          'Закрытый чат, ужин с ведущими',
          'Приоритет места и консультация 15–20 минут',
        ],
      },
    ],
    questionsTitle: 'Есть вопросы перед встречей?',
    questionsBody: 'Напишите нам: поможем выбрать формат участия.',
    contactLink: 'Связаться с нами →',
  },
  de: {
    eyebrow: 'Veranstaltungen · Transformationsspiele',
    datePill: '7. November · München',
    title: ['Tag der', 'Transformationsspiele', 'in München'],
    intro:
      'Lerne die Spielleitenden und andere Teilnehmende kennen, wähle Spiele aus zwei Spielrunden und verbringe den Tag in guter Gesellschaft.',
    heroHighlights: [
      '10:10 · Moderiertes Networking',
      '11:45 und 15:30 · 1. und 2. Spielrunde',
      'Tee und Kaffee in beiden Tickets enthalten',
    ],
    when: 'Wann',
    where: 'Wo',
    date: '7. November 2026',
    arrival: `Anmeldung ab ${registrationTime} · Beginn um ${openingTime}`,
    venue: 'München',
    address: 'Perchtinger Straße 12 · 81379 München',
    chooseTicket: 'Wähle dein Ticket',
    basicTicket: 'Basisimpuls',
    peakTicket: 'Gipfel der Transformation',
    basicIncludes: 'Spiele, Gemeinschaftsbereiche, Getränke und Foto',
    peakIncludes: 'Alles oben + Zoom, Fotos, Abendessen und Beratung',
    buyTicket: 'Ticket für Teilnehmende kaufen',
    host: 'Ich möchte ein Spiel leiten',
    ticketNote: 'Ticketinhalt: weiter unten auf der Seite',
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
    gameLabel: 'Spiel',
    factsLabel: 'Über die Spielleiterin',
    fitLabel: 'Passt, wenn',
    resultsLabel: 'Was du aus dem Spiel mitnehmen kannst',
    otherPractitioners: 'Weitere Spielleitende',
    allPractitioners: 'Alle Spielleitenden',
    close: 'Beschreibung schließen',
    ticketsEyebrow: 'Tickets',
    ticketsTitle: 'Was in der Teilnahme enthalten ist',
    tickets: [
      {
        key: 'guest',
        name: 'Basisimpuls',
        price: '€80',
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
        price: '€180',
        includes: [
          'Alles aus „Basisimpuls“',
          'Gruppen-Zoom und professionelle Fotos',
          'Geschlossener Chat, Abendessen mit Spielleitenden',
          'Bevorzugter Platz und Beratung 15–20 Minuten',
        ],
      },
    ],
    questionsTitle: 'Noch Fragen vor der Veranstaltung?',
    questionsBody: 'Schreib uns: wir helfen bei der Wahl des Formats.',
    contactLink: 'Kontakt aufnehmen →',
  },
};
