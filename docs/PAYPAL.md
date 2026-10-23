# PayPal Checkout for R.O.S.T. tickets

## Current account transition, 2026-10-20

Production uses Timur for new sales. The coordinated release is version
`8294cf76-07e8-4e5e-a189-14975a431368`; mode is live and the original production
D1 database is preserved. See `PAYMENT_ACCOUNT_TRANSITION.md` for preparation
history and verification evidence. No new paid transaction was performed.

New orders select the account with `PAYPAL_ACCOUNT_OWNER` (`timur` in live
deployments, `margarita` for local sandbox fixtures). Timur uses `PAYPAL_TIMUR_CLIENT_ID`,
`PAYPAL_TIMUR_CLIENT_SECRET`, `PAYPAL_TIMUR_PAYEE_EMAIL` and
`PAYPAL_TIMUR_WEBHOOK_ID`. Keep the original settings for existing purchases.
The separate endpoint is `/api/paypal/timur/webhook`; the original endpoint
continues validating events with the original app's webhook ID. Browser returns
choose credentials from the order's persisted `payment_account`, not the
current selector for new sales. Migration `0004_payment_account.sql` was applied
with the coordinated release. New PayPal API configuration must be checked on
both `/api/config` and `/api/payments/config`.

Do not print tokens or decrypted credentials. Do not create a real paid
transaction without separate user authorization. Successful OAuth and webhook
configuration are not proof of a completed buyer payment or received callback.

## Legacy production purchases

Existing purchases retain Margarita Martyn and the original credentials below.
Do not replace the legacy payee setting: the stored account chooses the correct
recipient for pending browser returns, captures and webhook verification.
Current participant prices come from the server catalog, not this document.

## Flow

1. The form sends `provider: "paypal"` to `POST /api/orders`. The Worker validates
   the contact and chooses the ticket price on the server, inserts a pending
   order in D1, creates a PayPal Orders v2 order, and redirects to PayPal.
2. PayPal redirects to `/api/paypal/return`, where the Worker captures the order
   with an idempotency key. It records `paid` only when PayPal confirms a
   completed capture with the expected local order ID, payee, EUR amount and
   PayPal order ID. The success page alone is never proof of payment.
3. The signed `CHECKOUT.ORDER.APPROVED` webhook can capture an approved order if
   the buyer closes the browser before returning. `PAYMENT.CAPTURE.COMPLETED`
   reconciles a capture against PayPal's order API. Full refunds received through
   `PAYMENT.CAPTURE.REFUNDED` change the D1 order to `refunded`; partial refunds
   do not.
4. The same D1 order and Google Sheets pathway used by Stripe is used by PayPal.
   `GET /api/config` advertises PayPal only when fully configured; until then the
   button stays hidden.

## Legacy configuration (retain for existing orders)

Cloudflare Worker `rost` → Settings → Variables and Secrets:

| Name | Type | Value |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID` | Secret | Live Client ID of the `ROST Tickets` REST app |
| `PAYPAL_CLIENT_SECRET` | Secret | Live Secret key of that app |
| `PAYPAL_WEBHOOK_ID` | Secret | ID shown after creating the app's live webhook |

Never put credentials in Git, chat, build variables, or page JavaScript.
`scripts/worker-config.mjs` supplies the payee email and sets `PAYPAL_MODE` from
`ORDERS_ENV`. It sets `PAYPAL_ENABLED=false` unless explicitly enabled for a
deployment. The existing `PAYMENTS_ENABLED` flag must also be true.

In PayPal Developer Dashboard → Apps & Credentials → Live → `ROST Tickets` →
Live Webhooks → Add Webhook:

- URL: `https://rost.community/api/paypal/webhook`
- Events: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
  `PAYMENT.CAPTURE.REFUNDED`

The public domain is used because `*.workers.dev` is behind Cloudflare Access.
The webhook verifies signatures by PayPal's postback API using the webhook ID.
Do not enable PayPal until the webhook is configured and its ID is stored.

Build and deploy live with `ORDERS_ENV=live`, `PAYMENTS_ENABLED=true`, and
`PAYPAL_ENABLED=true`. A default/test build keeps PayPal off. Verify
`GET https://rost.community/api/config` returns `paypal: true` before checking
that the button appears in both languages. Complete a controlled payment and
verify the D1 row, PayPal transaction, and optional Sheets row. A refund should
be verified separately. PayPal account eligibility/verification can still
restrict live transactions despite the REST app existing.
