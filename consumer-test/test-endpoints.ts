import "dotenv/config";
import { createHmac } from "node:crypto";
import type {
  CreateDynamicVirtualAccountInput,
  CreateStaticVirtualAccountInput
} from "@payscribe.co/virtual-accounts-sdk";

type VerifyWebhookRequest = {
  rawBody: string;
  signature: string;
};

type EditableEndpointInputs = {
  useCreatedDynamicAccountForGet: boolean;
  accountNumber: string;
  createStaticAccount: CreateStaticVirtualAccountInput;
  createDynamicAccount: CreateDynamicVirtualAccountInput;
  webhookRawBody: string;
};

type TestCase = {
  name: string;
  method: "GET" | "POST";
  path: string | (() => string);
  body?: CreateStaticVirtualAccountInput | CreateDynamicVirtualAccountInput | VerifyWebhookRequest;
  after?: (body: unknown) => void;
};

type PayscribeAccountResponse = {
  message?: {
    details?: {
      account?:
        | {
            account_number?: string;
          }
        | Array<{
            account_number?: string;
          }>;
    };
  };
};

const BASE_URL = process.env.CONSUMER_TEST_BASE_URL ?? "http://localhost:4001";
const SECRET_KEY = process.env.PAYSCRIBE_SECRET_KEY ?? "missing-secret-key";

// Edit these values before running real Payscribe API calls.
const inputs: EditableEndpointInputs = {
  // If true, the GET account test uses the account number returned by
  // createDynamicAccount. Set false to test accountNumber directly.
  useCreatedDynamicAccountForGet: true,
  accountNumber: "5031240100",

  createStaticAccount: {
    customerId: "real-customer-id",
    banks: ["9psb"],
    currency: "NGN"
    // identity: {
    //   type: "bvn",
    //   number: "2233990011"
    // }
  },

  createDynamicAccount: {
    reference: `order_${Date.now()}`,
    amount: 2500,
    amountType: "EXACT",
    description: "Payment for test order",
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
  },

  webhookRawBody: JSON.stringify({
    event_type: "accounts.payment.status",
    trans_id: "test-trans-id",
    amount: 2500,
    currency: "NGN"
  })
};

const webhookSignature = createHmac("sha256", SECRET_KEY)
  .update(inputs.webhookRawBody)
  .digest("hex");

const tests: TestCase[] = [
  {
    name: "Root route",
    method: "GET",
    path: "/"
  },
  {
    name: "Health route",
    method: "GET",
    path: "/health"
  },
  {
    name: "Create static virtual account",
    method: "POST",
    path: "/virtual-accounts/static",
    body: inputs.createStaticAccount
  },
  {
    name: "Create dynamic virtual account",
    method: "POST",
    path: "/virtual-accounts/dynamic",
    body: inputs.createDynamicAccount,
    after: (body) => {
      const account = (body as PayscribeAccountResponse).message?.details?.account;
      const firstAccount = Array.isArray(account) ? account[0] : account;

      if (inputs.useCreatedDynamicAccountForGet && firstAccount?.account_number) {
        inputs.accountNumber = firstAccount.account_number;
      }
    }
  },
  {
    name: "Get virtual account",
    method: "GET",
    path: () => `/virtual-accounts/${encodeURIComponent(inputs.accountNumber)}`
  },
  {
    name: "Verify webhook signature",
    method: "POST",
    path: "/webhooks/verify",
    body: {
      rawBody: inputs.webhookRawBody,
      signature: webhookSignature
    }
  }
];

for (const test of tests) {
  await runTest(test);
}

async function runTest(test: TestCase): Promise<void> {
  const path = typeof test.path === "function" ? test.path() : test.path;
  const url = new URL(path, BASE_URL);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: test.method,
      headers: test.body ? { "Content-Type": "application/json" } : undefined,
      body: test.body ? JSON.stringify(test.body) : undefined
    });

    const responseBody = await readResponseBody(response);
    const duration = Date.now() - startedAt;

    console.log(`\n[${response.ok ? "PASS" : "FAIL"}] ${test.name}`);
    console.log(`${test.method} ${url}`);
    console.log(`Status: ${response.status} ${response.statusText} (${duration}ms)`);
    console.log(formatBody(responseBody));
    test.after?.(responseBody);
  } catch (error) {
    console.log(`\n[ERROR] ${test.name}`);
    console.log(`${test.method} ${url}`);
    console.log(error instanceof Error ? error.message : error);
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function formatBody(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body, null, 2);
}
