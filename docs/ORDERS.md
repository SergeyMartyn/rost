# Заказы билетов: Cloudflare D1 + Stripe

Получатель оплаты: **Margarita Martyn**. Цены задаются только на сервере (`worker/tickets.ts`).

| Ключ | Билет | Цена | Мероприятие |
|---|---|---|---|
| `meetup` | Встреча-знакомство | 29 € | Регенсбург, 10.10.2026 |
| `guest` | Игры, участник | 99 € | Мюнхен, 07.11.2026 |
| `host` | Игры, ведущий | 249 € | Мюнхен, 07.11.2026 |

## Как это устроено

- **D1** (юрисдикция EU): `rost-orders-test` (`c239cc81-7eec-4d08-9001-0721aec10472`) и `rost-orders` (`3172652b-2274-4ce0-bf39-c74f94a58ee9`). Binding `ORDERS`. ID лежат в `scripts/orders-db.json`; `scripts/worker-config.mjs` кладёт binding в `wrangler.generated.json` при каждой сборке. `ORDERS_ENV=test` (по умолчанию) или `live`.
- **Схема:** `migrations/0001_orders.sql` — таблицы `orders` и `webhook_events`. Статусы: `pending`, `paid`, `cancelled`, `refunded`, `failed`. Карты и ключи в D1 не хранятся.
- **`POST /api/orders`** — проверяет данные, создаёт заказ `pending`, создаёт Stripe Checkout Session и возвращает ссылку. Сумма из браузера игнорируется.
- **`POST /api/stripe/webhook`** — проверяет подпись Stripe (HMAC, допуск 5 минут). `paid` ставится только если совпали ID заказа, ID сессии, валюта EUR и сумма. Каждое событие записывается в `webhook_events`; повторная доставка ничего не меняет.
  - `checkout.session.completed` / `async_payment_succeeded` → `paid`
  - `checkout.session.expired` → `cancelled`
  - `checkout.session.async_payment_failed` → `failed`
  - `charge.refunded` (полный возврат) → `refunded`; частичный возврат только записывается.
- **Google Sheets:** после `paid` Worker отправляет строку в Apps Script (`docs/google-sheets-apps-script.gs`), вкладка выбирается по билету. Сбой таблицы не влияет на заказ в D1.
- **Экспорт:** `GET /api/admin/orders.csv` с заголовком `Authorization: Bearer <ADMIN_TOKEN>`. Публичного списка покупателей нет.
- **Защита от тестовой оплаты на публичном сайте:** в режиме `test` Worker принимает заказы только на `*.workers.dev`; ключ `sk_test_…` не примет live-режим и наоборот.

## Секреты (Cloudflare → Worker `rost` → Settings → Variables and Secrets → Secret)

| Имя | Что это | Статус |
|---|---|---|
| `stripe_test` | тестовый секретный ключ Stripe | есть |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` от тестового webhook | нужно создать |
| `ADMIN_TOKEN` | длинная случайная строка для CSV | нужно создать |
| `SHEETS_TOKEN` | случайная строка, такая же в Apps Script | нужно создать |
| `SHEETS_WEBHOOK_URL` | URL веб-приложения Apps Script (`…/exec`) | после публикации скрипта |
| `STRIPE_SECRET_KEY` | боевой ключ (только перед live) | позже |

## Тестовое подключение Stripe

1. Stripe (режим Test) → Developers → Webhooks → Add endpoint: `https://rost.sergeymartyn.workers.dev/api/stripe/webhook`. События: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Подписной секрет `whsec_…` сохранить как `STRIPE_WEBHOOK_SECRET`.
2. В Cloudflare Access настроены два приложения: `R.O.S.T. test checkout` закрывает только `rost.sergeymartyn.workers.dev` для участников аккаунта Cloudflare; `R.O.S.T. Stripe webhook test` применяет **Bypass** только к `rost.sergeymartyn.workers.dev/api/stripe/webhook`. Публичный `rost.community` остаётся открытым. Подпись webhook проверяется в Worker.
3. `npm run deploy`, затем платёж картой `4242 4242 4242 4242` на `https://rost.sergeymartyn.workers.dev/ru/meropriyatiya/`.

## Результаты автоматических тестов (2026-09-29)

`tests/orders.test.ts` — настоящий SQL из миграции (SQLite) + подписанные события Stripe. Запуск: `npm test`. Итог: **17 из 17 (13 новых + 4 прежних) пройдено**.

| Проверка | Результат |
|---|---|
| Билет 29 € / 99 € / 249 €: в Stripe уходит верная сумма, браузерная сумма игнорируется, `pending → paid`, email из Stripe сохранён, строка в таблицу отправлена | ок |
| Отмена оплаты (`checkout.session.expired`) → `cancelled`, не `paid` | ок |
| Повторный webhook: ответ `duplicate`, заказ не меняется, вторая строка в таблицу не уходит; другое событие по уже оплаченной сессии тоже ничего не меняет | ок |
| Несовпадение суммы → заказ остаётся `pending`, причина записана (`rejected:amount_mismatch`) | ок |
| Несовпадение валюты, ID сессии, неизвестный заказ → отклонено | ок |
| Возврат: по неоплаченному ничего; частичный игнорируется; полный `paid → refunded` | ок |
| Неверная подпись, просроченная подпись, отсутствие подписи → 400 | ок |
| Неизвестный билет, неверный контакт, нет согласия, чужой Origin → отказ, заказ не создан | ок |
| Публичный домен и `PAYMENTS_ENABLED=false` → 403; live-ключ в тестовом режиме → 503 | ок |
| Сбой Stripe → заказ `failed` | ок |
| CSV: без токена 401, формулы экранируются, без `ADMIN_TOKEN` 404 | ок |

**Проверено 2026-09-29:** `npm run check`, `npm run build` и `npm test` проходят; тестовый Worker опубликован с D1 binding `ORDERS` на `rost-orders-test`. Анонимный запрос к тестовому сайту перенаправляется на Access (302), публичный сайт отвечает 200, неподписанный POST на webhook проходит Access и отклоняется Worker (400). Форма создала тестовый заказ `meetup` на 2900 центов и открыла Stripe Checkout на 29 €. После оплаты тестовой картой Stripe вернул браузер на сайт; в D1 статус этого заказа изменился с `pending` на `paid`. Светлое уведомление о возврате и его кнопку закрытия проверили на опубликованном тестовом сайте.

**Осталось проверить:** запись в Google Sheets (если эту дополнительную интеграцию решат включить). Локальный API-токен Wrangler не имеет права запросов к D1 (Cloudflare 7403); таблицы `orders` и `webhook_events` проверены в панели Cloudflare.

## Хранение и удаление данных

Срок хранения — 3 года (решение организатора, подтверждено 2026-09-29). Раз в год организатор сам делает экспорт (`/api/admin/orders.csv`) и чистит базу вручную: в консоли D1 выполнить
`DELETE FROM orders WHERE created_at < date('now','-3 years');`
и `DELETE FROM webhook_events WHERE received_at < date('now','-3 years');`.
Оговорка: платёжные записи могут подпадать под налоговые сроки хранения (в Германии обычно до 8 лет). Срок стоит подтвердить у бухгалтера, а в политике конфиденциальности указать выбранный.

## Перед реальными продажами

- [ ] Stripe-аккаунт и платёжные данные оформлены на Margarita Martyn (проверить: верификация личности для ключа).
- [x] Impressum: оператор Margarita Martyn, Wackersdorf (2026-09-29). Открыто: подтвердить email/телефон для Impressum.
- [x] (черновик, нужна юр. проверка Маргаритой) Условия участия и политика конфиденциальности: убрать «онлайн-оплата отключена»; добавить Stripe, Cloudflare D1 (EU), Google Sheets как получателей данных, состав данных, срок хранения; указать информацию об отказе от договора для мероприятий.
- [x] Текст `previewNote` заменён; кнопки включаются по `GET /api/config` (не по hostname). PayPal-кнопка убрана.
- [ ] Схему `migrations/0001_orders.sql` применить к `rost-orders`; создать боевой webhook (другой `whsec_`), задать `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; деплой с `ORDERS_ENV=live PAYMENTS_ENABLED=true`.
- [ ] Одна контролируемая реальная покупка, затем возврат.
