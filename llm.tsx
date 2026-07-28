/**
 * LLM context file for AI assistants and documentation crawlers.
 *
 * This file is intentionally concise and structured. It describes the public
 * SDK API, examples, request shapes, environment behavior, and common failure
 * modes for @payscribe.co/sdk.
 */

export const payscribeSdkLlmContext = {
  package: {
    name: "@payscribe.co/sdk",
    version: "0.1.0",
    runtime: "Node.js 18+",
    language: "TypeScript",
    moduleFormats: ["ESM", "CommonJS"],
    purpose:
      "Node.js/TypeScript SDK for Payscribe NGN virtual account collections and USD virtual card issuing."
  },

  install: {
    npm: "npm install @payscribe.co/sdk"
  },

  environments: {
    sandbox: "https://sandbox.payscribe.ng/api/v1/",
    production: "https://api.payscribe.ng/api/v1/",
    default: "sandbox"
  },

  imports: {
    esm: 'import { Payscribe } from "@payscribe.co/sdk";',
    commonjs:
      'const { Payscribe } = require("@payscribe.co/sdk");',
    types:
      'import type { CreateStaticVirtualAccountInput, CreateDynamicVirtualAccountInput, CreateVirtualCardInput } from "@payscribe.co/sdk";'
  },

  clientSetup: {
    example: `
import { Payscribe } from "@payscribe.co/sdk";

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY!,
  environment: "sandbox"
});
`.trim()
  },

  resources: {
    virtualAccounts: {
      createStatic: {
        description:
          "Create a permanent reusable NGN virtual account for an existing Payscribe customer.",
        sdkCall: "payscribe.virtualAccounts.createStatic(input)",
        payscribeEndpoint: "POST /collections/virtual-accounts/create",
        mappedPayloadFields: {
          account_type: "static",
          customer_id: "input.customerId",
          bank: "input.banks",
          currency: 'input.currency ?? "NGN"',
          identity_type: "input.identity.type, optional",
          identity_number: "input.identity.number, optional"
        },
        inputType: `
type CreateStaticVirtualAccountInput = {
  customerId: string;
  banks: Array<"9psb" | "palmpay" | string>;
  currency?: "NGN" | string;
  identity?: {
    type: "bvn" | "nin" | string;
    number: string;
  };
};
`.trim(),
        example: `
await payscribe.virtualAccounts.createStatic({
  customerId: "customer-uuid",
  banks: ["9psb"],
  currency: "NGN"
});
`.trim(),
        commonErrors: [
          "404/400 customer not found: create or use a valid customer first",
          "401 unauthenticated: confirm secretKey and environment"
        ]
      },

      createDynamic: {
        description:
          "Create a temporary NGN virtual account for a payment/order with an expiry window.",
        sdkCall: "payscribe.virtualAccounts.createDynamic(input)",
        payscribeEndpoint: "POST /collections/virtual-accounts/create",
        mappedPayloadFields: {
          account_type: "dynamic",
          ref: "input.reference",
          currency: 'input.currency ?? "NGN"',
          order: "amount, amount_type, description, expiry",
          customer: "name, email, phone"
        },
        inputType: `
type CreateDynamicVirtualAccountInput = {
  reference: string;
  amount: number;
  amountType?: "EXACT" | "ANY";
  description?: string;
  currency?: "NGN" | string;
  expiresIn: {
    duration: number;
    type: "minutes" | "minute" | "hours" | "hour";
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};
`.trim(),
        example: `
await payscribe.virtualAccounts.createDynamic({
  reference: "order_123",
  amount: 2500,
  amountType: "EXACT",
  description: "Payment for order_123",
  currency: "NGN",
  expiresIn: { duration: 1, type: "hours" },
  customer: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "08099228833"
  }
});
`.trim()
      },

      get: {
        description: "Fetch virtual account details by account number.",
        sdkCall: 'payscribe.virtualAccounts.get("5031240100")',
        payscribeEndpoint: "GET /collections/virtual-accounts/{accountNumber}"
      },

      deactivate: {
        description: "Deactivate a virtual account.",
        sdkCall: 'payscribe.virtualAccounts.deactivate("5031240100")',
        payscribeEndpoint: "POST /collections/virtual-accounts/deactivate"
      },

      activate: {
        description: "Reactivate a virtual account.",
        sdkCall: 'payscribe.virtualAccounts.activate("5031240100")',
        payscribeEndpoint: "POST /collections/virtual-accounts/activate"
      },

      confirmPayment: {
        description:
          "Confirm/reconcile a virtual account payment using session/account details.",
        sdkCall: "payscribe.virtualAccounts.confirmPayment(input)",
        payscribeEndpoint: "POST /collections/virtual-accounts/confirm-payment",
        inputType: `
type ConfirmVirtualAccountPaymentInput = {
  transId?: string;
  sessionId: string;
  amount: number;
  accountNumber: string;
};
`.trim(),
        example: `
await payscribe.virtualAccounts.confirmPayment({
  sessionId: "100004240807072606117680115283",
  amount: 5000,
  accountNumber: "5300000217"
});
`.trim()
      },

      simulateTransfer: {
        description:
          "Sandbox helper for simulating a transfer to a static virtual account.",
        sdkCall: "payscribe.virtualAccounts.simulateTransfer(input)",
        payscribeEndpoint: "POST /collections/virtual-accounts/simulate-transfer",
        inputType: `
type SimulateVirtualAccountTransferInput = {
  reference: string;
  amount: string | number;
  description: string;
  currency?: "NGN" | string;
  account: string;
  name: string;
  bank: string;
  senderAccountNumber: string;
  senderName: string;
  hash: string;
};
`.trim()
      }
    },

    virtualCards: {
      create: {
        description:
          "Create a USD virtual card for an existing Payscribe customer.",
        sdkCall: "payscribe.virtualCards.create(input)",
        payscribeEndpoint: "POST /cards/create",
        mappedPayloadFields: {
          customer_id: "input.customerId",
          currency: 'input.currency ?? "USD"',
          brand: "input.brand",
          amount: "input.amount",
          type: 'input.type ?? "virtual"',
          ref: "input.reference",
          contactless: "input.contactless, optional",
          card_limits: "daily_limit and transaction_limit, optional"
        },
        inputType: `
type CreateVirtualCardInput = {
  customerId: string;
  currency?: "USD" | string;
  brand: "VISA" | "MASTERCARD" | string;
  amount: number;
  type?: "virtual" | "physical" | string;
  reference: string;
  contactless?: boolean;
  cardLimits?: {
    dailyLimit?: number;
    transactionLimit?: number;
  };
};
`.trim(),
        example: `
await payscribe.virtualCards.create({
  customerId: "customer-uuid",
  brand: "VISA",
  amount: 10,
  reference: "card_ref_123"
});
`.trim()
      },

      createWithStablecoin: {
        description:
          "Create a card using a stablecoin deposit instead of Payscribe USD wallet balance.",
        sdkCall: "payscribe.virtualCards.createWithStablecoin(input)",
        payscribeEndpoint: "POST /cards/create",
        additionalPayloadFields: {
          payment_method: "stablecoin",
          stablecoin_currency: 'input.stablecoinCurrency ?? "USDT"',
          stablecoin_network: 'input.stablecoinNetwork ?? "Tron"',
          stablecoin_chain: 'input.stablecoinChain ?? "TRC20"'
        },
        example: `
await payscribe.virtualCards.createWithStablecoin({
  customerId: "customer-uuid",
  brand: "VISA",
  amount: 5,
  reference: "stablecoin_card_ref_123",
  stablecoinCurrency: "USDT",
  stablecoinNetwork: "Tron",
  stablecoinChain: "TRC20"
});
`.trim()
      },

      topUp: {
        description: "Top up an existing virtual card from wallet balance.",
        sdkCall: 'payscribe.virtualCards.topUp("card-uuid", input)',
        payscribeEndpoint: "PATCH /cards/{cardId}/topup",
        inputType: `
type TopUpVirtualCardInput = {
  amount: number;
  reference?: string;
};
`.trim()
      },

      topUpWithStablecoin: {
        description: "Top up an existing virtual card using stablecoin funding.",
        sdkCall: 'payscribe.virtualCards.topUpWithStablecoin("card-uuid", input)',
        payscribeEndpoint: "PATCH /cards/{cardId}/topup"
      },

      withdraw: {
        description: "Withdraw a specified amount from a virtual card balance.",
        sdkCall: 'payscribe.virtualCards.withdraw("card-uuid", input)',
        payscribeEndpoint: "PATCH /cards/{cardId}/withdraw"
      },

      get: {
        description: "Fetch virtual card details by card ID.",
        sdkCall: 'payscribe.virtualCards.get("card-uuid")',
        payscribeEndpoint: "GET /cards/{cardId}"
      },

      replace: {
        description: "Replace a card associated with a decommissioned BIN.",
        sdkCall: 'payscribe.virtualCards.replace("card-uuid")',
        payscribeEndpoint: "PATCH /cards/replace/{cardId}"
      },

      regularize: {
        description: "Alias for replace.",
        sdkCall: 'payscribe.virtualCards.regularize("card-uuid")',
        payscribeEndpoint: "PATCH /cards/replace/{cardId}"
      },

      transactions: {
        description: "Fetch card transactions for a date range.",
        sdkCall: 'payscribe.virtualCards.transactions("card-uuid", input)',
        payscribeEndpoint:
          "GET /cards/{cardId}/transactions?start_date&end_date&page_size&page"
      },

      freeze: {
        description: "Freeze a virtual card.",
        sdkCall: 'payscribe.virtualCards.freeze("card-uuid", { reference })',
        payscribeEndpoint: "PATCH /cards/{cardId}/freeze"
      },

      unfreeze: {
        description: "Unfreeze a virtual card.",
        sdkCall: 'payscribe.virtualCards.unfreeze("card-uuid", { reference })',
        payscribeEndpoint: "PATCH /cards/{cardId}/unfreeze"
      },

      terminate: {
        description: "Terminate a virtual card. This action cannot be reversed.",
        sdkCall: 'payscribe.virtualCards.terminate("card-uuid", { reference })',
        payscribeEndpoint: "POST /cards/{cardId}/terminate"
      },

      updateContact: {
        description: "Update cardholder contact and billing details.",
        sdkCall: 'payscribe.virtualCards.updateContact("card-uuid", input)',
        payscribeEndpoint: "PATCH /cards/{cardId}/card-contact"
      }
    },

    bills: {
      description:
        "Bills payment SDK resource for lookup, validation, vend/payment, and requery flows.",
      resource: "payscribe.bills",
      groups: {
        cable: [
          "fetchBouquets({ service }) -> GET /bouquets?service",
          "validateSmartCard({ service, account, planId, month }) -> POST /multichoice/validate",
          "pay({ planId, customerName, account, service, reference, phone, email, month }) -> POST /multichoice/vend",
          "topUp({ amount, customerName, account, service, reference, phone, email, month }) -> POST /multichoice/topup"
        ],
        data: [
          "lookup({ network, category }) -> GET /data/lookup",
          "vend({ plan, recipient, network, reference }) -> POST /data/vend"
        ],
        electricity: [
          "validate({ meterNumber, meterType, amount, service }) -> POST /electricity/validate",
          "pay({ meterNumber, meterType, amount, service, customerName, address, phone, email, reference }) -> POST /electricity/vend"
        ],
        airtime: [
          "vend({ network, amount, recipient, ported, reference }) -> POST /airtime",
          "bulkVend({ rows, reference }) -> POST /airtime"
        ],
        betting: [
          "listProviders() -> GET /betting/list",
          "lookup({ betId, customerId }) -> GET /betting/lookup",
          "fundWallet({ betId, customerId, customerName, amount, reference }) -> POST /betting/vend"
        ],
        international: [
          "countries() -> GET /international-bills/countries",
          "providers({ iso }) -> GET /international-bills/providers",
          "products({ iso, code }) -> GET /international-bills/products",
          "rate({ iso, sku, amount }) -> GET /international-bills/rate",
          "vend({ iso, providerCode, sku, amount, account, debitCurrency, reference }) -> POST /international-bills/vend"
        ],
        other: [
          "internet.listServices()",
          "internet.spectranetPinPlans()",
          "internet.purchaseSpectranetPins({ planId, quantity, reference })",
          "epins.list()",
          "epins.purchase({ id, quantity, reference })",
          "epins.lookupJambUser({ id, account })",
          "epins.retrieve({ transactionId })",
          "airtimeToWallet.lookup()",
          "airtimeToWallet.process({ network, amount, phoneNumber, from, reference })",
          "sms.send({ to, message, reference, senderId })",
          "requery({ transactionId })"
        ]
      },
      example: `
await payscribe.bills.electricity.validate({
  meterNumber: "45083082250",
  meterType: "prepaid",
  amount: 1000,
  service: "phedc"
});

await payscribe.bills.electricity.pay({
  meterNumber: "45083082250",
  meterType: "prepaid",
  amount: 1000,
  service: "phedc",
  customerName: "Ada Lovelace",
  reference: "electricity_ref_123"
});
`.trim()
    },

    webhooks: {
      verifySignature: {
        description:
          "Verify X-Payscribe-Signature with HMAC-SHA256(secretKey, rawBody).",
        sdkCall: "payscribe.webhooks.verifySignature(rawBody, signature)",
        important:
          "Use the raw request body. Do not verify against parsed/re-stringified JSON.",
        example: `
const valid = payscribe.webhooks.verifySignature(
  rawBody,
  req.headers["x-payscribe-signature"] as string
);
`.trim()
      },

      constructEvent: {
        description:
          "Verify the webhook signature and parse the event payload in one call.",
        sdkCall: "payscribe.webhooks.constructEvent({ rawBody, signature })",
        example: `
const event = payscribe.webhooks.constructEvent({
  rawBody,
  signature: req.headers["x-payscribe-signature"]
});

if (event.event_type === "accounts.payment.status") {
  // Process virtual account payment.
}
`.trim()
      }
    }
  },

  errorHandling: {
    className: "PayscribeApiError",
    fields: ["statusCode", "message", "response"],
    example: `
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
`.trim()
  },

  localTesting: {
    swaggerPlayground: {
      start: "npm run dev",
      url: "http://localhost:3000/docs",
      alternatePort: "PORT=3001 npm run dev"
    },
    consumerTest: {
      description:
        "consumer-test is a separate TypeScript app that installs the published SDK from npm as a real dependency.",
      commands: [
        "cd consumer-test",
        "npm install",
        "cp .env.example .env",
        "npm start",
        "npm run test:endpoints"
      ],
      editableBodiesFile: "consumer-test/test-endpoints.ts"
    }
  },

  publish: {
    packageName: "@payscribe.co/sdk",
    commands: [
      "npm run typecheck",
      "npm run test",
      "npm run build",
      "npm pack --dry-run",
      "npm publish --access public"
    ],
    note:
      "Publishing requires admin/package publish access to the payscribe.co npm organization."
  }
} as const;

export default payscribeSdkLlmContext;
