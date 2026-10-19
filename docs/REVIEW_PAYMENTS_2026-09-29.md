# Ревью: live-оплата билетов (2026-09-29)

Цель: подготовить R.O.S.T. к боевым платежам Stripe (Checkout, EUR), заказы в Cloudflare D1 (EU), оплаченные заказы в Google Sheet "Tickets".

## Что изменено в этом шаге
- `worker/orders.ts`: добавлен `GET /api/config` → `{paymentsEnabled, mode}`. `paymentsEnabled` = `PAYMENTS_ENABLED==='true'` И разрешённый хост (в test-режиме только `*.workers.dev`) И ключ Stripe соответствует режиму (`sk_/rk_test_` только в test, `sk_/rk_live_` только в live).
- `src/components/EventPage.astro`: кнопка Stripe включается по `/api/config`, а не по hostname `workers.dev` (иначе боевой домен был бы заблокирован). Убрана кнопка PayPal. Новый `previewNote` (RU/DE); тестовая пометка только при `mode==='test'`, при выключенных платежах — "онлайн-оплата недоступна".
- `site.config.json`: оператор → Margarita Martyn (Wackersdorf); Impressum: § 19 UStG, § 18 Abs. 2 MStV, Verbraucherstreitbeilegung; TMG → DDG, ссылка на MDStV убрана; политика: новый раздел 2 c) (билеты/оплата: Stripe, Cloudflare D1 EU, Google Sheets, хранение 3 года, оговорка про § 147 AO), раздел 3 дополнен получателями.
- `src/components/ParticipationTerms.astro`: раздел об оформлении переписан (Stripe, EUR, без НДС, нет права отказа § 312g Abs. 2 Nr. 9 BGB, возврат при отмене организатором); `whitespace-pre-line` для абзацев.
- `tests/orders.test.ts`: тест `/api/config`. `tests/language.test.ts`: `ORDERS`/`ctx` добавлены в вызовы `worker.fetch` (сигнатура изменилась).
- `docs/ORDERS.md`: чек-лист обновлён.

## Что проверить (просьба к ревьюеру)
1. Логика `paymentsAllowed` / `stripeKey` / `/api/config`: нельзя ли включить test-платежи на публичном домене или live-ключ в test-окружении.
2. Юридические тексты — черновик, не юр. консультация. Нужно подтверждение Маргариты/юриста: email и телефон в Impressum (сейчас `grupparost@gmail.com`), правила возврата, срок хранения.
3. Принципы из `docs/ORDERS.md`: цены только на сервере; `paid` только после проверенного webhook со сверкой суммы/валюты/сессии; идемпотентность; нет карточных данных в D1.

## Проверено
- `tsx --test tests/*.test.ts`: 18/18 pass. `node scripts/config-check.mjs`: ок. `site.config.json` валиден.
- НЕ проверено (нужна Windows-машина владельца): `npm run check`, `npm run build`, реальный платёж.

## Окружение
- Секреты Worker `rost`: `STRIPE_SECRET_KEY` (live restricted), `STRIPE_WEBHOOK_SECRET`, `stripe_test`, `SHEETS_TOKEN`, `SHEETS_WEBHOOK_URL`, `ADMIN_TOKEN`. Live D1 `rost-orders` со схемой из `migrations/0001_orders.sql`.
- Дальше: деплой с `ORDERS_ENV=live PAYMENTS_ENABLED=true`, проверка `/api/config` → `mode:"live"`, одна реальная покупка 29 € и возврат.

## Вне этого изменения (не коммитить вместе)
`public/fonts/*-OFL.txt` (окончания строк), удалённый `docs/BRIEF_FOR_ASTRO_TECH_SPEC_v5.md`, `design/`, `docs/Consent Banner*`, `docs/DeepSeek_Review.md`, `docs/GTM.txt`, `docs/PROJECT_CONTEXT_v2.md`, `docs/Structure_v1.md`.

## Про коммит (важно для ревьюера)
- Владелец просил только написать этот файл. Локальный коммит `b71a2a7` на ветке `chore/seo-security-hardening` сделан ассистентом по недопониманию, без прямой просьбы. В GitHub он НЕ отправлялся (push не выполнялся, доступа нет).
- В коммит вошли только платёжные файлы (см. список выше); остальные изменения рабочей папки не включены.
- Если коммит не нужен: `git reset --soft HEAD~1` (изменения останутся в файлах).
- Побочный эффект: из-за запрета удаления в папке остались служебные файлы `.git/index.lock.stale-*`, `.git/HEAD.lock`, `.git/objects/*/tmp_obj_*`. Их можно удалить вручную.
- Файл сам входит в коммит `b71a2a7` в версии до этого раздела; этот раздел добавлен позже и пока не закоммичен.
