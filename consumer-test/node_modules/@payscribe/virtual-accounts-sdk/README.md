# Payscribe Virtual Accounts SDK

Node.js/TypeScript SDK plus a local Swagger UI playground for testing Payscribe virtual account flows.

## Install

```bash
npm install
```

## Configure

```bash
cp .env.example .env
```

Set `PAYSCRIBE_SECRET_KEY` in `.env`.

## Run Swagger UI

```bash
npm run dev
```

Open:

```text
http://localhost:3000/docs
```

## SDK Usage

```ts
import { Payscribe } from "@payscribe/virtual-accounts-sdk";

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  environment: "sandbox",
});

const account = await payscribe.virtualAccounts.createStatic({
  customerId: "customer-uuid",
  banks: ["9psb"],
});
```

## Supported Virtual Account Methods

- `createStatic`
- `createDynamic`
- `get`
- `activate`
- `deactivate`
- `confirmPayment`
- `simulateTransfer`
- `webhooks.verifySignature`
- `webhooks.constructEvent`
# SDKs
