# R.O.S.T. — что нужно сделать вне кода (для Claude Desktop / человека)

Этот файл собирает шаги, которые не делает сторона разработки (код/тесты):
настройки в браузере, дашбордах и действия с секретами. Claude Desktop с доступом
к файлам и браузеру может выполнить часть сам.

**Правила безопасности (обязательно):**
- Секреты (`sk_live_…`, `whsec_…`, `ADMIN_TOKEN`, `SHEETS_TOKEN`) **не** писать в
  репозиторий, чат и этот файл. Только в Cloudflare → Worker `rost` →
  Settings → Variables and Secrets.
- `[Человек]` — шаги, где нужна личность/банк/2FA/карта; браузерный агент их
  выполнить не может.
- `[Браузер]` — что реально может сделать агент в браузере.
- Никаких реальных платежей до полной активации live и юридической проверки.

## Справочные данные

- Cloudflare Worker: `rost`; тестовый хост: `rost.sergeymartyn.workers.dev`;
  боевой домен: `rost.community`.
- D1: test `rost-orders-test` (`c239cc81-7eec-4d08-9001-0721aec10472`), live
  `rost-orders` (`3172652b-2274-4ce0-bf39-c74f94a58ee9`). Схема:
  `migrations/0001_orders.sql`.
- Цены (задаются только на сервере, `worker/tickets.ts`): `meetup` 29 €,
  `guest` 99 €, `host` 249 €.
- Эндпоинты: `POST /api/orders`, `POST /api/stripe/webhook`,
  `GET /api/admin/orders.csv`, `GET /api/config`.
- События Stripe для вебхука: `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`,
  `charge.refunded`.
- Имена секретов Worker: `stripe_test`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `ADMIN_TOKEN`, `SHEETS_WEBHOOK_URL`, `SHEETS_TOKEN`.

## 1. Stripe — активация live (получатель: Margarita Martyn)

1. `[Человек]` Завершить активацию live: **Verify your business** (документы и
   личность), **Add your bank** (банковские реквизиты), **Review and submit**.
   Это делает только человек; агент может открыть нужную страницу и подсказать
   поля.
2. `[Браузер]` После активации: Developers → API keys → скопировать **live
   Secret key** (`sk_live_…`), передать человеку для внесения в Cloudflare
   (в чат не вставлять).
3. `[Браузер]` Developers → Webhooks → Add endpoint:
   - URL: `https://rost.community/api/stripe/webhook`
   - Events: список выше.
   - Скопировать **Signing secret** (`whsec_…`) — передать человеку для секрета
     `STRIPE_WEBHOOK_SECRET` (live).
4. `[Человек]` Внести в Worker `rost` секреты `STRIPE_SECRET_KEY` и
   `STRIPE_WEBHOOK_SECRET` (live). Убедиться, что Stripe показывает приём
   live-платежей как активный.

## 2. PayPal — личный → Business (Маргарита)

1. `[Человек]` Перевести аккаунт в **Business**; получить **live REST API**
   (client id / secret).
2. Код PayPal пока не реализован — кнопка в UI будет скрыта. Больше от PayPal на
   этом шаге ничего не требуется.

## 3. Cloudflare

1. `[Человек]` Секреты Worker `rost` (значения не писать в файлы/чат):
   `STRIPE_WEBHOOK_SECRET`, `ADMIN_TOKEN` (длинная случайная строка),
   `SHEETS_WEBHOOK_URL`, `SHEETS_TOKEN`, позже `STRIPE_SECRET_KEY`.
   `stripe_test` уже есть.
2. `[Браузер]` Rate limiting rule на `POST` пути `/api/orders`
   (рекомендуемые параметры):
   - По IP, окно **1 минута**, лимит **10 запросов**, действие **Block**
     (или Managed Challenge).
   - IP в D1 не логировать (чтобы не менять Privacy).
3. `[Браузер]` Проверить Cloudflare Access (тестовый хост): приложение
   `R.O.S.T. test checkout` (закрывает `rost.sergeymartyn.workers.dev`) и
   `R.O.S.T. Stripe webhook test` (Bypass только на `/api/stripe/webhook`).
   Публичный `rost.community` остаётся открытым.
4. Деплой (`npm run deploy`) — делает сторона разработки, не этот файл.

## 4. D1

1. `[Браузер]` Применить `migrations/0001_orders.sql` к **live** базе
   `rost-orders` (для test уже применено). Проверить таблицы `orders` и
   `webhook_events`.
2. (Опционально) Применить тот же файл к `rost-orders-test`, если ещё не
   применён.

## 5. Google Sheets

1. `[Человек]` Создать/подтвердить таблицу «Tickets» с вкладками
   `10.10.26 - Regensburg` и `07.11.2026 - TI_München` (имена совпадают с
   `worker/tickets.ts → sheetTab`).
2. `[Браузер]` Расширения → Apps Script → вставить
   `docs/google-sheets-apps-script.gs`; в Project settings → Script properties
   добавить `SHEETS_TOKEN` = случайная строка; Deploy → New deployment → Web app
   (Execute as: **Me**, Who has access: **Anyone**); скопировать `/exec` URL.
3. `[Человек]` Внести в Worker `rost`: `SHEETS_WEBHOOK_URL` = этот `/exec` URL,
   `SHEETS_TOKEN` = та же строка.
4. `[Браузер]` Проверить: после тестового платежа в таблице появляется строка
   (имя, контакт, email, сумма, статус).

## 6. Тестовая оплата (Stripe test)

1. `[Человек]` Войти в Cloudflare Access на
   `https://rost.sergeymartyn.workers.dev/ru/meropriyatiya/`.
2. `[Человек]` Выбрать билет → имя/контакт → согласие → **Оплатить картой** →
   карта `4242 4242 4242 4242`.
3. `[Браузер + я]` Проверка: заказ в D1 перешёл `pending → paid`; строка ушла в
   Sheets; сайт показал уведомление о возврате. Сторона разработки проверит D1
   через `wrangler d1 execute` (SELECT).

## 7. Юридическая проверка (после правок текстов)

1. `[Человек]` Проверить обновлённые Datenschutz / Teilnahmebedingungen /
   Impressum (Stripe, Cloudflare D1 EU, срок хранения 8–10 лет, право отказа).
   Это не юридическая консультация.
2. `[Человек]` Согласовать срок хранения с бухгалтером.

## 8. Первый реальный платёж

1. `[Человек]` После включения live (`ORDERS_ENV=live`, `PAYMENTS_ENABLED=true`) —
   одна контролируемая покупка, затем возврат; сверить D1 и Stripe.

## Кто что может

- **Claude Desktop (браузер):** навигация по дашбордам Stripe / Cloudflare /
  Google, создание webhook-эндпоинта, правила rate-limit, деплой Apps Script,
  применение миграции через консоль, проверка таблицы.
- **Только человек:** верификация личности и банка в Stripe, 2FA, ввод секретов,
  ввод карты, аккаунт Google, перевод PayPal в Business.
- **Разработка (код):** гейтинг оплаты, `/api/config`, правовые тексты, тесты,
  деплой по явной команде.
