# Consent Banner 2 — переменные проекта

Версия шаблона: 2.1
Дата: 29 сентября 2026 года
Парный документ: `Consent Banner 1.md` — постоянные требования (ссылки вида R-7.4)

---

## Как заполнять

1. Документ заполняется перед созданием баннера для каждого проекта: копия файла на проект.
2. У каждого пункта есть вопрос, варианты, значение по умолчанию и ссылка на требования документа 1, на которые пункт влияет.
3. Ответ пишется **жирным** в строке «Ответ». Если ответа пока нет — **уточнить**. Если вопрос к проекту не относится — **не применяется**.
4. Ниже ответы заполнены образцом по проекту margaritamartyn.de (состояние на сентябрь 2026 года). Для нового проекта образец заменяется.
5. Сервисы выбираются из каталога (часть II). Ответ на пункт с пометкой [стандарт] в документе 1, отличающийся от значения по умолчанию, записывается также в пункт 45. Если сервиса в каталоге нет, сначала добавить в каталог карточку по тому же шаблону.
6. Тексты баннера, facade и Datenschutzerklärung берутся из частей III и IV. Места для подстановки отмечены `[в квадратных скобках]`.
7. После заполнения части I собирается итоговая сводка (часть V). По ней делается реализация.

---

# Часть I. Вопросы

## A. Проект и владелец

**1. Домен(ы) сайта**
- Что указать: рабочий домен; тестовые и дополнительные домены, если есть.
- Влияет на: R-10.7 (выбор хранится отдельно для каждого домена), настройки cookie, сетевой аудит.
- Ответ: **margaritamartyn.de** (рабочий); тестовый — **адрес Cloudflare Workers, закрыт Basic Auth**.

**2. Ответственный за сайт (Verantwortlicher)**
- Что указать: имя/название, адрес, email, телефон — как в Impressum.
- Влияет на: R-6.2, текст баннера, Datenschutzerklärung.
- Ответ: **Margarita Martyn, Tulpenstraße 3A, 92442 Wackersdorf, Deutschland; mail@margaritamartyn.com; +49 9431 395 16 22**

**3. Языки и язык по умолчанию**
- Варианты: список локалей; какая основная.
- По умолчанию: DE основной, RU второй.
- Влияет на: R-12.8, R-13.1, R-13.5, число переводов в части III.
- Ответ: **de (основной, x-default), ru**

**4. Адреса Impressum и Datenschutzerklärung на каждом языке**
- Влияет на: R-6.2, R-6.6, ссылки в баннере и facade.
- Ответ: **DE: /de/impressum, /de/datenschutzerklaerung; RU: /ru/pravovaya-informatsiya, /ru/politika-konfidentsialnosti**

**5. Чувствительная тематика сайта**
- Вопрос: связан ли сайт со здоровьем, психологией, терапией, медициной, верой, сексуальностью или другими особыми категориями данных (Art. 9 DSGVO)?
- Варианты: да / нет.
- По умолчанию: да для практик в сфере здоровья и психологии.
- Влияет на: R-7.12, R-7.13, выбор событий (пункт 21), запрет записи сессий.
- Ответ: **да — психологическое консультирование; тематические страницы по темам обращения**

**6. Тематические страницы, URL которых раскрывает тему обращения**
- Что указать: какие пути обезличиваются и чем заменяются. Заполняется, если в пункте 5 «да».
- Влияет на: R-7.12, R-7.13.
- Ответ: **все 8 страниц под /de/womit-ich-helfe/… и /ru/chem-ya-pomogayu/…; в dataLayer передаются `topic_bucket` (`topic-1` … `topic-8` / `not_a_topic_page`) и `safe_page_location` вместо реального URL**

## B. Техническая основа

**7. Фреймворк и сборка**
- Варианты: Astro (статическая сборка) / Next.js (static export) / другое.
- По умолчанию: Astro + TypeScript + Tailwind v4.
- Влияет на: R-15.2 (место инициализации, facade-компоненты).
- Ответ: **Next.js 16 (App Router, static export) + Tailwind v4 + next-intl** (переход шаблона на Astro планируется для новых проектов)

**8. Хостинг**
- Варианты: Cloudflare Workers / Cloudflare Pages / другой.
- По умолчанию: Cloudflare Workers со статикой.
- Влияет на: R-7.11, раздел Datenschutzerklärung о хостинге, строго необходимые cookies хостинга.
- Ответ: **Cloudflare Workers with Static Assets**

**9. Функции хостинга, которые влияют на баннер**
- Что указать по Cloudflare: Web Analytics (скрипт в браузере), Zaraz, Bot Fight Mode / Bot Management, Turnstile, Rocket Loader, Email Obfuscation.
- По умолчанию: Web Analytics — выключен; Zaraz — выключен; защита от ботов — по необходимости (строго необходимое, описать в Datenschutzerklärung); Rocket Loader — выключен (переупорядочивает скрипты и может нарушить блокировку).
- Влияет на: R-7.11, R-14.2.
- Ответ: **Web Analytics — выкл.; Zaraz — выкл.; защита от ботов — стандартная Cloudflare (cookie `__cf_bm` возможна); Turnstile — не используется; Rocket Loader — уточнить**

**10. Реализация менеджера согласия**
- Варианты: vanilla-cookieconsent v3 / собственный компонент / другая библиотека.
- По умолчанию: vanilla-cookieconsent v3.
- Влияет на: R-15.2, часть VI (эталонная конфигурация).
- Ответ: **собственный компонент (`CookieConsentBanner.tsx`, `TrackingConsentManager.tsx`, `cookieConsent.ts`), 28 браузерных тестов проходят**

**11. Место хранения выбора**
- Варианты: first-party cookie / localStorage.
- По умолчанию: first-party cookie (так работает vanilla-cookieconsent).
- Влияет на: R-10.2.
- Ответ: **localStorage (текущая реализация)**

**12. Серверное продление cookie выбора для Safari**
- Вопрос: выставлять ли cookie выбора ответом сервера собственного домена, чтобы Safari не стирал её через 7 дней?
- Варианты: да / нет.
- По умолчанию: нет.
- Влияет на: R-10.8.
- Ответ: **нет**

**13. Серверный журнал согласий**
- Варианты: да (нужен сервер/Worker и база) / нет.
- По умолчанию: нет.
- Влияет на: R-10.9.
- Ответ: **нет**

## C. Интерфейс баннера

**14. Формат первого уровня**
- Варианты: немодальная полоса внизу (bar) / немодальная карточка (box) / модальное окно.
- По умолчанию: немодальная полоса внизу.
- Влияет на: R-6.7, R-6.8, R-12.2, R-12.4.
- Ответ: **модальное окно (текущая реализация, сохранена по решению владельца)**

**15. Кнопка «×»**
- Варианты: нет / есть (= отказ).
- По умолчанию: нет.
- Влияет на: R-6.5.
- Ответ: **нет; `Escape` = отказ от необязательных**

**16. Дизайн-токены баннера**
- Что указать: фон, текст, основная кнопка, вторичная кнопка, границы, фокус, шрифт, радиус, тень. Обе кнопки первого уровня (принять/отклонить) получают один стиль (R-6.4).
- Влияет на: R-6.9, R-12.3.
- Ответ: **фон `#FAFAF8`; текст `#190D39`; приглушённый текст `#565656`; кнопки принятия и отказа — одинаковые, `#190D39` с текстом `#FAFAF8`; «Настройки» — тот же размер, вторичный стиль; фокус — 2px `#190D39` с отступом 3px; шрифт Public Sans; граница `--border` (контраст 1.21:1 — только декоративная, не единственный признак элемента)**

**17. Место постоянной ссылки «Cookie-Einstellungen» / «Настройки cookie»**
- Варианты: подвал / подвал + плавающая иконка.
- По умолчанию: подвал рядом с Impressum и Datenschutzerklärung.
- Влияет на: R-6.14.
- Ответ: **подвал**

**18. Срок действия выбора**
- Варианты: от 6 до 13 месяцев.
- По умолчанию: 12 месяцев.
- Влияет на: R-10.4.
- Ответ: **12 месяцев**

**19. Текущий номер версии конфигурации**
- Что указать: целое число; повышается по R-10.5. Вести историю изменений ниже.
- Влияет на: R-10.5, R-14.5.
- Ответ: **уточнить по коду (`consentVersion` в `cookieConsent.ts`)**
- История версий: **—**

## D. Сервисы, требующие согласия

**20. Tag Manager**
- Варианты: Google Tag Manager / нет (если нет ни статистики, ни маркетинга).
- По умолчанию: GTM, если есть хотя бы один сервис в пунктах 22–26.
- Влияет на: R-3.4, R-7.7–R-7.10. Карточка каталога: II.1.
- Ответ: **GTM, контейнер `GTM-TFDHTN7M`**

**21. События, которые отправляются в dataLayer**
- Что указать: название события, когда срабатывает, в какие сервисы уходит, разрешено ли при чувствительной тематике.
- Влияет на: R-7.9, R-7.12, R-8.4.
- Ответ:
  - **`consent_statistics_granted` — разрешение категории «Статистика» → GA4**
  - **`consent_marketing_granted` — разрешение категории «Маркетинг» → Meta Pixel**
  - **`virtual_page_view` — смена маршрута внутри сайта, с `safe_page_location` и `page_title` → GA4**
  - **клик по Calendly, `tel:`, `mailto:` (`email_click`), скачивание PDF (`guide_download`) → GA4; в Meta — только обезличенные конверсии без названия темы (уточнить состав)**

**22. Google Analytics 4**
- Варианты: да (ID) / нет.
- Влияет на: категория «Статистика». Карточка II.2.
- Ответ: **да, `G-03L7NPHX2D`**
- Настройки аккаунта (карточка II.2): срок хранения данных — **уточнить (рекомендуется 2 месяца)**; Google Signals — **уточнить (рекомендуется выкл.)**; связь с Google Ads — **нет**

**23. Meta Pixel**
- Варианты: да (ID) / нет.
- Влияет на: категория «Маркетинг», R-7.3, R-14.4. Карточка II.3.
- Ответ: **да, `835942628995971`; Advanced Matching — выкл.; Controller Addendum в Meta Business — уточнить**

**24. Google Ads (конверсии, ремаркетинг)**
- Варианты: да (ID конверсии) / нет. Карточка II.4.
- Ответ: **нет**

**25. Другие рекламные пиксели**
- Варианты: TikTok Pixel / LinkedIn Insight Tag / Pinterest Tag / нет. Карточки II.5, II.6.
- Ответ: **нет**

**26. Поведенческая аналитика и запись сессий**
- Варианты: Microsoft Clarity / Hotjar / нет. При пункте 5 «да» — только с исключением тематических страниц и форм (R-7.12). Карточка II.7.
- Ответ: **нет**

**27. Server-side tracking**
- Варианты: server-side GTM / Meta Conversions API / нет. Не отменяет согласия: сервер отправляет данные, только если посетитель дал согласие в соответствующей категории. Карточка II.8.
- Ответ: **нет**

**28. Путь «без баннера»**
- Вопрос: планируется ли сайт без рекламы и без согласий (R-4.2, R-4.3)?
- Варианты: нет / да, только серверная статистика хостинга / да, аналитика без cookies после юридической проверки.
- По умолчанию: нет, если есть реклама.
- Ответ: **нет — используется Meta Pixel**

## E. Внешний контент и ресурсы

Для каждого пункта выбирается вариант из R-9.1: **A** — ссылка, **B** — click-to-load facade, **C** — категория «Внешние медиа», **D** — прямое встраивание (запрещено).

**29. YouTube**
- По умолчанию: B. Карточка II.9.
- Ответ: **B — `VideoFacade`, `youtube-nocookie.com`, локальный постер; ссылки на каналы — A**

**30. Google Maps**
- По умолчанию: B либо A (адрес + ссылка). Карточка II.10.
- Ответ: **B — facade на странице «Контакты», превью — уточнить происхождение (собственная схема/фото или скриншот с полной атрибуцией)**

**31. Запись на приём**
- Варианты сервиса: Calendly, страница записи Google Calendar, Cal.com, Microsoft Bookings, Doctolib, другое.
- Варианты встраивания: A (ссылка в новой вкладке) / B / C.
- По умолчанию: A. Карточки II.11, II.18.
- Ответ: **Calendly, A — ссылка `https://calendly.com/mail-margaritamartyn/30min` с UTM**

**32. Оплата**
- Варианты сервиса: Stripe (Payment Links / Checkout / встроенная форма), PayPal (ссылка / кнопки на сайте), SumUp, Klarna; платформы продажи курсов и консультаций (Digistore24, CopeCart, Ablefy); банковский перевод.
- Варианты встраивания: A — переход на страницу провайдера / встроенные кнопки или форма только на шаге оплаты (R-9.8).
- По умолчанию: A.
- Влияет на: R-9.8, Datenschutzerklärung. Карточки II.19–II.21.
- Ответ: **банковский перевод (SEPA) и PayPal — вне сайта, после консультации; на сайте оплаты нет**

**33. Мессенджеры и чаты**
- Варианты: ссылки WhatsApp (`wa.me`) и Telegram (`t.me`) — A / виджет мессенджера (WhatsApp-кнопка стороннего сервиса, Telegram-виджет) / чат на сайте (Tawk.to, Crisp, Tidio, Intercom, AI-чат-бот).
- По умолчанию: только ссылки (A); виджеты и чаты — B (загрузка по клику на кнопку чата).
- Влияет на: R-9.1, R-9.2. Карточка II.22.
- Ответ: **только ссылки: WhatsApp, Telegram**

**34. Рассылка и формы подписки**
- Варианты: нет / форма Brevo, Mailchimp, MailerLite и т. п. (встроенный скрипт) / собственная форма с отправкой на сервер.
- По умолчанию: собственная форма без скриптов провайдера; подписка с Double-Opt-In.
- Влияет на: R-9.1, Datenschutzerklärung. Карточка II.23.
- Ответ: **нет**

**35. Анкеты и сложные формы**
- Варианты: нет / Typeform, Google Forms, Jotform, Tally (встраивание или ссылка) / собственная форма.
- При пункте 5 «да»: сведения о здоровье через внешние формы не собираются без отдельной оценки (Art. 9 DSGVO).
- Карточка II.24.
- Ответ: **нет**

**36. Отзывы и рейтинги**
- Варианты: нет / виджет ProvenExpert, Trustpilot, Google-отзывы через Elfsight и т. п. / отзывы как собственный текст со ссылкой на источник.
- По умолчанию: собственный текст со ссылкой (реальные отзывы, с согласия авторов).
- Карточка II.25.
- Ответ: **нет**

**37. Другие встраивания**
- Варианты: Vimeo, посты Instagram/Facebook, лента Instagram (виджеты Elfsight, Behold, SnapWidget), Spotify/подкасты, SoundCloud, Google Business Profile. Карточки II.12, II.13.
- Ответ: **нет; Instagram, LinkedIn, YouTube — только обычные ссылки (A)**

**38. Шрифты и внешние библиотеки**
- Варианты шрифтов: локально с сайта / Google Fonts или Adobe Fonts с внешнего сервера (требует согласия — не использовать).
- Библиотеки JS/CSS: только из сборки сайта; публичные CDN не используются (R-7.1).
- По умолчанию: локально. Карточка II.14.
- Ответ: **шрифты локально: Literata, Public Sans; библиотеки — из сборки**

**39. Формы и защита от спама**
- Варианты: нет форм / форма + honeypot / форма + Cloudflare Turnstile / форма + Google reCAPTCHA (требует согласия — не использовать). Карточка II.15.
- Ответ: **форм нет (контакт через ссылки)**

**40. Сервисы для русскоязычной аудитории**
- Вопрос: планируются ли Яндекс Метрика, пиксель VK, виджеты VK или другие сервисы с передачей данных в Россию?
- По умолчанию: нет — не используются (R-9.9). Для рекламы на русскоязычную аудиторию в Германии — Meta и Google. Карточка II.26.
- Ответ: **нет**

**41. Категория «Внешние медиа»**
- Итог пунктов 29–37: нужна, только если хотя бы один ответ C (R-5.1). Внутри категории — переключатель на каждый сервис (R-9.4).
- Ответ: **не нужна**

## F. Юридическое

**42. Договоры с обработчиками**
- Что указать по каждому сервису: AVV/DPA принят (где и когда), SCC (если входят в DPA), Controller Addendum с Meta, сертификация в DPF на дату проверки.
- Влияет на: R-2.5, R-14.4, R-14.6.
- Ответ: **Cloudflare DPA — уточнить; Google Data Processing Terms (GA4/GTM) — уточнить; Meta Controller Addendum — уточнить; Calendly DPA — уточнить**

**43. Datenschutzerklärung**
- Что указать: дата «Stand», какие блоки части IV включены, кто и когда сверил их с фактической настройкой (R-14.6).
- Влияет на: R-14.1–R-14.6.
- Ответ: **Stand: август 2026; требуется обновление: добавить Meta Pixel, переписать YouTube и Google Maps под click-to-load, убрать «externe Medien» как категорию, добавить блок о хостинге/cookie Cloudflare — по части IV**

**44. Юридическая проверка перед запуском**
- Варианты: выполнена (кем, когда) / отложена владельцем (дата решения).
- Влияет на: R-16.3.
- Ответ: **уточнить**

**45. Отступления от документа 1**
- Что указать: номер требования с пометкой [стандарт], в чём отступление, причина, кто решил. Требования без пометки не отступаются.
- Ответ: **нет**

---

# Часть II. Каталог сервисов

Каждая карточка: провайдер, категория, домены (для проверки блокировки в сетевом журнале), cookies/storage (для удаления при отзыве), правила интеграции, блок Datenschutzerklärung (часть IV). Сроки cookies указаны по документации провайдеров на сентябрь 2026 года и перед запуском сверяются в DevTools.

### II.1. Google Tag Manager

- **Провайдер:** Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland; Google LLC (США) сертифицирована в DPF.
- **Категория:** загружается, если разрешена «Статистика» или «Маркетинг» (R-3.4, R-7.8).
- **Домены:** `www.googletagmanager.com`.
- **Cookies:** сам не ставит.
- **Правила:**
  - команда `consent default` передаётся до загрузки контейнера (R-7.5);
  - без блока `<noscript>` с iframe GTM (R-7.3);
  - каждый тег контейнера — триггер на событие своей категории + Additional consent checks (R-7.9);
  - в контейнере нет тегов «на всякий случай»; каждый опубликованный тег есть в баннере и Datenschutzerklärung (R-7.10);
  - перед публикацией — проверка в Tag Assistant (R-16.2).
- **Datenschutzerklärung:** блок IV.3.

### II.2. Google Analytics 4

- **Провайдер:** Google Ireland Limited (как II.1).
- **Категория:** Статистика.
- **Домены:** `www.googletagmanager.com/gtag/js`, `*.google-analytics.com`, `*.analytics.google.com`; при Google Signals — `stats.g.doubleclick.net`.
- **Cookies:** `_ga` (до 2 лет), `_ga_<ID>` (до 2 лет).
- **Правила:**
  - тег Google tag с ID потока; триггер `consent_statistics_granted`; проверка `analytics_storage`;
  - срок хранения данных в GA4 — минимальный (2 месяца), если нет причины для большего;
  - Google Signals и персонализация рекламы — выключены, особенно при чувствительной тематике;
  - при чувствительной тематике — `page_location` заменяется обезличенным значением (R-7.12);
  - при сайте с переходами без перезагрузки страницы — отдельное событие просмотра страницы.
- **Удаление при отзыве:** `/^_ga/`.
- **Datenschutzerklärung:** блок IV.4.

### II.3. Meta Pixel

- **Провайдер:** Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland; Meta Platforms, Inc. (США) сертифицирована в DPF. Совместная ответственность по Art. 26 DSGVO за сбор и передачу (EuGH Fashion ID) — принять Controller Addendum в Meta Business.
- **Категория:** Маркетинг.
- **Домены:** `connect.facebook.net`, `www.facebook.com/tr`.
- **Cookies:** `_fbp` (90 дней), `_fbc` (90 дней, при переходе по рекламе).
- **Правила:**
  - Custom HTML тег без `<noscript>`-картинки (R-7.3); триггер `consent_marketing_granted`; проверки `ad_storage`, `ad_user_data`, `ad_personalization`;
  - Advanced Matching (передача email/телефона) — выключен при чувствительной тематике (R-7.12);
  - стандартные события не содержат названий тем, симптомов, услуг при чувствительной тематике;
  - автоматические события пикселя (сбор кликов по кнопкам) проверить и при чувствительной тематике выключить в Events Manager.
- **Удаление при отзыве:** `_fbp`, `_fbc`.
- **Datenschutzerklärung:** блок IV.5.

### II.4. Google Ads (конверсии и ремаркетинг)

- **Провайдер:** Google Ireland Limited.
- **Категория:** Маркетинг.
- **Домены:** `www.googleadservices.com`, `googleads.g.doubleclick.net`, `www.google.com/pagead`.
- **Cookies:** `_gcl_au` (90 дней), `_gcl_aw` (90 дней).
- **Правила:** Conversion Linker и теги конверсий — только на событии «Маркетинг»; Enhanced Conversions — выключены при чувствительной тематике.
- **Удаление при отзыве:** `/^_gcl/`.
- **Datenschutzerklärung:** по шаблону IV.5 с данными Google.

### II.5. TikTok Pixel

- **Провайдер:** TikTok Technology Limited, 10 Earlsfort Terrace, Dublin, D02 T380, Irland.
- **Категория:** Маркетинг.
- **Домены:** `analytics.tiktok.com`.
- **Cookies:** `_ttp` (около 13 месяцев).
- **Правила:** как II.3; передача данных в страны вне ЕЭЗ (в т. ч. Китай) — отдельно описать и проверить юристом.

### II.6. LinkedIn Insight Tag

- **Провайдер:** LinkedIn Ireland Unlimited Company, Wilton Place, Dublin 2, Irland.
- **Категория:** Маркетинг.
- **Домены:** `snap.licdn.com`, `px.ads.linkedin.com`.
- **Cookies:** `li_fat_id`, `bcookie`, `lidc`, `UserMatchHistory`, `AnalyticsSyncHistory` (до 1 года, сверить).
- **Правила:** как II.3.

### II.7. Microsoft Clarity / Hotjar

- **Провайдер:** Microsoft Ireland Operations Limited (Clarity); Hotjar Ltd., Malta (Hotjar).
- **Категория:** Статистика.
- **Домены:** `*.clarity.ms` / `*.hotjar.com`, `*.hotjar.io`.
- **Cookies:** Clarity — `_clck` (1 год), `_clsk` (1 день); Hotjar — `_hjSessionUser_*`, `_hjSession_*`.
- **Правила:** Clarity в ЕЭЗ требует передачи сигнала согласия через свой Consent API; запись сессий маскирует все поля ввода; при чувствительной тематике — не используется на тематических страницах и формах (R-7.12).

### II.8. Server-side GTM / Meta Conversions API

- **Категория:** та же, что у сервиса, которому отправляются данные.
- **Правила:** серверные события отправляются, только если в запросе передан статус согласия соответствующей категории; сервер не заменяет баннер; в Datenschutzerklärung описывается серверная передача и сервер, через который она идёт.

### II.9. YouTube

- **Провайдер:** Google Ireland Limited.
- **Категория:** вариант B или C (R-9.1).
- **Домены:** `www.youtube-nocookie.com`, `www.youtube.com`, `i.ytimg.com`, `*.googlevideo.com`, `*.ggpht.com`, `static.doubleclick.net`, `play.google.com`.
- **Cookies/storage после загрузки:** localStorage и cookies YouTube (например, `yt-remote-*`, `VISITOR_INFO1_LIVE`, `YSC`) — возникают только после клика.
- **Правила:** адрес iframe `https://www.youtube-nocookie.com/embed/[ID]`; постер хранится локально, до клика нет запросов к `i.ytimg.com` (R-9.2); `autoplay=1` после клика, чтобы не требовался второй клик; iframe размонтируется при уходе со страницы.
- **Тексты:** III.4. **Datenschutzerklärung:** блок IV.6.

### II.10. Google Maps

- **Провайдер:** Google Ireland Limited.
- **Категория:** вариант A, B или C.
- **Домены:** `www.google.com/maps/embed`, `maps.googleapis.com`, `maps.gstatic.com`, `fonts.gstatic.com`, `khms*.googleapis.com`.
- **Правила:** превью — собственная схема или фото; скриншот Google Maps — только с полной атрибуцией по Google Geo Guidelines, без Street View (R-9.6); рядом всегда текстовый адрес и ссылка «In Google Maps öffnen» (вариант A как альтернатива).
- **Тексты:** III.4. **Datenschutzerklärung:** блок IV.7.

### II.11. Calendly (и аналогичные сервисы записи)

- **Провайдер:** Calendly LLC, 115 E Main St, Ste A1B, Buford, GA 30518, USA (сертификацию в DPF проверить на dataprivacyframework.gov).
- **Категория:** вариант A (ссылка) — согласие не нужно; встраивание — B или C.
- **Домены встраивания:** `calendly.com`, `assets.calendly.com`.
- **Cookies:** встраиваемый виджет ставит cookies Calendly, даже если собственный баннер Calendly скрыт.
- **Правила:** предпочтительно ссылка в новой вкладке с `rel="noopener noreferrer"`; при встраивании собственный баннер Calendly скрывается параметром `hide_gdpr_banner=1` только если виджет загружается после клика или согласия; в форме записи не запрашивать подробности о здоровье.
- **Datenschutzerklärung:** блок IV.8.

### II.12. Vimeo

- **Провайдер:** Vimeo.com, Inc., 330 West 34th Street, 5th Floor, New York, NY 10001, USA.
- **Категория:** вариант B или C.
- **Домены:** `player.vimeo.com`, `i.vimeocdn.com`, `f.vimeocdn.com`.
- **Правила:** параметр `dnt=1`; постер локально.

### II.13. Instagram / Facebook-посты, чат-виджеты, отзывы Google

- **Категория:** вариант A (ссылка) предпочтителен; встраивание — B или C.
- **Правила:** скрипты встраивания (`instagram.com/embed.js`, `connect.facebook.net/.../sdk.js`, скрипты чат-виджетов) до клика не загружаются; для отзывов предпочтительно показывать отзывы как собственный текст со ссылкой на источник (только реальные отзывы с согласия авторов).

### II.14. Шрифты

- **Правило:** шрифты хранятся на сайте (`@font-face` с собственного домена либо пакеты `@fontsource/*`, встраиваемые при сборке). Подключение `fonts.googleapis.com`, `fonts.gstatic.com`, `use.typekit.net` запрещено (LG München I, 2022; R-7.1).
- **Datenschutzerklärung:** блок IV.9.

### II.15. Защита форм

- **Honeypot** (скрытое поле) — без третьих сторон, согласие не нужно.
- **Cloudflare Turnstile** (`challenges.cloudflare.com`) — загружать только на странице с формой; описать в Datenschutzerklärung; правовое основание (строго необходимое или согласие) подтвердить юристом.
- **Google reCAPTCHA** — требует согласия; не использовать.

### II.16. Cloudflare (хостинг)

- **Провайдер:** Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA; сертифицирована в DPF.
- **Категория:** строго необходимое (доставка и защита сайта).
- **Cookies:** `__cf_bm` (30 минут, защита от ботов), `cf_clearance` (после проверки), `_cfuvid` (ограничение запросов) — появляются только при включённых функциях защиты.
- **Правила:** Web Analytics (скрипт `static.cloudflareinsights.com`) и Zaraz выключены (R-7.11); серверная статистика панели Cloudflare работает без согласия.
- **Datenschutzerklärung:** блок IV.2.

### II.17. Аналитика без cookies (только для пути «без баннера», пункт 28)

- Plausible Analytics (Plausible Insights OÜ, Эстония), Fathom, Matomo без cookies (собственный хостинг).
- Использовать без баннера только после юридической проверки (R-4.3). Иначе — в категории «Статистика».

---

### II.18. Другие сервисы записи

- **Google Calendar (страницы записи, Appointment Schedules):** Google Ireland Limited. Ссылка — A. Встраивание (iframe `calendar.google.com`) — B или C.
- **Cal.com:** Cal.com, Inc., США. Ссылка — A; встраивание (`app.cal.com`, `cal.com/embed`) — B или C.
- **Microsoft Bookings:** Microsoft Ireland Operations Limited. Ссылка — A; встраивание — B или C.
- **Doctolib:** Doctolib GmbH, Deutschland (для медицинских и терапевтических практик). Ссылка — A; виджет — B или C.
- **Правила для всех:** как II.11; в форме записи не запрашивать сведения о здоровье, если это не требуется для записи и не оценено по Art. 9 DSGVO.

### II.19. Stripe

- **Провайдер:** Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland; Stripe, Inc. (США) — проверить сертификацию в DPF.
- **Варианты:** Payment Link или Checkout на странице Stripe — A, на сайте ничего не загружается; встроенная форма (Stripe.js, `js.stripe.com`) — только на шаге оплаты (R-9.8).
- **Cookies при встраивании:** `__stripe_mid` (1 год), `__stripe_sid` (30 минут) — защита от мошенничества, строго необходимы для запрошенной оплаты.
- **Правила:** Stripe.js не подключать на всех страницах (Stripe рекомендует это для антифрода, но это противоречит R-7.1 и R-9.8); реквизиты карты вводятся только в поля Stripe.
- **Datenschutzerklärung:** блок IV.11.

### II.20. PayPal

- **Провайдер:** PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxembourg.
- **Варианты:** ссылка или PayPal.me — A; кнопки PayPal (JS SDK `www.paypal.com/sdk/js`) — только на шаге оплаты (R-9.8).
- **Cookies при встраивании:** cookies PayPal для входа и защиты от мошенничества — только после загрузки кнопок.
- **Datenschutzerklärung:** блок IV.11.

### II.21. Платформы продажи курсов и консультаций

- **Digistore24** (Digistore24 GmbH, Deutschland), **CopeCart** (CopeCart GmbH, Deutschland), **Ablefy** (ehem. elopage; Ablefy GmbH, Deutschland).
- **Варианты:** ссылка на страницу оформления — A (предпочтительно); встроенная форма оплаты или виджет — только на шаге оплаты (R-9.8).
- **Правила:** трекинговые пиксели партнёрских программ этих платформ на сайте — категория «Маркетинг»; платформа, как правило, действует как продавец или посредник — роль описывается в Datenschutzerklärung по её документам.

### II.22. Мессенджеры и чаты

- **Ссылки** `https://wa.me/[номер]`, `https://t.me/[имя]` — A, согласие не нужно. Иконки мессенджеров хранятся на сайте.
- **Виджеты мессенджеров** (сторонние WhatsApp-кнопки, `telegram.org/js/telegram-widget.js`) — B: загружаются по клику или заменяются ссылками.
- **Чаты на сайте** (Tawk.to, Crisp, Tidio, Intercom, AI-чат-боты): до клика — локальная кнопка чата без скрипта провайдера; клик загружает чат (B) с уведомлением по R-9.2. Провайдер получает содержимое переписки — при пункте 5 «да» предупредить не сообщать сведения о здоровье.
- **Datenschutzerklärung:** ссылки — блок IV.10; чат — отдельный блок по шаблону IV.6.

### II.23. Рассылка

- **Провайдеры:** Brevo (Sendinblue GmbH, Deutschland), MailerLite (MailerLite Limited, Irland), Mailchimp (The Rocket Science Group LLC, USA).
- **Правила:** предпочтительно собственная форма, отправляющая данные на сервер (Worker) или в API провайдера без встроенного скрипта; встроенный скрипт формы — B или C; Double-Opt-In обязателен; счётчики открытий и кликов в письмах описываются в Datenschutzerklärung (согласие на них даётся при подписке).

### II.24. Анкеты и внешние формы

- **Провайдеры:** Typeform (Typeform S.L., España), Google Forms (Google Ireland Limited), Jotform (Jotform Inc., USA; есть хранение в ЕС), Tally (Tally BV, Belgique).
- **Правила:** ссылка — A; встраивание — B или C; при чувствительной тематике — не собирать сведения о здоровье через внешние формы без отдельной оценки по Art. 9 DSGVO и без договора с провайдером.

### II.25. Виджеты отзывов

- **Провайдеры:** ProvenExpert (Expert Systems AG, Deutschland), Trustpilot (Trustpilot A/S, Danmark), Elfsight и аналоги для Google-отзывов.
- **Правила:** скрипт виджета — B или C; предпочтительно — отзывы как собственный текст с датой и ссылкой на источник; только реальные отзывы, без изменения смысла.

### II.26. Сервисы с передачей данных в Россию

- **Яндекс Метрика, пиксель VK (VK Ads), виджеты VK, Yandex Maps.**
- **Правило:** не используются (R-9.9): нет решения ЕС об адекватности для России и нет надёжных гарантий, а провайдер обязан передавать данные государственным органам по местному законодательству. Для русскоязычной аудитории в Германии используются Meta и Google.

---

# Часть III. Тексты баннера и facade

Подстановки: `[Verantwortlicher]` — пункт 2; `[Dienste Statistik]`, `[Dienste Marketing]` — названия сервисов из пунктов 22–26; `[Anbieter]` — провайдеры (например, «Google und Meta»). Фраза о США включается, если хотя бы один провайдер передаёт данные в США.

### III.1. Первый уровень

**DE**

- Заголовок: `Datenschutz-Einstellungen`
- Текст: `Wir möchten auf dieser Website optionale Dienste für Statistik ([Dienste Statistik]) und Marketing ([Dienste Marketing]) einsetzen. Sie werden erst aktiviert, wenn Sie zustimmen – ohne Zustimmung funktioniert die Website vollständig. Dabei können Daten wie Ihre IP-Adresse und Geräteinformationen an [Anbieter] übermittelt und auch in den USA verarbeitet werden. Ihre Auswahl können Sie jederzeit unter „Cookie-Einstellungen“ ändern oder widerrufen.`
- Кнопки: `Alle akzeptieren` · `Nur notwendige` · `Einstellungen`
- Подвал: `Verantwortlich: [Verantwortlicher] · Datenschutzerklärung · Impressum`

**RU**

- Заголовок: `Настройки конфиденциальности`
- Текст: `Мы хотели бы использовать на этом сайте дополнительные сервисы для статистики ([Dienste Statistik]) и маркетинга ([Dienste Marketing]). Они включаются только с вашего согласия — без него сайт работает полностью. При этом данные, например IP-адрес и сведения об устройстве, могут передаваться [Anbieter] и обрабатываться в том числе в США. Выбор можно в любой момент изменить или отозвать в «Настройках cookie».`
- Кнопки: `Принять все` · `Только необходимые` · `Настройки`
- Подвал: `Ответственный: [Verantwortlicher] · Политика конфиденциальности · Правовая информация`

### III.2. Второй уровень

**DE**

- Заголовок: `Cookie-Einstellungen`
- Вступление: `Hier entscheiden Sie, welche optionalen Dienste wir verwenden dürfen. Notwendige Funktionen sind immer aktiv. Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Details finden Sie in der Datenschutzerklärung.`
- Кнопки: `Auswahl speichern` · `Alle akzeptieren` · `Alle ablehnen`
- Категории:
  - `Notwendig` (immer aktiv) — `Erforderlich für den Betrieb und die Sicherheit der Website sowie zum Speichern Ihrer Auswahl in diesem Fenster.`
  - `Statistik` — `Hilft uns zu verstehen, wie die Website genutzt wird, z. B. welche Seiten aufgerufen werden. Dienst: [Dienste Statistik].`
  - `Marketing` — `Misst den Erfolg unserer Anzeigen und ermöglicht es, Ihnen auf anderen Plattformen passende Anzeigen zu zeigen. Dienst: [Dienste Marketing].`
  - `Externe Medien` (только при варианте C) — `Lädt Inhalte externer Anbieter wie Videos oder Karten automatisch. Dienste: [Dienste Medien].`
- Строка сервиса: `[Dienst] · Anbieter: [Anbieter, Adresse] · Zweck: [Zweck] · Cookies: [Namen, Laufzeit] · Übermittlung in die USA: ja, Grundlage EU-US Data Privacy Framework · Datenschutzhinweise des Anbieters: [Link]`

**RU**

- Заголовок: `Настройки cookie`
- Вступление: `Здесь вы решаете, какие дополнительные сервисы мы можем использовать. Необходимые функции всегда активны. Согласие можно в любой момент отозвать на будущее. Подробности — в политике конфиденциальности.`
- Кнопки: `Сохранить выбор` · `Принять все` · `Отклонить все`
- Категории:
  - `Необходимые` (всегда активны) — `Нужны для работы и безопасности сайта, а также для сохранения вашего выбора в этом окне.`
  - `Статистика` — `Помогает понять, как используется сайт, например какие страницы открывают. Сервис: [Dienste Statistik].`
  - `Маркетинг` — `Измеряет эффективность нашей рекламы и позволяет показывать вам подходящую рекламу на других платформах. Сервис: [Dienste Marketing].`
  - `Внешние медиа` (только при варианте C) — `Автоматически загружает содержимое внешних провайдеров, например видео или карты. Сервисы: [Dienste Medien].`
- Строка сервиса: `[Сервис] · Провайдер: [провайдер, адрес] · Цель: [цель] · Cookies: [названия, срок] · Передача в США: да, основание — EU-US Data Privacy Framework · Политика провайдера: [ссылка]`

### III.3. Ссылка на настройки

- DE: `Cookie-Einstellungen`
- RU: `Настройки cookie`

### III.4. Facade (вариант B)

**YouTube**

- DE: `Hier wird ein Video von YouTube (Google Ireland Limited) eingebettet. Beim Laden werden Daten, u. a. Ihre IP-Adresse, an Google übermittelt und ggf. in den USA verarbeitet. Mehr in der Datenschutzerklärung.` Кнопка: `YouTube-Video laden`. Ссылка: `Auf YouTube ansehen`.
- RU: `Здесь встроено видео YouTube (Google Ireland Limited). При загрузке данные, в том числе IP-адрес, передаются Google и могут обрабатываться в США. Подробнее — в политике конфиденциальности.` Кнопка: `Загрузить видео YouTube`. Ссылка: `Смотреть на YouTube`.

**Google Maps**

- DE: `Hier wird eine interaktive Karte von Google Maps (Google Ireland Limited) eingebettet. Beim Laden werden Daten, u. a. Ihre IP-Adresse, an Google übermittelt und ggf. in den USA verarbeitet. Mehr in der Datenschutzerklärung.` Кнопка: `Karte laden`. Ссылка: `In Google Maps öffnen`.
- RU: `Здесь встроена интерактивная карта Google Maps (Google Ireland Limited). При загрузке данные, в том числе IP-адрес, передаются Google и могут обрабатываться в США. Подробнее — в политике конфиденциальности.` Кнопка: `Загрузить карту`. Ссылка: `Открыть в Google Maps`.

**Calendly (если встраивается)**

- DE: `Hier wird die Terminbuchung von Calendly (Calendly LLC, USA) eingebettet. Beim Laden werden Daten, u. a. Ihre IP-Adresse, an Calendly übermittelt und in den USA verarbeitet. Mehr in der Datenschutzerklärung.` Кнопка: `Terminbuchung laden`. Ссылка: `Termin auf Calendly buchen`.
- RU: `Здесь встроена запись через Calendly (Calendly LLC, США). При загрузке данные, в том числе IP-адрес, передаются Calendly и обрабатываются в США. Подробнее — в политике конфиденциальности.` Кнопка: `Загрузить запись`. Ссылка: `Записаться в Calendly`.

**Вариант C — кнопки facade** (R-9.4: «всегда» разрешает только этот сервис)

- DE: `Einmal laden` · `[Dienst] immer erlauben` (например, `YouTube immer erlauben`)
- RU: `Загрузить один раз` · `Всегда разрешать [сервис]` (например, `Всегда разрешать YouTube`)
- Подсказка под кнопками — DE: `Ihre Auswahl gilt nur für [Dienst] und kann jederzeit in den Cookie-Einstellungen geändert werden.` RU: `Выбор относится только к [сервис] и меняется в любой момент в «Настройках cookie».`

---

# Часть IV. Блоки для Datenschutzerklärung

Включаются только блоки фактически подключённых сервисов (R-14.3). Немецкий текст — основной, русский — перевод для русской версии политики. **Это шаблоны для сверки, а не готовый текст (R-14.6):** перед публикацией каждое утверждение (провайдер, cookies и сроки, срок хранения, DPF, SCC, договоры) сверяется с фактической настройкой сервиса, неподтверждённое удаляется. Затем — юридическая проверка (пункт 44). Упоминание SCC в блоках оставляется, только если они действительно входят в договор с провайдером.

### IV.1. Cookies, lokale Speicherung und Einwilligungsverwaltung

**DE**

Diese Website verwendet technisch notwendige Speicherungen sowie – nur mit Ihrer Einwilligung – Dienste für [Statistik und Marketing]. Beim ersten Besuch können Sie im Consent-Banner auswählen, welchen optionalen Diensten Sie zustimmen. Ohne Ihre Zustimmung werden diese Dienste nicht geladen.

Ihre Auswahl (Kategorien, Version der Einstellungen, Datum) wird in Ihrem Browser gespeichert ([Cookie/localStorage] „[Name]“, Laufzeit [12] Monate), damit wir sie bei späteren Besuchen berücksichtigen können. Diese Speicherung ist unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. c DSGVO i. V. m. Art. 7 Abs. 1 DSGVO). Es werden dabei keine Daten an Dritte übermittelt.

Rechtsgrundlage für einwilligungspflichtige Speicherungen und Zugriffe ist § 25 Abs. 1 TDDDG, für die anschließende Verarbeitung Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über den Link „Cookie-Einstellungen“ am Ende jeder Seite ändern oder widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.

**RU**

Сайт использует технически необходимое хранение данных, а также — только с вашего согласия — сервисы для [статистики и маркетинга]. При первом посещении вы выбираете в баннере, на какие дополнительные сервисы соглашаетесь. Без согласия они не загружаются.

Ваш выбор (категории, версия настроек, дата) сохраняется в браузере ([cookie/localStorage] «[название]», срок [12] месяцев), чтобы учитывать его при следующих посещениях. Это хранение строго необходимо (§ 25 Abs. 2 Nr. 2 TDDDG, ст. 6(1)(c) DSGVO в связи со ст. 7(1) DSGVO). Данные третьим лицам не передаются.

Правовое основание для хранения и доступа, требующих согласия, — § 25 Abs. 1 TDDDG, для последующей обработки — ст. 6(1)(a) DSGVO. Согласие можно в любой момент изменить или отозвать на будущее по ссылке «Настройки cookie» внизу каждой страницы. Отзыв не влияет на законность обработки до него.

### IV.2. Hosting über Cloudflare

**DE**

Diese Website wird über Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA, bereitgestellt. Beim Aufruf der Website verarbeitet Cloudflare technisch notwendige Verbindungsdaten (u. a. IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browser-Informationen), um die Website auszuliefern und vor Angriffen zu schützen. Zum Schutz vor automatisierten Zugriffen kann Cloudflare das Cookie „__cf_bm“ (Laufzeit 30 Minuten) setzen. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG sowie unser berechtigtes Interesse an einer sicheren und stabilen Bereitstellung gemäß Art. 6 Abs. 1 lit. f DSGVO. Mit Cloudflare besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert[; ergänzend gelten die im Auftragsverarbeitungsvertrag vereinbarten Standardvertragsklauseln].

**RU**

Сайт работает через Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA. При открытии сайта Cloudflare обрабатывает технически необходимые данные соединения (в том числе IP-адрес, дату и время, адрес страницы, сведения о браузере), чтобы доставить сайт и защитить его от атак. Для защиты от автоматических запросов Cloudflare может установить cookie «__cf_bm» (срок 30 минут). Основание — § 25 Abs. 2 Nr. 2 TDDDG и наш законный интерес в безопасной и стабильной работе сайта по ст. 6(1)(f) DSGVO. С Cloudflare заключён договор об обработке данных по ст. 28 DSGVO. Cloudflare сертифицирован по EU-US Data Privacy Framework[; дополнительно действуют стандартные договорные положения, включённые в договор об обработке данных].

### IV.3. Google Tag Manager

**DE**

Wir verwenden den Google Tag Manager der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Der Tag Manager dient dazu, die von Ihnen erlaubten Dienste auf der Website einzubinden. Er wird erst geladen, wenn Sie mindestens einer optionalen Kategorie (Statistik oder Marketing) zugestimmt haben. Beim Laden wird Ihre IP-Adresse an Google übermittelt. Rechtsgrundlage ist Ihre Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert. Weitere Informationen: https://policies.google.com/privacy

**RU**

Мы используем Google Tag Manager компании Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ирландия. Он подключает на сайте сервисы, которые вы разрешили. Tag Manager загружается, только если вы согласились хотя бы на одну дополнительную категорию (статистика или маркетинг). При загрузке Google получает ваш IP-адрес. Основание — ваше согласие (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO). Google LLC сертифицирована по EU-US Data Privacy Framework. Подробнее: https://policies.google.com/privacy

### IV.4. Google Analytics 4

**DE**

Mit Ihrer Einwilligung in die Kategorie „Statistik“ verwenden wir Google Analytics 4 der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google Analytics hilft uns zu verstehen, wie die Website genutzt wird. Verarbeitet werden insbesondere aufgerufene Seiten[, bei Themenseiten nur in anonymisierter Form ohne Rückschluss auf das Thema], Zeitpunkt und Dauer des Besuchs, ungefähre Region, Browser, Gerätetyp, Betriebssystem, Herkunft des Besuchs einschließlich Kampagnenparametern (UTM) und Interaktionen wie Klicks auf Termin- oder Kontaktlinks. Nach Angabe von Google werden IP-Adressen in Google Analytics 4 nicht gespeichert.

Google Analytics setzt die Cookies „_ga“ und „_ga_[ID]“ (Laufzeit bis zu 2 Jahre). Die Daten werden nach [2 Monaten] gelöscht. Google verarbeitet die Daten als Auftragsverarbeiter; es gelten die Google Ads Data Processing Terms. Eine Übermittlung in die USA ist möglich; Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Wir verwenden Google Consent Mode im Basis-Modus: Ohne Einwilligung wird Google Analytics nicht geladen und es werden keine Daten an Google gesendet. Widerruf: „Cookie-Einstellungen“. Weitere Informationen: https://policies.google.com/privacy

**RU**

С вашего согласия на категорию «Статистика» мы используем Google Analytics 4 компании Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ирландия. Сервис помогает понять, как используется сайт. Обрабатываются, в частности, просмотренные страницы[, тематические страницы — только в обезличенном виде без указания темы], время и длительность визита, примерный регион, браузер, тип устройства, операционная система, источник визита, включая параметры кампаний (UTM), и действия, например клики по ссылкам записи или контактов. По данным Google, Google Analytics 4 не сохраняет IP-адреса.

Google Analytics устанавливает cookies «_ga» и «_ga_[ID]» (срок до 2 лет). Данные удаляются через [2 месяца]. Google обрабатывает данные как обработчик по договору (Google Ads Data Processing Terms). Возможна передача в США; Google LLC сертифицирована по EU-US Data Privacy Framework. Основание — ваше согласие (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO). Мы используем Google Consent Mode в базовом режиме: без согласия Google Analytics не загружается и данные в Google не передаются. Отзыв — «Настройки cookie». Подробнее: https://policies.google.com/privacy

### IV.5. Meta Pixel

**DE**

Mit Ihrer Einwilligung in die Kategorie „Marketing“ verwenden wir das Meta Pixel der Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland. Damit messen wir, ob Besucher nach dem Klick auf eine unserer Anzeigen auf Facebook oder Instagram die Website nutzen oder z. B. einen Termin anfragen, und können Anzeigen an Personen ausspielen, die unsere Website besucht haben. Verarbeitet werden insbesondere IP-Adresse, Browser- und Geräteinformationen, aufgerufene Seiten[, bei Themenseiten ohne Rückschluss auf das Thema] und Interaktionen. Meta kann diese Daten Ihrem Facebook- oder Instagram-Konto zuordnen und für eigene Zwecke verwenden.

Das Pixel setzt die Cookies „_fbp“ und ggf. „_fbc“ (Laufzeit 90 Tage). Für die Erhebung und Übermittlung der Daten sind wir und Meta gemeinsam verantwortlich (Art. 26 DSGVO); die Vereinbarung ist abrufbar unter https://www.facebook.com/legal/controller_addendum. Für die weitere Verarbeitung ist Meta allein verantwortlich. Eine Übermittlung in die USA ist möglich; Meta Platforms, Inc. ist unter dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Widerruf: „Cookie-Einstellungen“. Weitere Informationen: https://www.facebook.com/privacy/policy

**RU**

С вашего согласия на категорию «Маркетинг» мы используем Meta Pixel компании Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Ирландия. С его помощью мы измеряем, пользуются ли сайтом посетители после клика по нашей рекламе в Facebook или Instagram (например, записываются ли на консультацию), и можем показывать рекламу людям, которые посещали сайт. Обрабатываются, в частности, IP-адрес, сведения о браузере и устройстве, просмотренные страницы[, тематические — без указания темы] и действия на сайте. Meta может связать эти данные с вашим аккаунтом Facebook или Instagram и использовать их в своих целях.

Пиксель устанавливает cookies «_fbp» и при переходе по рекламе «_fbc» (срок 90 дней). За сбор и передачу данных мы и Meta отвечаем совместно (ст. 26 DSGVO); соглашение: https://www.facebook.com/legal/controller_addendum. За дальнейшую обработку отвечает только Meta. Возможна передача в США; Meta Platforms, Inc. сертифицирована по EU-US Data Privacy Framework. Основание — ваше согласие (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO). Отзыв — «Настройки cookie». Подробнее: https://www.facebook.com/privacy/policy

### IV.6. YouTube (click-to-load)

**DE**

Auf dieser Website sind Videos von YouTube eingebettet. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Vor dem Laden sehen Sie nur ein lokal gespeichertes Vorschaubild; es wird keine Verbindung zu YouTube hergestellt. Erst wenn Sie auf „YouTube-Video laden“ klicken, wird der Player im erweiterten Datenschutzmodus (youtube-nocookie.com) geladen. Dabei werden insbesondere Ihre IP-Adresse, Geräteinformationen und die aufgerufene Seite an Google übermittelt; YouTube kann Cookies bzw. lokale Speicher im Browser verwenden. Sind Sie bei Google angemeldet, kann Google die Nutzung Ihrem Konto zuordnen. Eine Übermittlung in die USA ist möglich; Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung durch den Klick (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Die Entscheidung wird nicht gespeichert; beim nächsten Seitenaufruf wird wieder das Vorschaubild angezeigt. Weitere Informationen: https://policies.google.com/privacy

**RU**

На сайте встроены видео YouTube. Провайдер — Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ирландия. До загрузки показывается только превью, хранящееся на нашем сайте; соединения с YouTube нет. Только после клика «Загрузить видео YouTube» загружается плеер в расширенном режиме конфиденциальности (youtube-nocookie.com). При этом Google получает, в частности, ваш IP-адрес, сведения об устройстве и адрес страницы; YouTube может использовать cookies или локальное хранилище браузера. Если вы вошли в аккаунт Google, Google может связать просмотр с аккаунтом. Возможна передача в США; Google LLC сертифицирована по EU-US Data Privacy Framework. Основание — ваше согласие, выраженное кликом (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO). Решение не сохраняется: при следующем открытии страницы снова показывается превью. Подробнее: https://policies.google.com/privacy

При варианте C вместо предложения «Die Entscheidung wird nicht gespeichert…» — `Ihre Entscheidung wird in den Cookie-Einstellungen gespeichert und kann dort jederzeit widerrufen werden.` / `Ваше решение сохраняется в настройках cookie и может быть отозвано там в любой момент.`

### IV.7. Google Maps (click-to-load)

**DE**

Auf der Kontaktseite kann eine Karte von Google Maps angezeigt werden. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Vor dem Laden sehen Sie nur eine lokal gespeicherte Vorschau; es wird keine Verbindung zu Google hergestellt. Erst wenn Sie auf „Karte laden“ klicken, wird die interaktive Karte geladen. Dabei werden insbesondere Ihre IP-Adresse, Geräteinformationen und die aufgerufene Seite an Google übermittelt; Google kann Cookies verwenden. Eine Übermittlung in die USA ist möglich; Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung durch den Klick (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Die Entscheidung wird nicht gespeichert. Alternativ können Sie die Adresse über den Link „In Google Maps öffnen“ direkt bei Google aufrufen. Weitere Informationen: https://policies.google.com/privacy

**RU**

На странице контактов может отображаться карта Google Maps. Провайдер — Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ирландия. До загрузки показывается только превью с нашего сайта; соединения с Google нет. Только после клика «Загрузить карту» загружается интерактивная карта. При этом Google получает, в частности, ваш IP-адрес, сведения об устройстве и адрес страницы; Google может использовать cookies. Возможна передача в США; Google LLC сертифицирована по EU-US Data Privacy Framework. Основание — ваше согласие, выраженное кликом (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO). Решение не сохраняется. Также можно открыть адрес напрямую у Google по ссылке «Открыть в Google Maps». Подробнее: https://policies.google.com/privacy

### IV.8. Terminvereinbarung über Calendly

**DE (Variante Link)**

Für die Terminvereinbarung verlinken wir auf den Dienst Calendly der Calendly LLC, 115 E Main St, Ste A1B, Buford, GA 30518, USA. Erst wenn Sie den Link anklicken, werden Sie zu Calendly weitergeleitet; vorher wird keine Verbindung hergestellt. Bei Calendly werden insbesondere Name, E-Mail-Adresse, gewünschter Termin, Zeitzone, freiwillige Angaben und technische Verbindungsdaten verarbeitet, um den Termin zu vereinbaren (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden in den USA verarbeitet; [Calendly ist unter dem EU-US Data Privacy Framework zertifiziert / es gelten Standardvertragsklauseln]. Bitte teilen Sie im Buchungsformular keine ausführlichen gesundheitlichen Informationen mit. Weitere Informationen: https://calendly.com/privacy

**RU (вариант «ссылка»)**

Для записи мы даём ссылку на сервис Calendly компании Calendly LLC, 115 E Main St, Ste A1B, Buford, GA 30518, USA. Переход на Calendly происходит только после клика по ссылке; до этого соединения нет. В Calendly обрабатываются, в частности, имя, email, выбранное время, часовой пояс, добровольно указанные сведения и технические данные соединения — для записи на встречу (ст. 6(1)(b) DSGVO). Данные обрабатываются в США; [Calendly сертифицирована по EU-US Data Privacy Framework / действуют стандартные договорные положения]. Пожалуйста, не указывайте в форме записи подробные сведения о здоровье. Подробнее: https://calendly.com/privacy

При встраивании (вариант B/C) добавляется: `Das Buchungs-Widget wird erst nach Ihrem Klick geladen; Calendly setzt dabei Cookies. Rechtsgrundlage für das Laden ist Ihre Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).` / `Виджет записи загружается только после вашего клика; при этом Calendly устанавливает cookies. Основание загрузки — ваше согласие (§ 25 Abs. 1 TDDDG, ст. 6(1)(a) DSGVO).`

### IV.9. Lokale Schriftarten

**DE**

Die auf dieser Website verwendeten Schriftarten werden von unserem eigenen Server geladen. Es wird keine Verbindung zu Google Fonts oder anderen externen Schriftanbietern hergestellt.

**RU**

Шрифты сайта загружаются с нашего собственного сервера. Соединения с Google Fonts или другими внешними поставщиками шрифтов нет.

### IV.10. Links zu sozialen Netzwerken

**DE**

Auf dieser Website befinden sich Links zu [Instagram, YouTube, LinkedIn, WhatsApp, Telegram]. Es handelt sich um einfache Links; durch ihre Anzeige wird keine Verbindung zu den Anbietern hergestellt. Erst nach dem Anklicken verlassen Sie unsere Website, und es gelten die Datenschutzbestimmungen des jeweiligen Anbieters.

**RU**

На сайте есть ссылки на [Instagram, YouTube, LinkedIn, WhatsApp, Telegram]. Это обычные ссылки: их отображение не создаёт соединения с провайдерами. После клика вы покидаете наш сайт, и действуют правила конфиденциальности соответствующего провайдера.

### IV.11. Zahlungsabwicklung über [Stripe / PayPal]

**DE**

Für die Bezahlung von [Leistungen] nutzen wir [Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland / PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxembourg]. [Variante Link: Wenn Sie auf „Zur Zahlung“ klicken, werden Sie auf die Zahlungsseite des Anbieters weitergeleitet; vorher wird keine Verbindung hergestellt. / Variante eingebettet: Das Zahlungsformular wird erst geladen, wenn Sie den Bezahlvorgang starten.] Dabei verarbeitet der Anbieter insbesondere Name, E-Mail-Adresse, Zahlungsdaten, Betrag, IP-Adresse und Geräteinformationen, um die Zahlung abzuwickeln und Betrug zu verhindern; hierfür können Cookies des Anbieters gesetzt werden. Rechtsgrundlage ist die Vertragsdurchführung (Art. 6 Abs. 1 lit. b DSGVO) sowie für die Betrugsprävention unser und das berechtigte Interesse des Anbieters (Art. 6 Abs. 1 lit. f DSGVO); Speicherungen im Browser sind für die von Ihnen angeforderte Zahlung unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Der Anbieter ist für die Zahlungsabwicklung eigenständig verantwortlich. [Übermittlung in die USA: …, nur wenn zutreffend.] Weitere Informationen: [https://stripe.com/de/privacy / https://www.paypal.com/de/legalhub/privacy-full]

**RU**

Для оплаты [услуг] мы используем [Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Ирландия / PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Люксембург]. [Вариант «ссылка»: после клика «Перейти к оплате» вы попадаете на страницу оплаты провайдера; до этого соединения нет. / Вариант «встроено»: форма оплаты загружается только когда вы начинаете оплату.] Провайдер обрабатывает, в частности, имя, email, платёжные данные, сумму, IP-адрес и сведения об устройстве, чтобы провести платёж и предотвратить мошенничество; для этого могут устанавливаться cookies провайдера. Основание — исполнение договора (ст. 6(1)(b) DSGVO), для предотвращения мошенничества — законный интерес наш и провайдера (ст. 6(1)(f) DSGVO); хранение в браузере строго необходимо для запрошенной вами оплаты (§ 25 Abs. 2 Nr. 2 TDDDG). За проведение платежа провайдер отвечает самостоятельно. [Передача в США: …, только если применимо.] Подробнее: [https://stripe.com/de/privacy / https://www.paypal.com/de/legalhub/privacy-full]

---

# Часть V. Итоговая сводка (собирается из части I)

| Параметр | Значение (образец margaritamartyn.de) |
|---|---|
| Категории баннера | **Notwendig / Необходимые; Statistik / Статистика; Marketing / Маркетинг** |
| Технические ключи категорий | **`necessary`, `analytics`, `marketing`** (`media` — только при варианте C) |
| Статистика | **GA4 `G-03L7NPHX2D`** |
| Маркетинг | **Meta Pixel `835942628995971`** |
| Tag Manager | **GTM `GTM-TFDHTN7M`**, события **`consent_statistics_granted`**, **`consent_marketing_granted`** |
| Consent Mode | **Basic** (R-7.4) |
| Внешний контент | **YouTube — B; Google Maps — B; Calendly — A; мессенджеры и соцсети — A; оплата — вне сайта** |
| Формат баннера | **модальное окно, без «×»** |
| Хранение | **localStorage, 12 месяцев, версия — уточнить** |
| Cookies для удаления при отзыве | **`_ga*` (Статистика); `_fbp`, `_fbc` (Маркетинг)** |
| Домены для сетевого аудита до согласия | **googletagmanager.com, google-analytics.com, analytics.google.com, connect.facebook.net, facebook.com, youtube-nocookie.com, youtube.com, i.ytimg.com, google.com/maps, maps.googleapis.com, maps.gstatic.com, fonts.googleapis.com, fonts.gstatic.com, static.cloudflareinsights.com** |
| Блоки Datenschutzerklärung | **IV.1, IV.2, IV.3, IV.4, IV.5, IV.6, IV.7, IV.8 (ссылка), IV.9, IV.10** |
| Открытые пункты | **19, 22 (настройки GA4), 23 (Controller Addendum), 30 (происхождение превью карты), 42, 43, 44** |

---

# Часть VI. Эталонная конфигурация vanilla-cookieconsent v3

Используется, если в пункте 10 выбрана vanilla-cookieconsent. Значения в `[скобках]` берутся из части I. Перед использованием сверить API с актуальной документацией библиотеки.

```js
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css'; // затем переопределить --cc-* токенами проекта

const GTM_ID = 'GTM-XXXXXXX';          // пункт 20
let gtmLoaded = false;

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

function consentState() {
  const stats = CookieConsent.acceptedCategory('analytics');
  const mkt = CookieConsent.acceptedCategory('marketing');
  return {
    stats,
    mkt,
    google: {
      analytics_storage: stats ? 'granted' : 'denied',
      ad_storage: mkt ? 'granted' : 'denied',
      ad_user_data: mkt ? 'granted' : 'denied',
      ad_personalization: mkt ? 'granted' : 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    },
  };
}

// Вызывается при загрузке страницы с сохранённым выбором и при первом решении.
// GTM ещё не загружен, поэтому consent default сразу отражает выбор (R-7.5).
function startTracking() {
  const { stats, mkt, google } = consentState();
  if (!stats && !mkt) return;                         // R-7.8: без согласия GTM не грузится
  if (!gtmLoaded) {
    gtag('consent', 'default', google);               // до загрузки контейнера
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(s);
    gtmLoaded = true;
  }
  // R-7.9: событие категории несёт и статус, чтобы триггер в GTM мог проверить его
  // без зависимости от порядка обработки consent-команд
  if (stats) window.dataLayer.push({ event: 'consent_statistics_granted', consent_statistics: 'granted' });
  if (mkt) window.dataLayer.push({ event: 'consent_marketing_granted', consent_marketing: 'granted' });
}

// R-11.4: любое изменение уже сохранённого выбора — update (в том числе полный отзыв),
// очистка cookies (делает autoClear) и перезагрузка страницы
function handleChange() {
  if (gtmLoaded) gtag('consent', 'update', consentState().google);
  window.location.reload();
}

CookieConsent.run({
  mode: 'opt-in',
  revision: 1,                                        // пункт 19, R-10.5
  hideFromBots: true,
  disablePageInteraction: false,                      // true только для модального формата (пункт 14)
  cookie: { name: 'cc_cookie', expiresAfterDays: 365, sameSite: 'Lax' }, // пункты 11, 18
  guiOptions: {
    consentModal: { layout: 'bar', position: 'bottom', equalWeightButtons: true, flipButtons: false }, // пункт 14, R-6.4
    preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
  },
  categories: {
    necessary: { enabled: true, readOnly: true },
    analytics: { autoClear: { cookies: [{ name: /^_ga/ }], reloadPage: false } },         // R-11.2
    marketing: { autoClear: { cookies: [{ name: '_fbp' }, { name: '_fbc' }, { name: /^_gcl/ }], reloadPage: false } },
  },
  onConsent: startTracking,                           // загрузка страницы с выбором и первое решение
  onChange: handleChange,                             // изменение ранее сохранённого выбора
  language: {
    default: 'de',                                    // пункт 3
    autoDetect: 'document',                           // язык из <html lang>, R-12.8
    translations: { de: { /* часть III, DE */ }, ru: { /* часть III, RU */ } },
  },
});
```

Ссылка на настройки в подвале (R-6.14):

```html
<button type="button" data-cc="show-preferencesModal">Cookie-Einstellungen</button>
```

Примечания к эталону:

- Перезагрузка при любом изменении выбора (R-11.4) снимает проблему порядка: `consent update` и событие категории в уже загруженном GTM могут обрабатываться не в том порядке, в каком отправлены. После перезагрузки GTM стартует с правильным `consent default`.
- Триггеры тегов в GTM: Custom Event `consent_statistics_granted` (или `consent_marketing_granted`) **и** переменная dataLayer `consent_statistics` (или `consent_marketing`) = `granted`; плюс Additional consent checks. Порядок проверяется в Tag Assistant: default распознан до первого тега, теги срабатывают только на событиях своих категорий (R-16.2).
- На многостраничном сайте (Astro) `onConsent` срабатывает при каждой загрузке страницы, поэтому события категорий уходят на каждой странице, и теги GA4/Meta срабатывают как просмотр страницы (R-8.5). На сайте с переходами без перезагрузки (SPA) просмотры страниц отправляются отдельным событием.
- GTM подключается программно из `startTracking`; стандартный сниппет GTM в `<head>` и его `<noscript>` не используются (R-7.2, R-7.3).
- Для модального формата: `disablePageInteraction: true`, `consentModal.layout: 'box'` с позицией по центру.
- Для варианта C (пункт 41) добавляется категория `media` с `services` (по одному на провайдера); кнопка facade «[Dienst] immer erlauben» вызывает `CookieConsent.acceptService('[service]', 'media')` (R-9.4).
