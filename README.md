# Payscribe SDK

Node.js and TypeScript SDK for Payscribe virtual account collections, virtual card issuing, and bills payments.

```bash
npm install @payscribe/sdk
```

```ts
import { Payscribe } from "@payscribe/sdk";

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  environment: "sandbox"
});
```

## Quick Links

- [Features](#features)
- [Setup](#setup)
- [Virtual Accounts](#virtual-accounts)
- [Virtual Cards](#virtual-cards)
- [Bills Payments](#bills-payments)
- [Webhooks And Errors](#webhooks-and-errors)
- [Local Testing](#local-testing)
- [Publishing](#publishing)

## Features

- Static and dynamic NGN virtual accounts
- Virtual account lookup, activation, deactivation, payment confirmation, and sandbox transfer simulation
- USD virtual card creation, top-up, withdrawal, replacement, freeze, unfreeze, and termination
- Stablecoin-funded virtual card creation and top-up
- Card transaction lookup and cardholder contact updates
- Bills lookup, validation, vending, and requery flows
- Webhook signature verification
- TypeScript request/response types
- Local Swagger playground and typed consumer test app

<details id="setup">
<summary><strong>Setup</strong></summary>

## Requirements

- Node.js 18+
- A Payscribe secret API key

## Install

For application usage:

```bash
npm install @payscribe/sdk
```

For local development in this repository:

```bash
npm install
```

## Environment

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

## Client

```ts
import { Payscribe } from "@payscribe/sdk";

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  environment: "sandbox"
});
```

Custom base URL for internal testing:

```ts
const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  baseUrl: "https://sandbox.payscribe.ng/api/v1/"
});
```

</details>

<details id="virtual-accounts">
<summary><strong>Virtual Accounts</strong></summary>

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
import type { CreateStaticVirtualAccountInput } from "@payscribe/sdk";

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
import type { CreateDynamicVirtualAccountInput } from "@payscribe/sdk";

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

## Other Virtual Account Methods

```ts
const account = await payscribe.virtualAccounts.get("5031240100");

await payscribe.virtualAccounts.deactivate("5031240100");
await payscribe.virtualAccounts.activate("5031240100");

const payment = await payscribe.virtualAccounts.confirmPayment({
  sessionId: "100004240807072606117680115283",
  amount: 5000,
  accountNumber: "5300000217"
});

const paymentWithTransaction = await payscribe.virtualAccounts.confirmPayment({
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

</details>

<details id="virtual-cards">
<summary><strong>Virtual Cards</strong></summary>

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
import type { CreateVirtualCardInput } from "@payscribe/sdk";

const body: CreateVirtualCardInput = {
  customerId: "customer-uuid",
  brand: "VISA",
  amount: 10,
  reference: "card_ref_123"
};
```

## Stablecoin Card Funding

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

## Card Funding And Withdrawals

```ts
await payscribe.virtualCards.topUp("card-uuid", {
  amount: 10,
  reference: "topup_ref_123"
});

await payscribe.virtualCards.topUpWithStablecoin("card-uuid", {
  amount: 10,
  reference: "stablecoin_topup_ref_123",
  stablecoinCurrency: "USDT",
  stablecoinNetwork: "Tron",
  stablecoinChain: "TRC20"
});

await payscribe.virtualCards.withdraw("card-uuid", {
  amount: 5,
  reference: "withdraw_ref_123"
});
```

## Card Lookup And Controls

```ts
const card = await payscribe.virtualCards.get("card-uuid");

const transactions = await payscribe.virtualCards.transactions("card-uuid", {
  startDate: "2024-07-01",
  endDate: "2024-07-30",
  pageSize: 20,
  page: 1
});

await payscribe.virtualCards.freeze("card-uuid", {
  reference: "freeze_ref_123"
});

await payscribe.virtualCards.unfreeze("card-uuid", {
  reference: "unfreeze_ref_123"
});

await payscribe.virtualCards.terminate("card-uuid", {
  reference: "terminate_ref_123"
});

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

</details>

<details id="bills-payments">
<summary><strong>Bills Payments</strong></summary>

Bills are exposed under `payscribe.bills`, grouped by product category.

## Cable TV

```ts
const bouquets = await payscribe.bills.cable.fetchBouquets({
  service: "dstv"
});

const validation = await payscribe.bills.cable.validateSmartCard({
  service: "dstv",
  account: "8062415043",
  month: 1,
  planId: "PLAN_CODE"
});

const payment = await payscribe.bills.cable.pay({
  planId: "PLAN_CODE",
  customerName: "Ada Lovelace",
  account: "8062415043",
  service: "dstv",
  reference: "cable_ref_123",
  phone: "08199228811",
  email: "ada@example.com",
  month: 1
});
```

## Data

```ts
const plans = await payscribe.bills.data.lookup({
  network: "mtn",
  category: "sme"
});

const data = await payscribe.bills.data.vend({
  network: "mtn",
  plan: "PSPLAN_177",
  recipient: ["08169254598", "07038067493"],
  reference: "data_ref_123"
});
```

## Electricity

```ts
const meter = await payscribe.bills.electricity.validate({
  meterNumber: "45083082250",
  meterType: "prepaid",
  amount: 1000,
  service: "phedc"
});

const vend = await payscribe.bills.electricity.pay({
  meterNumber: "45083082250",
  meterType: "prepaid",
  amount: 1000,
  service: "phedc",
  customerName: "Ada Lovelace",
  phone: "07038067493",
  reference: "electricity_ref_123"
});
```

## Airtime

```ts
const airtime = await payscribe.bills.airtime.vend({
  network: "mtn",
  amount: 50,
  recipient: "08169254598",
  ported: false,
  reference: "airtime_ref_123"
});

const bulkAirtime = await payscribe.bills.airtime.bulkVend({
  rows: [
    { phone: "08169254598", amount: 50, provider: "mtn", country: "NG" },
    { phone: "08012345678", amount: 100, provider: "airtel", country: "NG" }
  ],
  reference: "bulk_airtime_ref_123"
});
```

## Betting

```ts
const providers = await payscribe.bills.betting.listProviders();

const account = await payscribe.bills.betting.lookup({
  betId: "bet9ja",
  customerId: "422984"
});

const funding = await payscribe.bills.betting.fundWallet({
  betId: "bet9ja",
  customerId: "422984",
  customerName: "Ada Lovelace",
  amount: 100,
  reference: "betting_ref_123"
});
```

## International Bills

```ts
const countries = await payscribe.bills.international.countries();

const providers = await payscribe.bills.international.providers({
  iso: "GH"
});

const products = await payscribe.bills.international.products({
  iso: "GH",
  code: "MTGH"
});

const rate = await payscribe.bills.international.rate({
  iso: "GH",
  sku: "GH_MT_TopUp",
  amount: 1.2
});

const internationalVend = await payscribe.bills.international.vend({
  iso: "GH",
  providerCode: "MTGH",
  sku: "GH_MT_TopUp",
  amount: "1.5",
  account: "233547011800",
  debitCurrency: "ngn",
  reference: "intl_ref_123"
});
```

## Other Bills Helpers

```ts
await payscribe.bills.internet.listServices();
await payscribe.bills.internet.spectranetPinPlans();
await payscribe.bills.internet.purchaseSpectranetPins({
  planId: "PSPLAN_1270",
  quantity: 1,
  reference: "spectranet_ref_123"
});

await payscribe.bills.epins.list();
await payscribe.bills.epins.purchase({
  id: "neco",
  quantity: 1,
  reference: "epin_ref_123"
});

await payscribe.bills.airtimeToWallet.lookup();
await payscribe.bills.sms.send({
  to: "08169254598",
  message: "Hello Payscribe!",
  reference: "sms_ref_123"
});

await payscribe.bills.requery({
  transactionId: "transaction-id"
});
```

</details>

<details id="webhooks-and-errors">
<summary><strong>Webhooks And Errors</strong></summary>

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
import { PayscribeApiError } from "@payscribe/sdk";

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

</details>

<details id="local-testing">
<summary><strong>Local Testing</strong></summary>

## Local Swagger Playground

The repository includes a local Express server with Swagger UI. It calls the SDK internally for virtual account, virtual card, bills, and webhook requests.

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

Because the generic package name is `@payscribe/sdk`, publish that package name first before running the consumer install flow from a clean machine.

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

Open the consumer Swagger UI:

```text
http://localhost:4001/docs
```

The consumer Swagger UI calls the installed SDK package through the `consumer-test` Express server.

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
} from "@payscribe/sdk";
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

</details>

<details id="publishing">
<summary><strong>Publishing</strong></summary>

## Build Output

Build files are emitted to:

```text
dist/
```

The package exports both ESM and CommonJS:

```ts
import { Payscribe } from "@payscribe/sdk";
```

```js
const { Payscribe } = require("@payscribe/sdk");
```

## Publish To npm

Package name:

```json
"@payscribe/sdk"
```

Publishing requires access to the `@payscribe` npm organization.

Release flow:

```bash
npm login
npm whoami
npm run typecheck
npm run test
npm run build
npm pack --dry-run
npm publish --access public
```

For a new version:

```bash
npm version patch
npm publish --access public
```

Use `minor` for backwards-compatible features and `major` for breaking changes.

</details>
