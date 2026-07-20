"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Payscribe: () => Payscribe,
  PayscribeApiError: () => PayscribeApiError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var PayscribeApiError = class extends Error {
  statusCode;
  response;
  constructor(message, statusCode, response) {
    super(message);
    this.name = "PayscribeApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
};

// src/http.ts
var BASE_URLS = {
  sandbox: "https://sandbox.payscribe.ng/api/v1/",
  production: "https://api.payscribe.ng/api/v1/"
};
var HttpClient = class {
  baseUrl;
  secretKey;
  constructor(config) {
    if (!config.secretKey) {
      throw new Error("Payscribe secretKey is required.");
    }
    this.secretKey = config.secretKey;
    this.baseUrl = normalizeBaseUrl(
      config.baseUrl ?? BASE_URLS[config.environment ?? "sandbox"]
    );
  }
  async request(method, path, body, options = {}) {
    const response = await fetch(new URL(path, this.baseUrl), {
      method,
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: body === void 0 ? void 0 : JSON.stringify(body)
    });
    const raw = await response.text();
    const parsed = parseJson(raw);
    if (!response.ok) {
      throw new PayscribeApiError(
        extractErrorMessage(parsed, response.statusText),
        response.status,
        parsed
      );
    }
    return parsed;
  }
};
function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}
function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
function extractErrorMessage(response, fallback) {
  if (response && typeof response === "object" && "description" in response) {
    const description = response.description;
    if (typeof description === "string" && description.length > 0) {
      return description;
    }
  }
  return fallback || "Payscribe API request failed.";
}

// src/resources/virtual-accounts.ts
var import_zod = require("zod");
var staticAccountSchema = import_zod.z.object({
  customerId: import_zod.z.string().min(1),
  banks: import_zod.z.array(import_zod.z.string().min(1)).min(1),
  currency: import_zod.z.string().default("NGN"),
  identity: import_zod.z.object({
    type: import_zod.z.string().min(1),
    number: import_zod.z.string().min(1)
  }).optional()
});
var dynamicAccountSchema = import_zod.z.object({
  reference: import_zod.z.string().min(1),
  amount: import_zod.z.number().positive(),
  amountType: import_zod.z.enum(["EXACT", "ANY"]).default("EXACT"),
  description: import_zod.z.string().optional(),
  currency: import_zod.z.string().default("NGN"),
  expiresIn: import_zod.z.object({
    duration: import_zod.z.number().positive(),
    type: import_zod.z.string().min(1)
  }),
  customer: import_zod.z.object({
    name: import_zod.z.string().min(1),
    email: import_zod.z.string().email(),
    phone: import_zod.z.string().min(1)
  })
});
var VirtualAccountsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  createStatic(input) {
    const payload = staticAccountSchema.parse(input);
    return this.http.request("POST", "collections/virtual-accounts/create", {
      account_type: "static",
      currency: payload.currency,
      customer_id: payload.customerId,
      bank: payload.banks,
      ...payload.identity ? {
        identity_type: payload.identity.type,
        identity_number: payload.identity.number
      } : {}
    });
  }
  createDynamic(input) {
    const payload = dynamicAccountSchema.parse(input);
    return this.http.request("POST", "collections/virtual-accounts/create", {
      account_type: "dynamic",
      ref: payload.reference,
      currency: payload.currency,
      order: {
        amount: payload.amount,
        amount_type: payload.amountType,
        description: payload.description ?? `Payment for ${payload.reference}`,
        expiry: {
          duration: payload.expiresIn.duration,
          duration_type: payload.expiresIn.type
        }
      },
      customer: payload.customer
    });
  }
  get(accountNumber) {
    return this.http.request(
      "GET",
      `collections/virtual-accounts/${encodeURIComponent(accountNumber)}`
    );
  }
  deactivate(accountNumber) {
    return this.http.request("POST", "collections/virtual-accounts/deactivate", {
      account: accountNumber
    });
  }
  activate(accountNumber) {
    return this.http.request("POST", "collections/virtual-accounts/activate", {
      account: accountNumber
    });
  }
  confirmPayment(input) {
    return this.http.request("POST", "collections/virtual-accounts/confirm-payment", {
      trans_id: input.transId ?? "",
      session_id: input.sessionId,
      amount: input.amount,
      account_number: input.accountNumber
    });
  }
  simulateTransfer(input) {
    return this.http.request("POST", "collections/virtual-accounts/simulate-transfer", {
      ref: input.reference,
      amount: String(input.amount),
      description: input.description,
      currency: input.currency ?? "NGN",
      account: input.account,
      name: input.name,
      bank: input.bank,
      sender_account_number: input.senderAccountNumber,
      sender_name: input.senderName,
      hash: input.hash
    });
  }
};

// src/resources/webhooks.ts
var import_node_crypto = require("crypto");
var WebhooksResource = class {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  secretKey;
  verifySignature(rawBody, signature) {
    const expected = (0, import_node_crypto.createHmac)("sha256", this.secretKey).update(rawBody).digest("hex");
    return safeCompare(signature, expected);
  }
  constructEvent(input) {
    const signature = Array.isArray(input.signature) ? input.signature[0] : input.signature;
    if (!signature || !this.verifySignature(input.rawBody, signature)) {
      throw new Error("Invalid Payscribe webhook signature.");
    }
    return JSON.parse(Buffer.isBuffer(input.rawBody) ? input.rawBody.toString("utf8") : input.rawBody);
  }
};
function safeCompare(received, expected) {
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return (0, import_node_crypto.timingSafeEqual)(receivedBuffer, expectedBuffer);
}

// src/payscribe.ts
var Payscribe = class {
  virtualAccounts;
  webhooks;
  constructor(config) {
    const http = new HttpClient(config);
    this.virtualAccounts = new VirtualAccountsResource(http);
    this.webhooks = new WebhooksResource(config.secretKey);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Payscribe,
  PayscribeApiError
});
