# Payscribe SDK

Node.js and TypeScript SDK for Payscribe virtual account collections, virtual card issuing, and bills payments.

```bash
npm install @payscribe/sdk
```

```ts
import { Payscribe } from "@payscribe/sdk";

const payscribe = new Payscribe({
	secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
	environment: "sandbox",
});
```

## Quick Links

- [Features](#features)
- [Setup](#setup)
- [Hosted Checkout](#hosted-checkout)
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
- Hosted checkout session creation, validation, transfer initialization, and status lookup
- Webhook signature verification
- TypeScript request/response types
- Local Swagger playground and typed consumer test app

## Value Guide

Use these values in the examples below:

- `customerId`: the ID of a customer already registered under your Payscribe business.
- `reference`: your unique transaction/order reference. Generate a new one per operation.
- `banks`: virtual account bank providers, for example `["9psb"]` or `["palmpay"]`.
- `currency`: currently `NGN` for virtual accounts and `USD` for virtual cards unless Payscribe enables more currencies for your account.
- `brand`: card brand, usually `VISA` or `MASTERCARD`.
- `type`: card type, usually `virtual`.
- `amount`: amount to debit or fund. Use the unit expected by the Payscribe API for that endpoint.
- `service` for cable: `dstv`, `gotv`, `startimes`, or `dstvshowmax`.
- `network`: `mtn`, `glo`, `airtel`, or `9mobile`.
- `meterType`: `prepaid` or `postpaid`.
- `electricity service`: common values include `ikedc`, `ekedc`, `eedc`, `phedc`, `aedc`, `ibedc`, `kedco`, and `jed`.
- `planId`, `plan`, `sku`, `providerCode`: product identifiers returned by Payscribe lookup/list endpoints. Do not hardcode demo values in production.

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
"sandbox" | "production";
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
	secretKey: process.env.PAYSCRIBE_SECRET_KEY!, // Your Payscribe secret key. Keep this server-side only.
	environment: "sandbox", // Use "sandbox" for testing or "production" for live requests.
});
```

Custom base URL for internal testing:

```ts
const payscribe = new Payscribe({
	secretKey: process.env.PAYSCRIBE_SECRET_KEY!, // Your Payscribe secret key.
	baseUrl: "https://sandbox.payscribe.ng/api/v1/", // Optional. Use only for trusted internal testing.
});
```

</details>



<details id="virtual-accounts">
<summary><strong>Virtual Accounts</strong></summary>

## Create Static Virtual Account

Use this for a permanent reusable account tied to an existing Payscribe customer.

```ts
const account = await payscribe.virtualAccounts.createStatic({
	customerId: "customer-uuid", // Required. ID of a customer already created/registered on Payscribe.
	banks: ["9psb"], // Required. Bank provider code. Common values: "9psb", "palmpay".
	currency: "NGN", // Optional. Defaults to NGN where supported.
});
```

With Palmpay identity fields:

```ts
const account = await payscribe.virtualAccounts.createStatic({
	customerId: "customer-uuid", // Required. ID of a customer already created/registered on Payscribe.
	banks: ["palmpay"], // Palmpay requires an identity object.
	currency: "NGN", // Optional. Defaults to NGN where supported.
	identity: {
		type: "bvn", // Required for Palmpay. Common values: "bvn" or "nin".
		number: "2233990011", // Required. Customer BVN/NIN matching the selected identity type.
	},
});
```

Type:

```ts
import type { CreateStaticVirtualAccountInput } from "@payscribe/sdk";

const body: CreateStaticVirtualAccountInput = {
	customerId: "customer-uuid", // Required. Existing Payscribe customer ID.
	banks: ["9psb"], // Required. One or more supported bank provider codes.
	currency: "NGN", // Optional.
};
```

## Create Dynamic Virtual Account

Use this for checkout/order payments with an expiry window.

```ts
const account = await payscribe.virtualAccounts.createDynamic({
	reference: "order_123", // Required. Your unique order/transaction reference.
	amount: 2500, // Required. Amount expected from the customer.
	amountType: "EXACT", // Optional. "EXACT" requires the exact amount; "ANY" allows any amount.
	description: "Payment for order_123", // Optional. Shown in payment context where supported.
	currency: "NGN", // Optional. Defaults to NGN where supported.
	expiresIn: {
		duration: 1, // Required. Expiry duration value.
		type: "hours", // Required. Accepted examples: "minutes", "minute", "hours", "hour".
	},
	customer: {
		name: "Ada Lovelace", // Required. Customer name for the payment.
		email: "ada@example.com", // Required. Customer email.
		phone: "08099228833", // Required. Customer phone number.
	},
});
```

`amountType` can be:

```ts
"EXACT" | "ANY";
```

Type:

```ts
import type { CreateDynamicVirtualAccountInput } from "@payscribe/sdk";

const body: CreateDynamicVirtualAccountInput = {
	reference: "order_123", // Required. Must be unique for the transaction/order.
	amount: 2500, // Required. Amount expected.
	amountType: "EXACT", // Optional. "EXACT" or "ANY".
	expiresIn: {
		duration: 1, // Required.
		type: "hours", // Required. "minutes" | "minute" | "hours" | "hour".
	},
	customer: {
		name: "Ada Lovelace", // Required.
		email: "ada@example.com", // Required.
		phone: "08099228833", // Required.
	},
};
```

## Other Virtual Account Methods

```ts
const account = await payscribe.virtualAccounts.get("5031240100"); // Virtual account number to retrieve.

await payscribe.virtualAccounts.deactivate("5031240100"); // Disable receiving payments on this account.
await payscribe.virtualAccounts.activate("5031240100"); // Re-enable a deactivated account.

const payment = await payscribe.virtualAccounts.confirmPayment({
	sessionId: "100004240807072606117680115283", // NIP/session ID from the bank transfer/payment notification.
	amount: 5000, // Amount received.
	accountNumber: "5300000217", // Payscribe virtual account number that received the payment.
});

const paymentWithTransaction = await payscribe.virtualAccounts.confirmPayment({
	transId: "transaction-id", // Optional Payscribe transaction ID if already known.
	sessionId: "100004240807072606117680115283", // NIP/session ID.
	amount: 5000, // Amount received.
	accountNumber: "5300000217", // Receiving virtual account number.
});
```

## Simulate Transfer

For sandbox testing static account transfers:

```ts
const simulation = await payscribe.virtualAccounts.simulateTransfer({
	reference: "test-ref", // Required. Unique sandbox test reference.
	amount: "4500.00", // Required. Amount to simulate.
	description: "A test transfer", // Required. Transfer narration.
	currency: "NGN", // Optional. Defaults to NGN where supported.
	account: "4804760006", // Required. Static virtual account number to credit.
	name: "Ada Lovelace", // Required. Receiver/account name.
	bank: "120001", // Required. Bank code used by the sandbox simulation endpoint.
	senderAccountNumber: "1100000309", // Required. Simulated sender account number.
	senderName: "Ada Lovelace", // Required. Simulated sender name.
	hash: "generated-hash", // Required. Sandbox hash generated according to Payscribe simulation docs.
});
```

</details>

<details id="virtual-cards">
<summary><strong>Virtual Cards</strong></summary>

## Create Virtual Card

Use this to issue a USD virtual card for an existing Payscribe customer.

```ts
const card = await payscribe.virtualCards.create({
	customerId: "customer-uuid", // Required. Existing Payscribe customer ID.
	currency: "USD", // Optional. Payscribe cards currently use USD unless otherwise enabled.
	brand: "VISA", // Required. Accepted common values: "VISA" or "MASTERCARD".
	amount: 10, // Required. Initial card funding amount.
	type: "virtual", // Optional. Usually "virtual".
	reference: "card_ref_123", // Required. Your unique card creation reference.
});
```

For a contactless card, include `contactless` and optional card limits:

```ts
const card = await payscribe.virtualCards.create({
	customerId: "customer-uuid", // Required. Existing Payscribe customer ID.
	brand: "MASTERCARD", // Required. Accepted common values: "VISA" or "MASTERCARD".
	amount: 25, // Required. Initial card funding amount.
	reference: "contactless_card_ref_123", // Required. Unique reference.
	contactless: true, // Optional. Enables contactless card support where available.
	cardLimits: {
		dailyLimit: 100, // Optional. Maximum daily spend allowed on the card.
		transactionLimit: 25, // Optional. Maximum single transaction amount.
	},
});
```

Type:

```ts
import type { CreateVirtualCardInput } from "@payscribe/sdk";

const body: CreateVirtualCardInput = {
	customerId: "customer-uuid", // Required. Existing Payscribe customer ID.
	brand: "VISA", // Required. "VISA" or "MASTERCARD".
	amount: 10, // Required. Initial funding amount.
	reference: "card_ref_123", // Required. Unique reference.
};
```

## Card Creation Using Stablecoin

```ts
const order = await payscribe.virtualCards.createWithStablecoin({
	customerId: "customer-uuid", // Required. Existing Payscribe customer ID.
	currency: "USD", // Optional. Card currency.
	brand: "VISA", // Required. "VISA" or "MASTERCARD".
	amount: 5, // Required. Card funding amount expected from the stablecoin payment.
	type: "virtual", // Optional. Usually "virtual".
	reference: "stablecoin_card_ref_123", // Required. Unique reference.
	stablecoinCurrency: "USDT", // Optional. Common values: "USDT", "USDC".
	stablecoinNetwork: "Tron", // Optional. Common values: "Tron", "Ethereum", "BNB".
	stablecoinChain: "TRC20", // Optional. Common values: "TRC20", "ERC20", "BEP20".
});
```

Payscribe returns a deposit address and amount. The card is created after the stablecoin deposit is confirmed.

## Card Funding And Withdrawals

In the examples below, `card-uuid` is the card ID returned by Payscribe when the card was created.

```ts
await payscribe.virtualCards.topUp("card-uuid", {
	amount: 10, // Required. Amount to add to the card.
	reference: "topup_ref_123", // Optional but recommended. Unique top-up reference.
});

await payscribe.virtualCards.topUpWithStablecoin("card-uuid", {
	amount: 10, // Required. Amount to add to the card after stablecoin payment.
	reference: "stablecoin_topup_ref_123", // Optional but recommended. Unique reference.
	stablecoinCurrency: "USDT", // Optional. "USDT" or "USDC".
	stablecoinNetwork: "Tron", // Optional. "Tron", "Ethereum", or "BNB".
	stablecoinChain: "TRC20", // Optional. "TRC20", "ERC20", or "BEP20".
});

await payscribe.virtualCards.withdraw("card-uuid", {
	amount: 5, // Required. Amount to withdraw from the card.
	reference: "withdraw_ref_123", // Required. Unique withdrawal reference.
});
```

## Card Lookup And Controls

Use the Payscribe card ID for every card lookup/control method.

```ts
const card = await payscribe.virtualCards.get("card-uuid"); // Card ID returned by Payscribe when the card was created.

const transactions = await payscribe.virtualCards.transactions("card-uuid", {
	startDate: "2024-07-01", // Required. Start date for transaction search.
	endDate: "2024-07-30", // Required. End date for transaction search.
	pageSize: 20, // Optional. Number of records per page.
	page: 1, // Optional. Page number.
});

await payscribe.virtualCards.freeze("card-uuid", {
	reference: "freeze_ref_123", // Required. Unique freeze reference.
});

await payscribe.virtualCards.unfreeze("card-uuid", {
	reference: "unfreeze_ref_123", // Required. Unique unfreeze reference.
});

await payscribe.virtualCards.terminate("card-uuid", {
	reference: "terminate_ref_123", // Required. Unique termination reference.
});

await payscribe.virtualCards.replace("card-uuid"); // Replace a card by its Payscribe card ID.
await payscribe.virtualCards.regularize("card-uuid"); // Alias for replace, kept for API naming compatibility.
```

## Update Virtual Card Contact

Use this when you need to update the cardholder contact or billing details attached to an issued card.

```ts
const result = await payscribe.virtualCards.updateContact("card-uuid", {
	email: "john.doe@example.com", // Optional. New cardholder email.
	mobile: "+2348012345678", // Optional. New cardholder phone number.
	billingDetails: {
		address1: "12 Broad Street", // Optional. Billing street address.
		address2: "Suite 4", // Optional. Additional address line.
		city: "Lagos", // Optional. Billing city.
		state: "Lagos", // Optional. Billing state.
		zipcode: "100001", // Optional. Postal/ZIP code.
		country: "NG", // Optional. ISO country code.
	},
});
```

</details>

<details id="bills-payments">
<summary><strong>Bills Payments</strong></summary>

Bills are exposed under `payscribe.bills`, grouped by product category.

## Cable TV

```ts
const bouquets = await payscribe.bills.cable.fetchBouquets({
	service: "dstv", // Required. Cable provider. Common values: "dstv", "gotv", "startimes", "dstvshowmax".
});

const validation = await payscribe.bills.cable.validateSmartCard({
	service: "dstv", // Required. Same provider selected by the customer.
	account: "8062415043", // Required. Customer smartcard/IUC number.
	month: 1, // Optional. Number of months to subscribe for.
	planId: "PLAN_CODE", // Required. Plan ID returned by fetchBouquets().
});

const payment = await payscribe.bills.cable.pay({
	planId: "PLAN_CODE", // Required. Plan ID returned by fetchBouquets().
	customerName: "Ada Lovelace", // Required. Name returned from validation or entered by customer.
	account: "8062415043", // Required. Customer smartcard/IUC number.
	service: "dstv", // Required. Cable provider.
	reference: "cable_ref_123", // Required. Your unique transaction reference.
	phone: "08199228811", // Optional. Customer phone number.
	email: "ada@example.com", // Optional. Customer email.
	month: 1, // Optional. Number of months.
});
```

## Data

```ts
const plans = await payscribe.bills.data.lookup({
	network: "mtn", // Optional. Network provider. Common values: "mtn", "glo", "airtel", "9mobile".
	category: "sme", // Optional. Plan category if supported by the provider.
});

const data = await payscribe.bills.data.vend({
	network: "mtn", // Required. Network provider.
	plan: "PSPLAN_177", // Required. Plan code returned by data.lookup().
	recipient: ["08169254598", "07038067493"], // Required. One phone number or an array of phone numbers.
	reference: "data_ref_123", // Optional but recommended. Unique transaction reference.
});
```

## Electricity

```ts
const meter = await payscribe.bills.electricity.validate({
	meterNumber: "45083082250", // Required. Customer meter number.
	meterType: "prepaid", // Required. "prepaid" or "postpaid".
	amount: 1000, // Required. Amount to validate/pay.
	service: "phedc", // Required. Disco/provider code, e.g. "ikedc", "ekedc", "eedc", "phedc", "aedc".
});

const vend = await payscribe.bills.electricity.pay({
	meterNumber: "45083082250", // Required. Customer meter number.
	meterType: "prepaid", // Required. "prepaid" or "postpaid".
	amount: 1000, // Required. Amount to vend.
	service: "phedc", // Required. Electricity provider/disco code.
	customerName: "Ada Lovelace", // Required. Name returned from validation or entered by customer.
	phone: "07038067493", // Optional. Customer phone number.
	reference: "electricity_ref_123", // Optional but recommended. Unique transaction reference.
});
```

## Airtime

```ts
const airtime = await payscribe.bills.airtime.vend({
	network: "mtn", // Required. Network provider: "mtn", "glo", "airtel", or "9mobile".
	amount: 50, // Required. Airtime amount.
	recipient: "08169254598", // Required. Phone number, or an array of phone numbers.
	ported: false, // Optional. Set true if the number was ported to another network.
	reference: "airtime_ref_123", // Optional but recommended. Unique transaction reference.
});

const bulkAirtime = await payscribe.bills.airtime.bulkVend({
	rows: [
		{ phone: "08169254598", amount: 50, provider: "mtn", country: "NG" }, // country is optional.
		{ phone: "08012345678", amount: 100, provider: "airtel", country: "NG" },
	],
	reference: "bulk_airtime_ref_123", // Optional but recommended. Unique batch reference.
});
```

## Betting

```ts
const providers = await payscribe.bills.betting.listProviders();

const account = await payscribe.bills.betting.lookup({
	betId: "bet9ja", // Required. Betting provider ID returned by listProviders().
	customerId: "422984", // Required. Customer betting wallet/account ID, not a Payscribe customer ID.
});

const funding = await payscribe.bills.betting.fundWallet({
	betId: "bet9ja", // Required. Betting provider ID.
	customerId: "422984", // Required. Customer betting wallet/account ID.
	customerName: "Ada Lovelace", // Required. Name returned from lookup or entered by customer.
	amount: 100, // Required. Wallet funding amount.
	reference: "betting_ref_123", // Required. Unique transaction reference.
});
```

## International Bills

```ts
const countries = await payscribe.bills.international.countries();

const providers = await payscribe.bills.international.providers({
	iso: "GH", // Required. Destination country ISO code from countries(), e.g. "GH".
});

const products = await payscribe.bills.international.products({
	iso: "GH", // Required. Destination country ISO code.
	code: "MTGH", // Required. Provider code returned by international.providers().
});

const rate = await payscribe.bills.international.rate({
	iso: "GH", // Required. Destination country ISO code.
	sku: "GH_MT_TopUp", // Required. Product SKU returned by international.products().
	amount: 1.2, // Required. Amount to price/convert.
});

const internationalVend = await payscribe.bills.international.vend({
	iso: "GH", // Required. Destination country ISO code.
	providerCode: "MTGH", // Required. Provider code returned by international.providers().
	sku: "GH_MT_TopUp", // Required. Product SKU returned by international.products().
	amount: "1.5", // Required. Amount to vend.
	account: "233547011800", // Required. Recipient account/phone/customer identifier required by the product.
	debitCurrency: "ngn", // Optional. Currency to debit from your wallet where supported.
	reference: "intl_ref_123", // Required. Unique transaction reference.
});
```

## Other Bills Helpers

```ts
await payscribe.bills.internet.listServices();
await payscribe.bills.internet.spectranetPinPlans();
await payscribe.bills.internet.purchaseSpectranetPins({
	planId: "PSPLAN_1270", // Required. Plan ID returned by spectranetPinPlans().
	quantity: 1, // Required. Number of pins to buy.
	reference: "spectranet_ref_123", // Required. Unique transaction reference.
});

await payscribe.bills.epins.list();
await payscribe.bills.epins.purchase({
	id: "neco", // Required. E-pin product ID returned by epins.list().
	quantity: 1, // Required. Number of pins to buy.
	reference: "epin_ref_123", // Required. Unique transaction reference.
});

await payscribe.bills.airtimeToWallet.lookup();
await payscribe.bills.sms.send({
	to: "08169254598", // Required. Recipient phone number.
	message: "Hello Payscribe!", // Required. SMS body.
	reference: "sms_ref_123", // Optional but recommended. Unique transaction reference.
});

await payscribe.bills.requery({
	transactionId: "transaction-id", // Required. Payscribe transaction ID to requery.
});
```

</details>

<details id="hosted-checkout">
<summary><strong>Hosted Checkout</strong></summary>

## Create a Checkout Session

Create checkout sessions on your server. Never expose your Payscribe secret key in browser code.

```ts
import { Payscribe } from "@payscribe/sdk";

const payscribe = new Payscribe({
	secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
	environment: "sandbox",
});

const session = await payscribe.checkout.createSession({
	amount: 1000,
	currency: "NGN",
	reference: `airtime_${crypto.randomUUID()}`, // Generate a unique reference for every attempt.
	name: "Ada Lovelace",
	email: "ada@example.com",
	phone: "08012345678",
	service: "airtime",
	metadata: {
		network: "mtn",
		recipient: "08012345678",
	},
	origin: "https://merchant.example.com",
	successUrl: "https://merchant.example.com/payment/success",
	cancelUrl: "https://merchant.example.com/payment/canceled",
});

// session.data contains token, canvas_url, and expires_at.
```

Supported services and metadata:

| Service | Metadata fields |
| --- | --- |
| `pay` | No service metadata required |
| `airtime` | `network`, `recipient` |
| `data` | `network`, `recipient`, `plan` |
| `electricity` | `provider`, `meterNumber`, `meterType` (`prepaid` or `postpaid`) |
| `cable` | `provider`, `account`, `planId` |
| `betting` | `provider`, `account` |

## Frontend Framework Guides

Select your frontend setup below. These examples all use a checkout session created securely by your backend.

<details>
<summary><strong>HTML / Script Tag</strong></summary>

### Open the Hosted Checkout

You can redirect the customer to `session.data.canvas_url`, or open it in the Payscribe modal from your frontend:

```html
<button id="checkout-button" type="button">Pay with Payscribe</button>
<script src="https://checkout.payscribe.co/widget.js"></script>
<script>
  document.querySelector("#checkout-button").addEventListener("click", async () => {
    // This endpoint belongs to your application and creates the session server-side.
    const response = await fetch("/api/checkout-session", { method: "POST" });
    const session = await response.json();

    PayscribeCheckout.open({
      sessionToken: session.token,
      canvasUrl: session.canvas_url,
      onSuccess(result) {
        console.log("Checkout completed", result);
      },
      onError(error) {
        console.error("Checkout failed", error);
      },
      onClose() {
        console.log("Checkout closed");
      }
    });
  });
</script>
```

</details>

<details>
<summary><strong>React / Vite</strong></summary>

Install the browser checkout package in your frontend project:

```bash
npm install @payscribe/checkout-js
```

The Node SDK and browser package have different responsibilities:

- `@payscribe/sdk` runs on your server and uses your secret key to create the checkout session.
- `@payscribe/checkout-js` runs in React, Vite, Vue, Svelte, or another browser application and opens the returned session.

Never import a secret key into frontend code or store it in a `VITE_*`, `NEXT_PUBLIC_*`, or similar public environment variable.

React component:

```tsx
import { useEffect, useState } from "react";
import PayscribeCheckout from "@payscribe/checkout-js";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => PayscribeCheckout.destroy();
  }, []);

  async function openCheckout() {
    setLoading(true);

    try {
      // Your server creates the session with @payscribe/sdk.
      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "airtime-1000" }),
      });

      if (!response.ok) throw new Error("Unable to create checkout session");
      const session = await response.json();

      PayscribeCheckout.open({
        sessionToken: session.token,
        canvasUrl: session.canvas_url,
        onSuccess(result) {
          console.log("Checkout completed", result);
        },
        onError(error) {
          console.error("Checkout failed", error);
        },
        onClose() {
          console.log("Checkout closed");
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={openCheckout} disabled={loading}>
      {loading ? "Opening checkout…" : "Pay with Payscribe"}
    </button>
  );
}
```

This works in a standard Vite React application without adding a script tag to `index.html`.

</details>

<details>
<summary><strong>JavaScript / Vue / Svelte</strong></summary>

### Vite or Any JavaScript Framework

Import the package from any browser entry point, component, store, or action:

```ts
import PayscribeCheckout from "@payscribe/checkout-js";

export async function startCheckout() {
  const response = await fetch("/api/checkout-session", { method: "POST" });
  if (!response.ok) throw new Error("Unable to create checkout session");

  const session = await response.json();

  return PayscribeCheckout.open({
    sessionToken: session.token,
    canvasUrl: session.canvas_url,
    onSuccess: (result) => console.log(result),
    onError: (error) => console.error(error),
  });
}
```

The returned controller can close or destroy the active modal:

```ts
const checkout = await startCheckout();

checkout.close();
checkout.destroy();
```

For Vue, call `startCheckout()` from a click handler and call `PayscribeCheckout.destroy()` from `onUnmounted`. For Svelte, call it from an event handler and return `PayscribeCheckout.destroy` from `onDestroy`.

</details>

<details>
<summary><strong>Next.js / SSR Frameworks</strong></summary>

Load the browser package only on the client:

```tsx
"use client";

export async function openCheckout(session: {
  token: string;
  canvas_url: string;
}) {
  const { default: PayscribeCheckout } = await import("@payscribe/checkout-js");

  PayscribeCheckout.open({
    sessionToken: session.token,
    canvasUrl: session.canvas_url,
  });
}
```

Do not call the browser package during server rendering because it creates DOM elements and an iframe.

</details>

Your server endpoint can return only the public session details:

```ts
app.post("/api/checkout-session", async (_request, response) => {
	const result = await payscribe.checkout.createSession({
		amount: 1000,
		currency: "NGN",
		reference: `order_${crypto.randomUUID()}`,
		name: "Ada Lovelace",
		email: "ada@example.com",
		phone: "08012345678",
		service: "pay",
		origin: "https://merchant.example.com",
	});

	response.json(result.data);
});
```

## Existing Session Operations

```ts
const checkout = await payscribe.checkout.getSession("btn_SESSION_TOKEN");

const validation = await payscribe.checkout.validateSession("btn_SESSION_TOKEN", {
	provider: "phedc",
	meterNumber: "45083082250",
	meterType: "prepaid",
});

const transfer = await payscribe.checkout.initializeTransfer({
	token: "btn_SESSION_TOKEN",
	name: "Ada Lovelace",
	email: "ada@example.com",
	amount: 1000,
});

const status = await payscribe.checkout.getSessionStatus("btn_SESSION_TOKEN");
```

The hosted canvas normally performs the session lookup, transfer initialization, and status polling for you. Use these methods directly only when building a trusted server-side workflow or troubleshooting an integration.

</details>

<details id="webhooks-and-errors">
<summary><strong>Webhooks And Errors</strong></summary>

## Webhook Verification

Payscribe webhooks include an `X-Payscribe-Signature` header. Verify it against the raw request body before processing the event.

```ts
const valid = payscribe.webhooks.verifySignature(
	rawBody,
	req.headers["x-payscribe-signature"] as string,
);

if (!valid) {
	throw new Error("Invalid webhook signature");
}
```

Parse and verify in one call:

```ts
const event = payscribe.webhooks.constructEvent({
	rawBody,
	signature: req.headers["x-payscribe-signature"],
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
	CreateStaticVirtualAccountInput,
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
