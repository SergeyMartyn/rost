# Handoff: состояние проекта после обрыва по лимитам

Короткая записка для следующего агента. Актуально на 29.09.2026, вечер.

## Где мы
- Репозиторий: `D:\WWW\R.O.S.T\ai\Web`, рабочая ветка **`chore/seo-security-hardening`** (HEAD `6cda766`).
- Ветка **запушена** в `origin` (новая). `main`/`origin/main` = `78e468d`, **всё наше в main ещё не влито**.
- Есть незакоммиченные/untracked файлы, оставленные «out of scope» (не трогать без задачи): удалённый `docs/BRIEF_FOR_ASTRO_TECH_SPEC_v5.md`, `docs/REVIEW_PAYMENTS_2026-09-29.md`, `design/`, `docs/Consent Banner*`, `docs/DeepSeek_Review.md`, `docs/PROJECT_CONTEXT_v2.md`, `docs/Structure_v1.md`, `docs/GTM.txt`.

## Что сделано (в этой ветке)
1. SEO/a11y/perf (мои коммиты `bab5d15`, `b6dfa38`, `2206ace`, `532027f`):
   `public/_headers` (security+cache), `public/llms.txt`, JSON-LD `Organization`+`WebSite` и OG/Twitter в `Layout.astro`, preload шрифтов, фото событий в AVIF/WebP + `srcset`, `aria-hidden` у соц-иконок, `lastmod` в sitemap, `tests/browser/seo.spec.ts`, черновик `docs/SEO_Meta_Drafts.md`.
2. Платежи (`b71a2a7`, автор — другая модель): Stripe Checkout → D1 → Google Sheets; `worker/orders.ts`, `worker/tickets.ts` (цены только на сервере), `migrations/0001_orders.sql`, `GET /api/config` = `{paymentsEnabled, mode}`, обновлённые правовые тексты.
3. Мои фиксы (`6cda766`): 5 ошибок типов (`Response.json()` из Cloudflare-типов = `unknown`) в `EventPage.astro` и `tests/orders.test.ts`; try/catch вокруг `new URL(origin)` в `POST /api/orders`; приведены в порядок устаревшие браузерные тесты (PayPal и карта удалены из UI).

## Что задеплоено (боевой!)
- Worker **`rost`**, Version ID `23407802`. Bindings: `ORDERS=rost-orders` (live D1), `ORDERS_ENV=live`, `PAYMENTS_ENABLED=true`. Маршруты: `rost.community/*` и `rost.sergeymartyn.workers.dev`.
- Проверено на живом домене: `/api/config` → `{"paymentsEnabled":true,"mode":"live"}`; `POST /api/stripe/webhook` без подписи → 400 `bad_signature`; `POST /api/orders` → 200 с реальным Stripe Checkout URL (боевой ключ рабочий). Тестовый хост закрыт Cloudflare Access (302).
- Секреты Worker (только имена): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `stripe_test`, `ADMIN_TOKEN`, `SHEETS_TOKEN`, `SHEETS_WEBHOOK_URL`.

## Проверки (все зелёные)
`npm run config:check`, `astro check` — 0 ошибок; `npm run build` — 16 страниц; `npm test` — 18/18; `npm run test:browser` — 29/29.

## Как чинить/повторять
- Деплой боевой: `$env:ORDERS_ENV='live'; $env:PAYMENTS_ENABLED='true'; npm run deploy`.
- Деплой тестовый (по умолчанию): `npm run deploy` (bindings → `rost-orders-test`).
- Генератор конфига: `scripts/worker-config.mjs` читает `scripts/orders-db.json` и env.
- Подробные ручные шаги (Stripe/Cloudflare/Sheets/D1): `docs/PAYMENTS_MANUAL_STEPS.md`.

## Известные нюансы / риски
- **Расходящиеся ветки-дубли** (не использовать вместо текущей, можно удалять по согласованию):
  `feature/rost-stripe-payments` @ `328b891` (worktree `Web-stripe-payments`) и `feature/seo-stripe-combined` @ `e939f64` (worktree `Web-seo-stripe`) — там альтернативная реализация платёжного UI с другим форматом `/api/config` (`{payments, testMode, tickets}`), скрытым PayPal и сроком хранения 10 лет. **Боевой — этот (`chore/seo-security-hardening`).**
- `b71a2a7` изменил Impressum оператора на **Margarita Martyn** и **упоминает Google Sheets** в Privacy, срок хранения 3 года — это расходится с более ранними решениями владельца (Timur / не упоминать Sheets / 8–10 лет). Требует подтверждения.
- D1 через CLI не читается: токен Cloudflare без D1-скоупа (ошибка 7403). Worker с базой работает.
- Rate-limit на `/api/orders` пока не настроен — по плану правило Cloudflare в дашборде (параметры в `PAYMENTS_MANUAL_STEPS.md`).
- Остались не сделаны владельцем: Stripe live-верификация (Verify business → Add bank), финальная реальная покупка+возврат, проверка Google Sheets, юр. подтверждение текстов.
