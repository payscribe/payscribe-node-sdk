# Payscribe SDK Consumer Test

This is a separate TypeScript Node.js app that installs the published SDK from npm and imports it as a normal external package.

The request bodies are typed from the SDK exports, so editors can show the interface for each endpoint body.

The generic package name is `@payscribe/sdk`. Publish that package name first before running this consumer install flow from a clean machine.

## Setup

From the SDK root:

```bash
cd consumer-test
npm install
cp .env.example .env
npm start
```

Open Swagger UI:

```text
http://localhost:4001/docs
```

If port `4001` is busy:

```bash
PORT=4002 npm start
```

## Typecheck

```bash
npm run typecheck
```

## Test All Routes

Start the server first:

```bash
npm start
```

In another terminal:

```bash
npm run test:endpoints
```

Edit the typed request payloads in:

```text
test-endpoints.ts
```

## Routes

```text
GET  /health
POST /virtual-accounts/static
POST /virtual-accounts/dynamic
GET  /virtual-accounts/:accountNumber
POST /webhooks/verify
```

Example static account request:

```ts
const createStaticAccount: CreateStaticVirtualAccountInput = {
  customerId: "customer-uuid",
  banks: ["9psb"],
  currency: "NGN"
};
```
