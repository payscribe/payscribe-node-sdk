# Payscribe SDK Consumer Test

This is a separate TypeScript Node.js app that installs the packed SDK tarball and imports it as a normal external package.

The request bodies are typed from the SDK exports, so editors can show the interface for each endpoint body.

## Setup

From the SDK root:

```bash
npm run build
npm pack
cd consumer-test
npm install ../payscribe-virtual-accounts-sdk-0.1.0.tgz
cp .env.example .env
npm start
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
