/**
 * LLM context file for AI assistants and documentation crawlers.
 *
 * This file is intentionally concise and structured. It describes the public
 * SDK API, examples, request shapes, environment behavior, and common failure
 * modes for @payscribe.co/virtual-accounts-sdk.
 */

export const payscribeVirtualAccountsSdkLlmContext = {
  package: {
    name: "@payscribe.co/virtual-accounts-sdk",
    version: "0.1.0",
    runtime: "Node.js 18+",
    language: "TypeScript",
    moduleFormats: ["ESM", "CommonJS"],
    purpose:
      "Node.js/TypeScript SDK for Payscribe NGN virtual account collections."
  },

  install: {
    npm: "npm install @payscribe.co/virtual-accounts-sdk"
  },

  environments: {
    sandbox: "https://sandbox.payscribe.ng/api/v1/",
    production: "https://api.payscribe.ng/api/v1/",
    default: "sandbox"
  },

  imports: {
    esm: 'import { Payscribe } from "@payscribe.co/virtual-accounts-sdk";',
    commonjs:
      'const { Payscribe } = require("@payscribe.co/virtual-accounts-sdk");',
    types:
      'import type { CreateStaticVirtualAccountInput, CreateDynamicVirtualAccountInput } from "@payscribe.co/virtual-accounts-sdk";'
  },

  clientSetup: {
    example: `
import { Payscribe } from "@payscribe.co/virtual-accounts-sdk";

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
        "consumer-test is a separate TypeScript app that installs the packed SDK tarball as a real dependency.",
      commands: [
        "npm run build",
        "npm pack",
        "cd consumer-test",
        "npm install ../payscribe.co-virtual-accounts-sdk-0.1.0.tgz",
        "cp .env.example .env",
        "npm start",
        "npm run test:endpoints"
      ],
      editableBodiesFile: "consumer-test/test-endpoints.ts"
    }
  },

  publish: {
    packageName: "@payscribe.co/virtual-accounts-sdk",
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

export default payscribeVirtualAccountsSdkLlmContext;
