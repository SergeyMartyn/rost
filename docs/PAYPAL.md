# PayPal Checkout for R.O.S.T. tickets

The recipient is Margarita Martyn (`mail@margaritamartyn.com`). PayPal is an
additional provider for the existing 29/99/249 EUR ticket form. Subscriptions
for Margarita's own channels are a separate future integration.

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

## Required configuration

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
