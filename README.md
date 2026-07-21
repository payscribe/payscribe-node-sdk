# Payscribe Virtual Accounts SDK

Node.js and TypeScript SDK for Payscribe virtual account collections, with a local Swagger UI playground and a typed consumer test app.

This SDK wraps the Payscribe virtual account endpoints so integrators can call intent-based methods instead of manually building request URLs and payloads.

## Features

- Static/permanent NGN virtual account creation
- Dynamic/temporary NGN virtual account creation
- Virtual account lookup
- Virtual account activation/deactivation
- Payment confirmation
- Sandbox transfer simulation
- Webhook signature verification
- Typed request/response helpers for TypeScript users
- Local Swagger UI playground for manual testing
- Typed consumer app that installs the packed SDK like a real user

## Requirements

- Node.js 18+
- A Payscribe secret API key

## Install

For local development in this repository:

```bash
npm install
```

For users after publishing:

```bash
npm install @payscribe.co/virtual-accounts-sdk
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
import { Payscribe } from "@payscribe.co/virtual-accounts-sdk";

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
import type { CreateStaticVirtualAccountInput } from "@payscribe.co/virtual-accounts-sdk";

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
import type { CreateDynamicVirtualAccountInput } from "@payscribe.co/virtual-accounts-sdk";

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
import { PayscribeApiError } from "@payscribe.co/virtual-accounts-sdk";

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

The repository includes a local Express server with Swagger UI. It calls the SDK internally.

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

`consumer-test/` is a separate TypeScript Node.js app that installs the packed SDK tarball and imports it like a real external user.

From the SDK root:

```bash
npm run build
npm pack
cd consumer-test
npm install ../payscribe-virtual-accounts-sdk-0.1.0.tgz
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
} from "@payscribe.co/virtual-accounts-sdk";
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
import { Payscribe } from "@payscribe.co/virtual-accounts-sdk";
```

```js
const { Payscribe } = require("@payscribe.co/virtual-accounts-sdk");
```

## Publishing

Before publishing, confirm the package name in `package.json`.

Current name:

```json
"@payscribe.co/virtual-accounts-sdk"
```

This requires access to the `@payscribe.co` npm organization. If you do not control that npm scope, rename it before publishing.

Publish flow:

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
