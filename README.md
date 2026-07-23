# Payscribe SDK

Node.js and TypeScript SDK for Payscribe virtual account collections and virtual card issuing, with a local Swagger UI playground and a typed consumer test app.

This SDK wraps the Payscribe virtual account and virtual card endpoints so integrators can call intent-based methods instead of manually building request URLs and payloads.

## Features

- Static/permanent NGN virtual account creation
- Dynamic/temporary NGN virtual account creation
- Virtual account lookup
- Virtual account activation/deactivation
- Payment confirmation
- Sandbox transfer simulation
- USD virtual card creation
- Card top-up, withdrawal, replacement, freezing, unfreezing, and termination
- Stablecoin-funded card creation and top-up
- Card transaction lookup and cardholder contact updates
- Webhook signature verification
- Typed request/response helpers for TypeScript users
- Local Swagger UI playground for manual testing
- Typed consumer app that installs the published SDK like a real user

## Requirements

- Node.js 18+
- A Payscribe secret API key

## Install

For application usage:

```bash
npm install @payscribe.co/sdk
```

For local development in this repository:

```bash
npm install
```

## Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Set:

```env
PAYSCRIBE_SECRET_KEY=ps_sk_test_YOUR_SECRET_KEY
PAYSCRIBE_ENVIRONMENT=sandbox
PORT=3000
```

Supported environments:

```ts
"sandbox" | "production"
```

Environment URLs:

```text
sandbox    -> https://sandbox.payscribe.ng/api/v1/
production -> https://api.payscribe.ng/api/v1/
```

If `environment` is omitted, the SDK defaults to `sandbox`.

## Client Setup

```ts
import { Payscribe } from "@payscribe.co/sdk";

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  environment: "sandbox"
});
```

You can also provide a custom `baseUrl` for internal testing:

```ts
const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  baseUrl: "https://sandbox.payscribe.ng/api/v1/"
});
```

## Create Static Virtual Account

Use this for a permanent reusable account tied to an existing Payscribe customer.

```ts
const account = await payscribe.virtualAccounts.createStatic({
  customerId: "customer-uuid",
  banks: ["9psb"],
  currency: "NGN"
});
```

With Palmpay identity fields:

```ts
const account = await payscribe.virtualAccounts.createStatic({
  customerId: "customer-uuid",
  banks: ["palmpay"],
  currency: "NGN",
  identity: {
    type: "bvn",
    number: "2233990011"
  }
});
```

Type:

```ts
import type { CreateStaticVirtualAccountInput } from "@payscribe.co/sdk";

const body: CreateStaticVirtualAccountInput = {
  customerId: "customer-uuid",
  banks: ["9psb"],
  currency: "NGN"
};
```

## Create Dynamic Virtual Account

Use this for checkout/order payments with an expiry window.

```ts
const account = await payscribe.virtualAccounts.createDynamic({
  reference: "order_123",
  amount: 2500,
  amountType: "EXACT",
  description: "Payment for order_123",
  currency: "NGN",
  expiresIn: {
    duration: 1,
    type: "hours"
  },
  customer: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "08099228833"
  }
});
```

`amountType` can be:

```ts
"EXACT" | "ANY"
```

Type:

```ts
import type { CreateDynamicVirtualAccountInput } from "@payscribe.co/sdk";

const body: CreateDynamicVirtualAccountInput = {
  reference: "order_123",
  amount: 2500,
  amountType: "EXACT",
  expiresIn: {
    duration: 1,
    type: "hours"
  },
  customer: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "08099228833"
  }
};
```

## Get Virtual Account

```ts
const account = await payscribe.virtualAccounts.get("5031240100");
```

## Deactivate Virtual Account

```ts
const result = await payscribe.virtualAccounts.deactivate("5031240100");
```

## Activate Virtual Account

```ts
const result = await payscribe.virtualAccounts.activate("5031240100");
```

## Confirm Payment

```ts
const payment = await payscribe.virtualAccounts.confirmPayment({
  sessionId: "100004240807072606117680115283",
  amount: 5000,
  accountNumber: "5300000217"
});
```

With a transaction ID:

```ts
const payment = await payscribe.virtualAccounts.confirmPayment({
  transId: "transaction-id",
  sessionId: "100004240807072606117680115283",
  amount: 5000,
  accountNumber: "5300000217"
});
```

## Simulate Transfer

For sandbox testing static account transfers:

```ts
const simulation = await payscribe.virtualAccounts.simulateTransfer({
  reference: "test-ref",
  amount: "4500.00",
  description: "A test transfer",
  currency: "NGN",
  account: "4804760006",
  name: "Ada Lovelace",
  bank: "120001",
  senderAccountNumber: "1100000309",
  senderName: "Ada Lovelace",
  hash: "generated-hash"
});
```

## Create Virtual Card

Use this to issue a USD virtual card for an existing Payscribe customer.

```ts
const card = await payscribe.virtualCards.create({
  customerId: "customer-uuid",
  currency: "USD",
  brand: "VISA",
  amount: 10,
  type: "virtual",
  reference: "card_ref_123"
});
```

For a contactless card, include `contactless` and optional card limits:

```ts
const card = await payscribe.virtualCards.create({
  customerId: "customer-uuid",
  brand: "MASTERCARD",
  amount: 25,
  reference: "contactless_card_ref_123",
  contactless: true,
  cardLimits: {
    dailyLimit: 100,
    transactionLimit: 25
  }
});
```

Type:

```ts
import type { CreateVirtualCardInput } from "@payscribe.co/sdk";

const body: CreateVirtualCardInput = {
  customerId: "customer-uuid",
  brand: "VISA",
  amount: 10,
  reference: "card_ref_123"
};
```

## Create Virtual Card With Stablecoin

Use this when the card should be funded by an on-chain stablecoin deposit instead of your Payscribe USD wallet balance.

```ts
const order = await payscribe.virtualCards.createWithStablecoin({
  customerId: "customer-uuid",
  currency: "USD",
  brand: "VISA",
  amount: 5,
  type: "virtual",
  reference: "stablecoin_card_ref_123",
  stablecoinCurrency: "USDT",
  stablecoinNetwork: "Tron",
  stablecoinChain: "TRC20"
});
```

Payscribe returns a deposit address and amount. The card is created after the stablecoin deposit is confirmed.

## Top Up Virtual Card

```ts
const result = await payscribe.virtualCards.topUp("card-uuid", {
  amount: 10,
  reference: "topup_ref_123"
});
```

With stablecoin:

```ts
const order = await payscribe.virtualCards.topUpWithStablecoin("card-uuid", {
  amount: 10,
  reference: "stablecoin_topup_ref_123",
  stablecoinCurrency: "USDT",
  stablecoinNetwork: "Tron",
  stablecoinChain: "TRC20"
});
```

## Withdraw From Virtual Card

```ts
const result = await payscribe.virtualCards.withdraw("card-uuid", {
  amount: 5,
  reference: "withdraw_ref_123"
});
```

## Get Virtual Card

```ts
const card = await payscribe.virtualCards.get("card-uuid");
```

## Get Virtual Card Transactions

```ts
const transactions = await payscribe.virtualCards.transactions("card-uuid", {
  startDate: "2024-07-01",
  endDate: "2024-07-30",
  pageSize: 20,
  page: 1
});
```

## Virtual Card Controls

```ts
await payscribe.virtualCards.freeze("card-uuid", {
  reference: "freeze_ref_123"
});

await payscribe.virtualCards.unfreeze("card-uuid", {
  reference: "unfreeze_ref_123"
});

await payscribe.virtualCards.terminate("card-uuid", {
  reference: "terminate_ref_123"
});
```

Replace or regularize a card:

```ts
await payscribe.virtualCards.replace("card-uuid");
await payscribe.virtualCards.regularize("card-uuid");
```

## Update Virtual Card Contact

```ts
const result = await payscribe.virtualCards.updateContact("card-uuid", {
  email: "john.doe@example.com",
  mobile: "+2348012345678",
  billingDetails: {
    address1: "12 Broad Street",
    address2: "Suite 4",
    city: "Lagos",
    state: "Lagos",
    zipcode: "100001",
    country: "NG"
  }
});
```

## Webhook Verification

Payscribe webhooks include an `X-Payscribe-Signature` header. Verify it against the raw request body before processing the event.

```ts
const valid = payscribe.webhooks.verifySignature(
  rawBody,
  req.headers["x-payscribe-signature"] as string
);

if (!valid) {
  throw new Error("Invalid webhook signature");
}
```

Parse and verify in one call:

```ts
const event = payscribe.webhooks.constructEvent({
  rawBody,
  signature: req.headers["x-payscribe-signature"]
});

if (event.event_type === "accounts.payment.status") {
  // Process virtual account payment.
}
```

Important: use the raw request body for webhook verification, not a re-stringified JSON object.

## Errors

Failed Payscribe API responses throw `PayscribeApiError`.

```ts
import { PayscribeApiError } from "@payscribe.co/sdk";

try {
  await payscribe.virtualAccounts.get("5031240100");
} catch (error) {
  if (error instanceof PayscribeApiError) {
    console.log(error.statusCode);
    console.log(error.message);
    console.log(error.response);
  }
}
```

## Local Swagger Playground

The repository includes a local Express server with Swagger UI. It calls the SDK internally for virtual account and virtual card requests.

```bash
npm run dev
```

Open:

```text
http://localhost:3000/docs
```

If port `3000` is busy:

```bash
PORT=3001 npm run dev
```

## Typed Consumer Test App

`consumer-test/` is a separate TypeScript Node.js app that installs the published SDK from npm and imports it like a real external user.

Because the generic package name is `@payscribe.co/sdk`, publish that package name first before running the consumer install flow from a clean machine.

From the SDK root:

```bash
cd consumer-test
npm install
cp .env.example .env
```

Set `consumer-test/.env`:

```env
PAYSCRIBE_SECRET_KEY=ps_sk_test_YOUR_SECRET_KEY
PAYSCRIBE_ENVIRONMENT=sandbox
PORT=4001
```

Start the consumer server:

```bash
npm start
```

In another terminal:

```bash
npm run test:endpoints
```

The editable request bodies are in:

```text
consumer-test/test-endpoints.ts
```

They are typed using the SDK exports:

```ts
import type {
  CreateDynamicVirtualAccountInput,
  CreateStaticVirtualAccountInput
} from "@payscribe.co/sdk";
```

## Development Commands

Root SDK:

```bash
npm run typecheck
npm run test
npm run build
```

Consumer app:

```bash
cd consumer-test
npm run typecheck
npm start
npm run test:endpoints
```

## Build Output

Build files are emitted to:

```text
dist/
```

The package exports both ESM and CommonJS:

```ts
import { Payscribe } from "@payscribe.co/sdk";
```

```js
const { Payscribe } = require("@payscribe.co/sdk");
```

## Publishing

The generic package name is:

```bash
npm install @payscribe.co/sdk
```

Package name:

```json
"@payscribe.co/sdk"
```

Publishing requires access to the `@payscribe.co` npm organization.

Release flow:

```bash
npm login
npm run typecheck
npm run test
npm run build
npm publish --access public
```

For a new version:

```bash
npm version patch
npm publish --access public
```

Use `minor` for backwards-compatible features and `major` for breaking changes.
