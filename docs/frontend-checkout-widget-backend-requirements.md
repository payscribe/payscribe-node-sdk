# Payscribe Frontend Checkout Widget Backend Requirements

## Goal

Build a frontend checkout widget that lets merchants trigger a Payscribe modal from any website or frontend framework.

The merchant should not need to build separate UIs for airtime, data, electricity, cable TV, or other supported services. They should only create a secure checkout session from their backend, then open the widget from their frontend.

The widget should work in:

- Plain HTML/vanilla JavaScript
- React
- Next.js
- Vue
- Nuxt
- Svelte
- Angular
- Vite apps
- Laravel Blade, Django templates, Rails views, PHP/WordPress pages, and similar server-rendered pages

## Target Merchant Experience

### Script Tag Usage

```html
<script src="https://checkout.payscribe.co/widget.js"></script>

<button id="pay-bill">Pay with Payscribe</button>

<script>
  document.getElementById("pay-bill").onclick = async () => {
    const response = await fetch("/api/payscribe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "electricity",
        amount: 1000,
        customer: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          phone: "08012345678"
        }
      })
    });

    const session = await response.json();

    PayscribeCheckout.open({
      sessionToken: session.token,
      onSuccess(result) {
        console.log("Payment successful", result);
      },
      onError(error) {
        console.error("Payment failed", error);
      },
      onClose() {
        console.log("Checkout closed");
      }
    });
  };
</script>
```

### NPM Usage

```bash
npm install @payscribe/checkout-js
```

```ts
import { PayscribeCheckout } from "@payscribe/checkout-js";

const session = await fetch("/api/payscribe/create-checkout-session", {
  method: "POST"
}).then((res) => res.json());

PayscribeCheckout.open({
  sessionToken: session.token,
  onSuccess(result) {},
  onError(error) {},
  onClose() {}
});
```

## Security Boundary

The frontend widget must never receive a Payscribe secret key.

The merchant frontend should only receive a public, short-lived, token-scoped checkout session value such as:

```json
{
  "token": "btn_abc123",
  "canvasUrl": "https://links.payscribe.co/canvas?token=btn_abc123",
  "expiresAt": "2026-07-29T12:30:00.000Z"
}
```

The merchant backend is responsible for calling Payscribe with the merchant secret key.

```text
Merchant frontend
  -> calls merchant backend

Merchant backend
  -> calls Payscribe with secret key

Payscribe
  -> returns public checkout token

Merchant frontend
  -> opens Payscribe widget with token
```

## What Payscribe Already Has

Based on the existing Payscribe Button Checkout notes, Payscribe already has a partial embeddable widget system.

Current shape:

```text
Merchant backend
  -> POST /v1/button/init
  -> receives token + canvas_url

Merchant frontend
  -> loads public/js/button.js
  -> renders <payscribe-button />
  -> opens iframe modal

Canvas iframe
  -> GET /v1/button/session/:token
  -> POST /v1/button/transfer/init
  -> GET /v1/button/transfer/status/:token via SSE
```

Existing backend pieces:

- `POST /v1/button/init`
- `GET /v1/button/session/:token`
- `POST /v1/button/transfer/init`
- `GET /v1/button/transfer/status/:token`
- `button_sessions` table
- Public token-scoped session flow
- Bank transfer collection through virtual account allocation
- Modal iframe hosted outside the merchant site
- `postMessage` callbacks for `success`, `error`, `close`, and readiness events
- Stored `service` field with values like `pay`, `airtime`, `data`, and `bills`

Current limitation:

```text
Only service=pay works end-to-end today.
service=airtime, service=data, and service=bills are accepted/stored but not fulfilled.
```

## What The Current Node SDK Already Provides

The Node SDK already wraps the lower-level Payscribe service APIs.

### Virtual Accounts

```ts
payscribe.virtualAccounts.createStatic(...)
payscribe.virtualAccounts.createDynamic(...)
payscribe.virtualAccounts.get(...)
payscribe.virtualAccounts.activate(...)
payscribe.virtualAccounts.deactivate(...)
payscribe.virtualAccounts.confirmPayment(...)
```

### Virtual Cards

```ts
payscribe.virtualCards.create(...)
payscribe.virtualCards.topUp(...)
payscribe.virtualCards.withdraw(...)
payscribe.virtualCards.freeze(...)
payscribe.virtualCards.unfreeze(...)
payscribe.virtualCards.terminate(...)
```

### Bills

```ts
payscribe.bills.airtime.vend(...)
payscribe.bills.data.lookup(...)
payscribe.bills.data.vend(...)
payscribe.bills.electricity.validate(...)
payscribe.bills.electricity.pay(...)
payscribe.bills.cable.fetchBouquets(...)
payscribe.bills.cable.validateSmartCard(...)
payscribe.bills.cable.pay(...)
payscribe.bills.betting.lookup(...)
payscribe.bills.betting.fundWallet(...)
payscribe.bills.requery(...)
```

This means the SDK has the low-level operations, but the frontend widget needs a higher-level checkout/session backend flow.

## Required Backend Scope

The recommended path is to extend the existing `/v1/button/*` backend instead of creating a separate checkout system from scratch.

Minimum required endpoints:

```text
POST /v1/button/init
GET  /v1/button/session/:token
POST /v1/button/session/:token/validate
POST /v1/button/transfer/init
GET  /v1/button/transfer/status/:token
GET  /v1/button/session/:token/status
```

Optional but recommended:

```text
GET  /v1/button/session/reference/:reference
POST /v1/button/session/:token/cancel
```

## Endpoint Requirements

### 1. Create Checkout Session

```text
POST /v1/button/init
```

Called server-to-server by the merchant backend using the merchant secret key.

This endpoint already exists, but it needs stronger service-specific metadata handling.

Example request:

```json
{
  "amount": 1000,
  "currency": "NGN",
  "reference": "order_123",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "phone": "08012345678",
  "service": "electricity",
  "metadata": {
    "meterNumber": "45083082250",
    "meterType": "prepaid",
    "provider": "phedc"
  },
  "successUrl": "https://merchant.com/success",
  "cancelUrl": "https://merchant.com/cancel"
}
```

Recommended supported `service` values:

```text
pay
airtime
data
electricity
cable
betting
internet
epins
international
```

Alternative: keep `service: "bills"` and use `metadata.category`.

```json
{
  "service": "bills",
  "metadata": {
    "category": "electricity",
    "provider": "phedc",
    "meterNumber": "45083082250",
    "meterType": "prepaid"
  }
}
```

Recommended response:

```json
{
  "status": true,
  "data": {
    "token": "btn_abc123",
    "canvas_url": "https://links.payscribe.co/canvas?token=btn_abc123",
    "expires_at": "2026-07-29T12:30:00.000Z"
  }
}
```

Backend responsibilities:

- Authenticate merchant secret key.
- Validate merchant/business status.
- Validate service value.
- Validate required metadata for the selected service.
- Store session with `pending` status.
- Store merchant reference and metadata.
- Store success/cancel URLs where supported.
- Store origin/domain if origin allowlisting is enabled.
- Expire session after a short period, for example 30 minutes.

### 2. Load Checkout Session

```text
GET /v1/button/session/:token
```

Called by the widget/canvas iframe.

This endpoint already exists, but it should return service-specific public fields needed to render the correct UI.

Example response:

```json
{
  "status": true,
  "data": {
    "token": "btn_abc123",
    "business": {
      "name": "Demo Merchant",
      "logo": "https://..."
    },
    "amount": 1000,
    "currency": "NGN",
    "reference": "order_123",
    "service": "electricity",
    "customer": {
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "phone": "08012345678"
    },
    "metadata": {
      "provider": "phedc",
      "meterNumber": "45083082250",
      "meterType": "prepaid"
    },
    "status": "pending",
    "expires_at": "2026-07-29T12:30:00.000Z"
  }
}
```

Backend responsibilities:

- Return only public-safe session data.
- Never return merchant secret keys.
- Reject expired sessions.
- Reject invalid/unknown tokens.
- Return enough service metadata for the modal to decide whether to show a form, review screen, or direct payment screen.

### 3. Validate Service Details

```text
POST /v1/button/session/:token/validate
```

New endpoint.

Called by the widget before payment when the selected service requires validation.

Examples:

- Electricity: validate meter number.
- Cable: validate smartcard/IUC number.
- Betting: validate betting wallet/account.
- Data: validate or fetch selected plan details where supported.

Electricity request:

```json
{
  "provider": "phedc",
  "meterNumber": "45083082250",
  "meterType": "prepaid",
  "amount": 1000
}
```

Electricity response:

```json
{
  "status": true,
  "data": {
    "valid": true,
    "customerName": "Ada Lovelace",
    "address": "12 Broad Street, Lagos",
    "service": "electricity"
  }
}
```

Backend responsibilities:

- Load session by token.
- Confirm session is open/not expired.
- Use session service to route validation.
- Call the relevant Payscribe validation/lookup service.
- Store validated details in the session.
- Return a normalized response to the widget.

### 4. Initialize Transfer Payment

```text
POST /v1/button/transfer/init
```

Called by the widget after the user has selected/reviewed the service details.

This endpoint already exists for bank transfer collection.

Required change:

It must work for service purchases, not just generic `pay`.

Request:

```json
{
  "token": "btn_abc123",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "amount": 1000
}
```

Response:

```json
{
  "status": true,
  "data": {
    "account_number": "1234567890",
    "account_name": "PAYSCRIBE DEMO",
    "bank_name": "9PSB",
    "amount": 1000,
    "expires_at": "2026-07-29T12:30:00.000Z"
  }
}
```

Backend responsibilities:

- Create or reuse an unexpired dynamic virtual account for the session.
- Lock the payable amount where the service requires exact payment.
- Keep the session status as `awaiting_payment`.
- Do not mark the service purchase as successful yet.

### 5. Stream Transfer And Fulfillment Status

```text
GET /v1/button/transfer/status/:token
```

Called by the widget using Server-Sent Events.

This endpoint already exists, but it currently marks the session successful once a transfer is detected.

Required change:

For service purchases, the success path must include service fulfillment.

Correct flow:

```text
transfer detected
  -> mark payment_received
  -> call service fulfillment
  -> if fulfillment succeeds, mark success
  -> if fulfillment fails, mark failed or pending_manual_review
  -> emit final status to widget
  -> send merchant webhook
```

Example SSE events:

```json
{ "status": "pending" }
```

```json
{ "status": "payment_received" }
```

```json
{
  "status": "success",
  "service": "electricity",
  "transactionId": "txn_123",
  "reference": "order_123",
  "token": "1234-5678-9012"
}
```

```json
{
  "status": "failed",
  "reason": "service_fulfillment_failed",
  "message": "Payment received but electricity vending failed."
}
```

Backend responsibilities:

- Detect matching transfer.
- Prevent double fulfillment using idempotency.
- Route to the correct service execution method.
- Store payment transaction ID.
- Store fulfillment transaction ID/result.
- Emit final widget status.
- Send webhook to merchant.

### 6. Get Session Status

```text
GET /v1/button/session/:token/status
```

New endpoint.

Used by the widget for polling fallback and by merchant tooling for customer support.

Example response:

```json
{
  "status": true,
  "data": {
    "token": "btn_abc123",
    "reference": "order_123",
    "service": "electricity",
    "status": "success",
    "paymentStatus": "received",
    "fulfillmentStatus": "success",
    "transactionId": "txn_123",
    "paidAt": "2026-07-29T12:15:00.000Z"
  }
}
```

Backend responsibilities:

- Return current session state.
- Support pending/success/failed/expired states.
- Avoid exposing internal secrets.
- Include enough data for support and reconciliation.

## Service Fulfillment Requirements

The key missing piece is service fulfillment after payment.

### Airtime

Required session metadata:

```json
{
  "service": "airtime",
  "amount": 50,
  "metadata": {
    "network": "mtn",
    "recipient": "08169254598",
    "ported": false
  }
}
```

Fulfillment call:

```ts
payscribe.bills.airtime.vend({
  network: "mtn",
  amount: 50,
  recipient: "08169254598",
  reference: "order_123"
});
```

### Data

Required session metadata:

```json
{
  "service": "data",
  "amount": 500,
  "metadata": {
    "network": "mtn",
    "plan": "PSPLAN_177",
    "recipient": "08169254598"
  }
}
```

Fulfillment call:

```ts
payscribe.bills.data.vend({
  network: "mtn",
  plan: "PSPLAN_177",
  recipient: "08169254598",
  reference: "order_123"
});
```

### Electricity

Required session metadata:

```json
{
  "service": "electricity",
  "amount": 1000,
  "metadata": {
    "provider": "phedc",
    "meterNumber": "45083082250",
    "meterType": "prepaid",
    "customerName": "Ada Lovelace",
    "phone": "08012345678"
  }
}
```

Fulfillment call:

```ts
payscribe.bills.electricity.pay({
  meterNumber: "45083082250",
  meterType: "prepaid",
  amount: 1000,
  service: "phedc",
  customerName: "Ada Lovelace",
  phone: "08012345678",
  reference: "order_123"
});
```

### Cable

Required session metadata:

```json
{
  "service": "cable",
  "amount": 5000,
  "metadata": {
    "provider": "dstv",
    "account": "8062415043",
    "planId": "PLAN_CODE",
    "customerName": "Ada Lovelace",
    "month": 1
  }
}
```

Fulfillment call:

```ts
payscribe.bills.cable.pay({
  service: "dstv",
  account: "8062415043",
  planId: "PLAN_CODE",
  customerName: "Ada Lovelace",
  month: 1,
  reference: "order_123"
});
```

## Session Status Model

Recommended session states:

```text
pending
validating
validated
awaiting_payment
payment_received
fulfilling
success
failed
expired
canceled
pending_manual_review
```

Recommended payment states:

```text
not_started
awaiting_transfer
received
failed
expired
```

Recommended fulfillment states:

```text
not_required
not_started
pending
success
failed
manual_review
```

## Webhook Requirements

Client-side callbacks are useful, but not reliable enough for merchants because users can close the browser before payment confirmation.

Payscribe should send server-side webhooks to merchants.

Recommended events:

```text
button.session.created
button.session.expired
button.payment.received
button.service.fulfillment.started
button.service.fulfillment.succeeded
button.service.fulfillment.failed
button.session.succeeded
button.session.failed
```

Example webhook payload:

```json
{
  "event": "button.session.succeeded",
  "data": {
    "token": "btn_abc123",
    "reference": "order_123",
    "service": "electricity",
    "amount": 1000,
    "currency": "NGN",
    "paymentStatus": "received",
    "fulfillmentStatus": "success",
    "transactionId": "txn_123",
    "metadata": {
      "meterNumber": "45083082250",
      "provider": "phedc"
    }
  }
}
```

Webhook requirements:

- Sign every webhook.
- Include merchant reference.
- Include session token.
- Include service type.
- Include payment status.
- Include fulfillment status.
- Include transaction ID.
- Retry failed webhook deliveries.
- Allow merchants to requery status if webhook delivery fails.

## Origin And Domain Security

The existing `button_sessions` table reportedly has an `origin` column, but origin allowlisting is not enforced.

For a public embeddable widget, Payscribe should enforce origin/domain restrictions.

Required behavior:

- Merchant configures allowed domains in the Payscribe dashboard.
- `POST /v1/button/init` stores expected origin/domain where appropriate.
- Widget/canvas validates `document.referrer`, `Origin`, or signed session metadata.
- API rejects token usage from unauthorized origins where technically enforceable.
- `postMessage` responses should target the known parent origin, not `*`.

## Idempotency Requirements

Payment and fulfillment must be idempotent.

Required idempotency keys:

- Merchant `reference`
- Session `token`
- Payment transaction ID
- Virtual account ID
- Service fulfillment transaction/reference

Rules:

- A session should not vend the same service twice.
- Reconnecting to the SSE endpoint must not re-trigger fulfillment.
- Replaying a successful transfer/status check must return the existing result.
- If payment succeeds but fulfillment fails, mark the session as failed or `pending_manual_review`; do not silently mark it successful.

## Frontend Widget Requirements

The frontend widget should be framework-agnostic and distributed in two forms:

```text
https://checkout.payscribe.co/widget.js
```

```bash
npm install @payscribe/checkout-js
```

Minimum public API:

```ts
PayscribeCheckout.open({
  sessionToken: "btn_abc123",
  onReady() {},
  onSuccess(result) {},
  onError(error) {},
  onClose() {}
});
```

Recommended additional APIs:

```ts
PayscribeCheckout.close();
PayscribeCheckout.destroy();
```

Widget responsibilities:

- Render modal iframe.
- Load canvas URL with token.
- Receive `postMessage` events from iframe.
- Call user callbacks.
- Prevent duplicate modal instances.
- Work without React/Vue/Svelte.
- Provide TypeScript types for NPM users.

## What We Need From Payscribe Backend Team

The shortest request is:

```text
Complete the existing Payscribe Button Checkout backend so service=airtime, service=data, service=electricity, service=cable, and future services can be validated and fulfilled after payment is received.
```

Specific backend asks:

1. Extend `POST /v1/button/init` to validate and store service-specific metadata.
2. Add `POST /v1/button/session/:token/validate`.
3. Extend `/v1/button/transfer/status/:token` so payment success triggers service fulfillment before final success.
4. Add `GET /v1/button/session/:token/status`.
5. Add merchant webhooks for payment and service fulfillment.
6. Enforce origin/domain allowlisting.
7. Add idempotency around transfer detection and service fulfillment.
8. Return normalized service results to the widget.
9. Keep the secret key server-side only.

## Recommended Implementation Order

1. Rebase the existing `payscribe-button` branch onto current main.
2. Confirm `button_sessions` migrations exist in staging/production.
3. Add service metadata validation to `/v1/button/init`.
4. Add `/v1/button/session/:token/validate`.
5. Implement service fulfillment worker/listener after transfer success.
6. Add `button.session.*` and `button.service.*` webhooks.
7. Add origin allowlisting.
8. Update iframe UI to render service-specific forms and review screens.
9. Publish framework-agnostic widget script and NPM package.

## Summary

Payscribe already has most of the payment collection widget foundation:

- Session token
- Hosted iframe modal
- Public script
- Bank transfer collection
- SSE payment status
- Client callbacks

What is missing is the service checkout layer:

- Service-specific validation
- Service-specific UI data
- Post-payment service fulfillment
- Merchant webhooks
- Origin security
- Idempotent fulfillment

Once those are in place, merchants can use one button or JS call to open a modal and let customers complete payments and purchases without merchants building their own UI for each service.
