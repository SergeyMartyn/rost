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
  scopeNote: string;
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
    qualification: 'Ведущая игры AinSof',
    game: 'AinSof',
    tagline: 'Игровое обсуждение личных вопросов',
    body: 'Игра с вопросами и заданиями на выбранную участником тему. Ведущая объясняет правила, участники обсуждают игровые ситуации и делятся наблюдениями.',
    facts: [
      'Проводит игру AinSof на встрече R.O.S.T.',
      'Объясняет правила и сопровождает игровое обсуждение.',
    ],
    fit: [
      'Личные решения и возможные варианты действий.',
      'Разные взгляды на выбранную ситуацию.',
      'Обсуждение целей в игровом формате.',
    ],
    results: [
      'Знакомство с правилами и выбор темы для обсуждения.',
      'Выполнение игровых заданий.',
      'Обсуждение решений и наблюдений в группе.',
    ],
    note: 'Вы сами выбираете, какую тему и в каком объёме обсуждать с группой.',
  },
  {
    id: 'katharina',
    image: '/images/ti-games/katharina.webp',
    name: 'Катарина Базаль',
    qualification: 'Ведущая игры с ароматами',
    game: 'Вопрос в эфире. Круг трансформаций',
    tagline: 'Ароматы, ассоциации и вопросы для обсуждения',
    body: 'Игра с ароматами и вопросами на выбранную тему. Участники могут делиться возникающими ассоциациями и обсуждать разные точки зрения.',
    facts: [
      'Использует ароматы как часть игровых заданий.',
      'Объясняет правила и ведёт обсуждение в группе.',
    ],
    fit: [
      'Ассоциации, связанные с ароматами.',
      'Личные наблюдения и воспоминания.',
      'Обсуждение выбранного вопроса в игровом формате.',
    ],
    results: [
      'Знакомство с правилами игры.',
      'Задания с ароматами и вопросы для обсуждения.',
      'Добровольный обмен ассоциациями и наблюдениями.',
    ],
    note: 'Ароматы используются в игровом формате. Игра не предназначена для диагностики или лечения.',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Зинаида Ланглитц',
    qualification: 'Ведущая игры о самооценке и личных решениях',
    game: 'Путь к себе: волшебство самооценки',
    tagline: 'Разговор о самооценке, желаниях и решениях',
    body: 'Игра с вопросами о самооценке, личных желаниях и решениях. В группе можно обсуждать предложенные игровые ситуации и разные точки зрения.',
    facts: [
      'Проводит игру «Путь к себе: волшебство самооценки».',
      'Объясняет задания и сопровождает обсуждение.',
    ],
    fit: [
      'Самооценка как тема для разговора.',
      'Личные желания и повседневные решения.',
      'Разные взгляды на предложенные игровые ситуации.',
    ],
    results: [
      'Знакомство с правилами и выбор темы.',
      'Игровые вопросы и обсуждение примеров.',
      'Добровольный обмен мыслями с участниками.',
    ],
    note: 'Обсуждайте только те темы, которыми вам комфортно делиться.',
  },
  {
    id: 'alla',
    image: '/images/ti-games/alla.webp',
    name: 'Алла Афанасенко',
    qualification: 'Ведущая игр «Секс, Деньги и Любовь» и «Дивергент»',
    game: 'Секс, Деньги и Любовь · Дивергент',
    tagline: 'Обсуждение отношений, ролей и жизненных перемен',
    body: 'Две игры о взаимоотношениях, привычных ролях и жизненных переменах. Участники обсуждают игровые ситуации без обещания определённого личного или финансового результата.',
    facts: [
      'На встрече представлены две игры: «Секс, Деньги и Любовь» и «Дивергент».',
      'Формат включает игровые задания и обсуждение в группе.',
    ],
    fit: [
      'Взаимоотношения и повседневное общение.',
      'Личные взгляды на деньги и привычные роли.',
      'Обсуждение предложенных игровых ситуаций.',
    ],
    results: [
      'Знакомство с правилами игры.',
      'Вопросы и задания на темы отношений и личных решений.',
      'Добровольное обсуждение наблюдений с группой.',
    ],
    otherGame: {
      name: 'Дивергент',
      fit: [
        'Привычные роли в повседневных ситуациях.',
        'Жизненные перемены как тема для обсуждения.',
        'Разные варианты действий в игровых примерах.',
      ],
      results: [
        'Знакомство с правилами и игровыми заданиями.',
        'Обсуждение ролей на примерах предложенных ситуаций.',
        'Обмен мнениями о возможных вариантах действий.',
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
    qualification: 'Spielleiterin für AinSof',
    game: 'AinSof',
    tagline: 'Spielerischer Austausch über persönliche Fragen',
    body: 'Ein Spiel mit Fragen und Aufgaben zu einem selbst gewählten Thema. Die Spielleiterin erklärt die Regeln; die Teilnehmenden besprechen Spielsituationen und teilen ihre Beobachtungen.',
    facts: [
      'Leitet AinSof beim R.O.S.T.-Treffen.',
      'Erklärt die Regeln und begleitet den Austausch.',
    ],
    fit: [
      'Persönliche Entscheidungen und mögliche Handlungsweisen.',
      'Unterschiedliche Sichtweisen auf eine gewählte Situation.',
      'Austausch über Ziele im Rahmen des Spiels.',
    ],
    results: [
      'Einführung in die Regeln und Auswahl eines Gesprächsthemas.',
      'Gemeinsame Spielaufgaben.',
      'Austausch über Entscheidungen und Beobachtungen in der Gruppe.',
    ],
    note: 'Du entscheidest selbst, welches Thema du mit der Gruppe teilen möchtest und wie ausführlich.',
  },
  {
    id: 'katharina',
    image: '/images/ti-games/katharina.webp',
    name: 'Katharina Basal',
    qualification: 'Leiterin eines Spiels mit Düften',
    game: 'Frage im Äther. Kreis der Transformationen',
    tagline: 'Düfte, Assoziationen und Gesprächsfragen',
    body: 'Ein Spiel mit Düften und Fragen zu einem selbst gewählten Thema. Teilnehmende können ihre Assoziationen teilen und unterschiedliche Sichtweisen besprechen.',
    facts: [
      'Setzt Düfte als Bestandteil der Spielaufgaben ein.',
      'Erklärt die Regeln und moderiert den Austausch.',
    ],
    fit: [
      'Assoziationen zu unterschiedlichen Düften.',
      'Persönliche Beobachtungen und Erinnerungen.',
      'Spielerischer Austausch über eine gewählte Frage.',
    ],
    results: [
      'Einführung in die Spielregeln.',
      'Aufgaben mit Düften und Gesprächsfragen.',
      'Freiwilliger Austausch über Assoziationen und Beobachtungen.',
    ],
    note: 'Die Düfte werden im Rahmen des Spiels verwendet. Das Spiel dient weder der Diagnostik noch der Behandlung.',
  },
  {
    id: 'zinaida',
    image: '/images/ti-games/zinaida.webp',
    name: 'Sinaida Langlitz',
    qualification:
      'Leiterin eines Spiels über Selbstwert und persönliche Entscheidungen',
    game: 'Der Weg zu sich selbst: die Magie des Selbstwerts',
    tagline: 'Gespräche über Selbstwert, Wünsche und Entscheidungen',
    body: 'Ein Spiel mit Fragen zu Selbstwert, persönlichen Wünschen und Entscheidungen. In der Gruppe können vorgegebene Spielsituationen und unterschiedliche Sichtweisen besprochen werden.',
    facts: [
      'Leitet „Der Weg zu sich selbst: die Magie des Selbstwerts“.',
      'Erklärt die Aufgaben und begleitet die Gespräche.',
    ],
    fit: [
      'Selbstwert als Gesprächsthema.',
      'Persönliche Wünsche und Entscheidungen im Alltag.',
      'Verschiedene Sichtweisen auf die Spielsituationen.',
    ],
    results: [
      'Einführung in die Regeln und Auswahl eines Themas.',
      'Spielfragen und gemeinsame Besprechung von Beispielen.',
      'Freiwilliger Gedankenaustausch mit anderen Teilnehmenden.',
    ],
    note: 'Teile nur die Themen, über die du in der Gruppe sprechen möchtest.',
  },
  {
    id: 'alla',
    image: '/images/ti-games/alla.webp',
    name: 'Alla Afanasenko',
    qualification: 'Leiterin der Spiele „Sex, Geld und Liebe“ und „Divergent“',
    game: 'Sex, Geld und Liebe · Divergent',
    tagline: 'Austausch über Beziehungen, Rollen und Veränderungen',
    body: 'Zwei Spiele über Beziehungen, gewohnte Rollen und Veränderungen im Leben. Die Teilnehmenden besprechen Spielsituationen; ein bestimmtes persönliches oder finanzielles Ergebnis wird nicht versprochen.',
    facts: [
      'Bietet beim Treffen „Sex, Geld und Liebe“ und „Divergent“ an.',
      'Das Format umfasst Spielaufgaben und Gespräche in der Gruppe.',
    ],
    fit: [
      'Beziehungen und Kommunikation im Alltag.',
      'Persönliche Sichtweisen auf Geld und gewohnte Rollen.',
      'Austausch über vorgegebene Spielsituationen.',
    ],
    results: [
      'Einführung in die Spielregeln.',
      'Fragen und Aufgaben zu Beziehungen und persönlichen Entscheidungen.',
      'Freiwilliger Austausch über Beobachtungen.',
    ],
    otherGame: {
      name: 'Divergent',
      fit: [
        'Gewohnte Rollen in Alltagssituationen.',
        'Veränderungen im Leben als Gesprächsthema.',
        'Unterschiedliche Handlungsweisen in Spielbeispielen.',
      ],
      results: [
        'Einführung in Regeln und Spielaufgaben.',
        'Gespräche über Rollen anhand vorgegebener Situationen.',
        'Austausch über mögliche Handlungsweisen.',
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
      'В программе знакомство с ведущими и участниками, игровые задания и обсуждения в небольших группах.',
    scopeNote:
      'Встреча посвящена знакомству, общению и игровому обсуждению личных тем. Это не медицинская консультация и не психотерапия. Конкретный личный или финансовый результат не обещается.',
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
    factsLabel: 'О формате',
    fitLabel: 'Темы и вопросы',
    resultsLabel: 'Как проходит игра',
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
          'Приоритет места и консультация ведущего игр 15–20 минут',
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
      'Auf dem Programm stehen das Kennenlernen der Spielleitenden und Teilnehmenden, Spielaufgaben und Gespräche in kleinen Gruppen.',
    scopeNote:
      'Das Treffen dient dem Kennenlernen, dem Austausch und der spielerischen Beschäftigung mit persönlichen Themen. Es ist keine medizinische Beratung oder Psychotherapie. Ein bestimmter persönlicher oder finanzieller Erfolg wird nicht versprochen.',
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
    factsLabel: 'Zum Format',
    fitLabel: 'Themen und Fragen',
    resultsLabel: 'Ablauf im Spiel',
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
          'Bevorzugter Platz und Beratung durch die Spielleitung, 15–20 Minuten',
        ],
      },
    ],
    questionsTitle: 'Noch Fragen vor der Veranstaltung?',
    questionsBody: 'Schreib uns: wir helfen bei der Wahl des Formats.',
    contactLink: 'Kontakt aufnehmen →',
  },
};
