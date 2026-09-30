# Двуязычный шаблон Astro

Статический сайт: Astro, TypeScript, Tailwind CSS v4. Node.js 24 LTS, npm. Серверная логика ограничена выбором языка на `/` через Cloudflare Worker. Проект находится в корне; исходная пустая папка `template` не используется.

## Начало работы

```sh
npm ci
npm run dev
```

`dev` показывает статическую запасную страницу `/` с двумя ссылками. Для проверки настоящего языкового входа:

```sh
npm run check
npm run build
npm run preview
```

Откройте `http://localhost:8787`. Проверки: `npm test`, `npm run test:browser`. `npm run test:copy` создаёт отдельную чистую копию в `.copy-check`, устанавливает зависимости и проверяет её типы, сборку и модульные тесты. Браузерные тесты по умолчанию используют установленный Microsoft Edge; на другой системе установите Chromium через `npx playwright install chromium` и уберите `channel: 'msedge'` в `playwright.config.ts`.

## Новая чистая копия

Скопируйте `src`, `public`, `worker`, `scripts`, `tests`, `site.config.json`, `astro.config.mjs`, `tsconfig.json`, `playwright.config.ts`, `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `worker-configuration.d.ts`. Не копируйте `.git`, `node_modules`, `dist`, `.astro`, `.wrangler`, `.copy-check`, `.env*`, `.dev.vars*`, отчёты тестов и `wrangler.generated.json`. Документы исходного задания не требуются для сборки. В новой папке выполните `npm ci`, проверки и сборку. Затем создайте свой Git-репозиторий (`git init`) и подключите собственный remote.

## Параметры и адреса

Единственный источник параметров — `site.config.json`:

- `name`: настоящее название; `domain`: HTTPS origin без пути и завершающего `/`.
- `defaultLanguage`: `de` или `ru`; `workerName`: уникальное имя Worker вашего сайта.
- `legal`: ответственный, адрес, email и контакт по защите данных.
- `legalText`: подготовленные владельцем тексты Impressum и Datenschutz на обоих языках. Обычный текст, абзацы разделяются переводами строк; HTML не исполняется.
- `routes`: таблица соответствий; после изменения требуется новая сборка.

| Страница        | Deutsch                     | Русский                       |
| --------------- | --------------------------- | ----------------------------- |
| Главная         | `/de/`                      | `/ru/`                        |
| Мероприятия     | `/de/veranstaltungen/`      | `/ru/meropriyatiya/`          |
| О нас           | `/de/ueber-uns/`            | `/ru/o-nas/`                  |
| Контакты        | `/de/kontakt/`              | `/ru/kontakty/`               |
| Условия участия | `/de/teilnahmebedingungen/` | `/ru/usloviya-uchastiya/`     |
| Impressum       | `/de/impressum/`            | `/ru/pravovaya-informatsiya/` |
| Datenschutz     | `/de/datenschutz/`          | `/ru/konfidentsialnost/`      |

Русские слова записаны латиницей: `ya`, `ts`, `iya`, мягкий знак опускается. Используйте нижний регистр, дефисы и завершающий `/`. Обе локализации обязательны для каждой страницы в этом небольшом шаблоне. Таблица управляет генерацией страниц, внутренними ссылками, переключателем, canonical, hreflang и sitemap. Для добавления страницы расширьте также типизированный словарь и её содержимое. `x-default` указывает на вариант страницы на языке по умолчанию.

На `/` сначала учитывается cookie `site_language`, затем приоритеты `Accept-Language`, включая региональные варианты, веса `q` и `*`. При одинаковом весе учитывается порядок языков; при отсутствии поддерживаемого языка используется `defaultLanguage`. Ответ — временный 302 с `private, no-store` и `Vary`. Параметры URL сохраняются. Ручной переключатель сохраняет язык на год. При отключённом JavaScript ссылки работают, но предпочтение не сохраняется. Прямые `/de/...` и `/ru/...` не перенаправляются по языку. Если Worker отсутствует, `/` остаётся доступной страницей выбора языка.

## Безопасность, SEO и AI

- `public/_headers` — security-заголовки (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`) и кэширование (`immutable` для `/_astro`, `/fonts`, `/icons`). Cloudflare применяет их к статике; ответ `/` генерирует Worker и под правила не попадает. CSP намеренно не задан — добавлять вместе с оплатой и её внешним скриптом (шаблон есть в файле).
- `src/layouts/Layout.astro` — canonical/hreflang, Open Graph/Twitter, `preload` шрифтов Marmelad/Onest и JSON-LD (`Organization` + `WebSite`).
- `public/llms.txt` — краткое описание сайта для AI-ассистентов.
- `sitemap.xml` содержит `lastmod` (дата последнего коммита; если git недоступен, поле опускается).
- Проверки: `tests/browser/seo.spec.ts`.

## Согласие и сторонние ресурсы

Баннер — `vanilla-cookieconsent` v3 (`src/lib/consent.ts`), тексты DE/RU — `src/lib/consent-texts.ts`, стили — `src/styles/consent.css`.

**Реестр сервисов** — `src/lib/services.ts`. Сейчас один сервис: Google Analytics 4 через GTM (`GTM-PTPV7JBZ`, категория `analytics`). Категория существует, только если в ней есть сервис; без сервисов баннер не показывается. Новый сервис: добавить запись в `services`, описать его в Datenschutz (`site.config.json → legalText.privacy`), при необходимости добавить cookies в `cookiesToClear`, **поднять `consentConfig.revision`** (все увидят баннер снова) и записать причину в комментарий.

**Поведение.** До выбора и после отказа не загружается ничего стороннего. Consent Mode Basic: `consent default` (всё `denied`, кроме `security_storage`) попадает в `dataLayer` до загрузки контейнера; GTM подключается кодом только после согласия на статистику, затем событие `consent_statistics_granted`. В HTML нет сниппета GTM, `<noscript>`, `preconnect`, `dns-prefetch`. Смена сохранённого выбора: `consent update`, удаление `_ga*`, перезагрузка. Повторно открыть настройки: кнопка «Настройки cookie» в футере (`data-cc="show-preferencesModal"`). Для ботов баннер скрыт (`hideFromBots`).

**Внешний контент по клику (click-to-load).** YouTube (`youtube-nocookie.com`) и Google Maps подгружаются только после нажатия (`src/lib/facade.ts`). ID видео для страниц — `src/lib/media.ts → heroVideos`: на главной и странице мероприятий видео подключены; на страницах «О нас» и «Контакты» видеоблоки пока скрыты. Адрес карты — `regensburgPlace` там же.

**GTM:** контейнер публиковать только после проверки в Tag Assistant (тег GA4 — триггер на событие `consent_statistics_granted`, проверка согласия `analytics_storage`).

Тесты: `tests/browser/consent.spec.ts`. Для автоматических браузеров баннер скрыт, поэтому тесты подменяют `navigator.webdriver`.

## Сборка, Worker, выпуск

Astro во время сборки читает параметры и создаёт HTML/CSS/JS, sitemap, robots. Пустой домен локально заменяется `https://example.invalid`. Эти файлы не читают переменные Cloudflare во время запроса. После изменения названия, домена, маршрутов или текстов нужно пересобрать сайт.

`npm run build` создаёт `dist` и `wrangler.generated.json`. Не редактируйте сгенерированный файл: настройки находятся в `site.config.json` и `scripts/worker-config.mjs`. Единственная переменная Worker — `DEFAULT_LANGUAGE`, генерируется из того же источника. `ASSETS` — binding статических файлов, не секрет. Worker запускается первым только для `/`; остальные страницы обслуживает Static Assets, неизвестные адреса возвращают 404, а не главную с 200.

Проверка типов Worker: `npx wrangler types --config wrangler.generated.json`; обновляйте файл типов после изменения bindings.

Для публикации нужны корректное имя Worker и доступ к своему аккаунту Cloudflare. Домен можно указать для canonical, sitemap и изображения предпросмотра; пустое значение использует `https://example.invalid`. Название, содержимое и правовые сведения заполняются по решению владельца и не ограничивают публикацию.

```sh
npm run config:check
npm run check
npm run build
npm test
npm run test:browser
```

`config:check` проверяет только формат имени Worker, поддерживаемый язык по умолчанию и формат домена, если он указан. Пустые или примерные название, домен и правовые сведения разрешены. `npm run deploy` выполняет технические проверки, сборку и публикацию; решение о готовности содержимого принимает владелец.

Wrangler получает полномочия отдельно от сайта: интерактивный `npx wrangler login` либо `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID` в защищённом окружении CI. Не записывайте их в JSON или репозиторий. Название Worker не даёт прав доступа. После явного решения владельца о публикации подключите свой домен в Cloudflare Workers → Settings → Domains & Routes; он должен совпадать с `domain`. Необходимый scope API-токена определяется вашим аккаунтом и способом подключения домена.

Основа конфигурации: [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/), [404 для статических сайтов](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/), [Tailwind в Astro](https://docs.astro.build/en/guides/styling/).
