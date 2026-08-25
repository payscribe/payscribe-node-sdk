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

// src/resources/bills.ts
var import_zod = require("zod");
var nonEmptyString = import_zod.z.string().min(1);
var amount = import_zod.z.union([import_zod.z.number().positive(), nonEmptyString]);
var referenceSchema = import_zod.z.object({
  reference: nonEmptyString.optional()
});
var fetchCableBouquetsSchema = import_zod.z.object({
  service: nonEmptyString
});
var validateCableSchema = import_zod.z.object({
  service: nonEmptyString,
  account: nonEmptyString,
  planId: nonEmptyString,
  month: import_zod.z.number().int().positive().optional()
});
var payCableSchema = import_zod.z.object({
  planId: nonEmptyString,
  customerName: nonEmptyString,
  account: nonEmptyString,
  service: nonEmptyString,
  reference: nonEmptyString,
  phone: nonEmptyString.optional(),
  email: import_zod.z.string().email().optional(),
  month: import_zod.z.number().int().positive().optional()
});
var topUpCableSchema = payCableSchema.omit({ planId: true }).extend({ amount });
var dataLookupSchema = import_zod.z.object({
  network: nonEmptyString.optional(),
  category: nonEmptyString.optional()
});
var vendDataSchema = import_zod.z.object({
  plan: nonEmptyString,
  recipient: import_zod.z.union([nonEmptyString, import_zod.z.array(nonEmptyString).min(1)]),
  network: nonEmptyString,
  reference: nonEmptyString.optional()
});
var purchaseSpectranetPinsSchema = import_zod.z.object({
  planId: nonEmptyString,
  quantity: import_zod.z.number().int().positive(),
  reference: nonEmptyString
});
var purchaseEPinSchema = import_zod.z.object({
  id: nonEmptyString,
  quantity: import_zod.z.number().int().positive(),
  reference: nonEmptyString
});
var lookupJambUserSchema = import_zod.z.object({
  id: import_zod.z.union([import_zod.z.number(), nonEmptyString]),
  account: nonEmptyString
});
var retrieveEPinSchema = import_zod.z.object({
  transactionId: nonEmptyString
});
var airtimeToWalletSchema = import_zod.z.object({
  network: nonEmptyString,
  amount,
  phoneNumber: nonEmptyString,
  from: nonEmptyString,
  reference: nonEmptyString.optional()
});
var validateElectricitySchema = import_zod.z.object({
  meterNumber: nonEmptyString,
  meterType: nonEmptyString,
  amount,
  service: nonEmptyString
});
var payElectricitySchema = validateElectricitySchema.extend({
  customerName: nonEmptyString,
  address: nonEmptyString.optional(),
  phone: nonEmptyString.optional(),
  email: import_zod.z.string().email().optional(),
  reference: nonEmptyString.optional()
});
var requerySchema = import_zod.z.object({
  transactionId: nonEmptyString
});
var smsSchema = import_zod.z.object({
  to: nonEmptyString,
  message: nonEmptyString,
  reference: nonEmptyString.optional(),
  senderId: nonEmptyString.optional()
});
var bettingLookupSchema = import_zod.z.object({
  betId: nonEmptyString,
  customerId: nonEmptyString
});
var fundBettingWalletSchema = bettingLookupSchema.extend({
  customerName: nonEmptyString,
  amount,
  reference: nonEmptyString
});
var vendAirtimeSchema = import_zod.z.object({
  network: nonEmptyString,
  amount,
  recipient: import_zod.z.union([nonEmptyString, import_zod.z.array(nonEmptyString).min(1)]),
  ported: import_zod.z.boolean().optional(),
  reference: nonEmptyString.optional()
});
var bulkAirtimeSchema = import_zod.z.object({
  rows: import_zod.z.array(
    import_zod.z.object({
      phone: nonEmptyString,
      amount: import_zod.z.number().positive(),
      provider: nonEmptyString,
      country: nonEmptyString.optional(),
      reference: nonEmptyString.optional()
    })
  ).min(1),
  reference: nonEmptyString.optional()
});
var internationalProvidersSchema = import_zod.z.object({
  iso: nonEmptyString
});
var internationalProductsSchema = import_zod.z.object({
  iso: nonEmptyString,
  code: nonEmptyString
});
var internationalRateSchema = import_zod.z.object({
  iso: nonEmptyString,
  sku: nonEmptyString,
  amount
});
var vendInternationalBillSchema = import_zod.z.object({
  iso: nonEmptyString,
  providerCode: nonEmptyString,
  sku: nonEmptyString,
  amount,
  account: nonEmptyString,
  debitCurrency: nonEmptyString.optional(),
  reference: nonEmptyString
});
var BillsResource = class {
  constructor(http) {
    this.http = http;
    this.cable = new CableBillsResource(http);
    this.internet = new InternetBillsResource(http);
    this.data = new DataBillsResource(http);
    this.epins = new EPinBillsResource(http);
    this.airtimeToWallet = new AirtimeToWalletBillsResource(http);
    this.electricity = new ElectricityBillsResource(http);
    this.sms = new SmsBillsResource(http);
    this.betting = new BettingBillsResource(http);
    this.airtime = new AirtimeBillsResource(http);
    this.international = new InternationalBillsResource(http);
  }
  http;
  cable;
  internet;
  data;
  epins;
  airtimeToWallet;
  electricity;
  sms;
  betting;
  airtime;
  international;
  requery(input) {
    const payload = requerySchema.parse(input);
    return this.http.request("GET", `requery?${query({ trans_id: payload.transactionId })}`);
  }
};
var CableBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  fetchBouquets(input) {
    const payload = fetchCableBouquetsSchema.parse(input);
    return this.http.request("GET", `bouquets?${query({ service: payload.service })}`);
  }
  validateSmartCard(input) {
    const payload = validateCableSchema.parse(input);
    return this.http.request("POST", "multichoice/validate", {
      service: payload.service,
      account: payload.account,
      month: payload.month,
      plan_id: payload.planId
    });
  }
  pay(input) {
    const payload = payCableSchema.parse(input);
    return this.http.request("POST", "multichoice/vend", {
      plan_id: payload.planId,
      customer_name: payload.customerName,
      account: payload.account,
      service: payload.service,
      ref: payload.reference,
      phone: payload.phone,
      email: payload.email,
      month: payload.month
    });
  }
  topUp(input) {
    const payload = topUpCableSchema.parse(input);
    return this.http.request("POST", "multichoice/topup", {
      amount: payload.amount,
      customer_name: payload.customerName,
      account: payload.account,
      service: payload.service,
      ref: payload.reference,
      phone: payload.phone,
      email: payload.email,
      month: payload.month
    });
  }
};
var InternetBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  listServices() {
    return this.http.request("GET", "internet/list");
  }
  spectranetPinPlans() {
    return this.http.request("GET", "internet/spectranet/pins/plans");
  }
  purchaseSpectranetPins(input) {
    const payload = purchaseSpectranetPinsSchema.parse(input);
    return this.http.request("POST", "internet/spectranet/pins/vend", {
      plan_id: payload.planId,
      qty: payload.quantity,
      ref: payload.reference
    });
  }
};
var DataBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  lookup(input = {}) {
    const payload = dataLookupSchema.parse(input);
    const params = query({
      network: payload.network,
      category: payload.category
    });
    return this.http.request("GET", params ? `data/lookup?${params}` : "data/lookup");
  }
  vend(input) {
    const payload = vendDataSchema.parse(input);
    return this.http.request("POST", "data/vend", {
      plan: payload.plan,
      recipient: payload.recipient,
      network: payload.network,
      ref: payload.reference
    });
  }
};
var EPinBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  list() {
    return this.http.request("GET", "epins");
  }
  purchase(input) {
    const payload = purchaseEPinSchema.parse(input);
    return this.http.request("POST", "epins/vend", {
      qty: payload.quantity,
      id: payload.id,
      ref: payload.reference
    });
  }
  lookupJambUser(input) {
    const payload = lookupJambUserSchema.parse(input);
    return this.http.request("POST", "epins/jamb/user/lookup", {
      id: payload.id,
      account: payload.account
    });
  }
  retrieve(input) {
    const payload = retrieveEPinSchema.parse(input);
    return this.http.request("GET", `epins/retrieve?${query({ trans_id: payload.transactionId })}`);
  }
};
var AirtimeToWalletBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  lookup() {
    return this.http.request("POST", "airtime_to_wallet");
  }
  process(input) {
    const payload = airtimeToWalletSchema.parse(input);
    return this.http.request("POST", "airtime_to_wallet/vend", {
      network: payload.network,
      amount: String(payload.amount),
      phone_number: payload.phoneNumber,
      from: payload.from,
      ref: payload.reference
    });
  }
};
var ElectricityBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  validate(input) {
    const payload = validateElectricitySchema.parse(input);
    return this.http.request("POST", "electricity/validate", {
      meter_number: payload.meterNumber,
      meter_type: payload.meterType,
      amount: payload.amount,
      service: payload.service
    });
  }
  pay(input) {
    const payload = payElectricitySchema.parse(input);
    return this.http.request("POST", "electricity/vend", {
      meter_number: payload.meterNumber,
      meter_type: payload.meterType,
      amount: payload.amount,
      service: payload.service,
      phone: payload.phone,
      email: payload.email,
      customer_name: payload.customerName,
      address: payload.address,
      ref: payload.reference
    });
  }
};
var SmsBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  send(input) {
    const payload = smsSchema.parse(input);
    return this.http.request("POST", "sms", {
      to: payload.to,
      message: payload.message,
      ref: payload.reference,
      sender_id: payload.senderId
    });
  }
};
var BettingBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  listProviders() {
    return this.http.request("GET", "betting/list");
  }
  lookup(input) {
    const payload = bettingLookupSchema.parse(input);
    return this.http.request(
      "GET",
      `betting/lookup?${query({ bet_id: payload.betId, customer_id: payload.customerId })}`
    );
  }
  fundWallet(input) {
    const payload = fundBettingWalletSchema.parse(input);
    return this.http.request("POST", "betting/vend", {
      bet_id: payload.betId,
      customer_id: payload.customerId,
      customer_name: payload.customerName,
      amount: payload.amount,
      ref: payload.reference
    });
  }
};
var AirtimeBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  vend(input) {
    const payload = vendAirtimeSchema.parse(input);
    return this.http.request("POST", "airtime", {
      network: payload.network,
      amount: payload.amount,
      recipient: payload.recipient,
      ported: payload.ported,
      ref: payload.reference
    });
  }
  bulkVend(input) {
    const payload = bulkAirtimeSchema.parse(input);
    return this.http.request("POST", "airtime", {
      rows: payload.rows.map((row) => ({
        phone: row.phone,
        amount: row.amount,
        provider: row.provider,
        country: row.country,
        reference: row.reference
      })),
      ref: payload.reference
    });
  }
};
var InternationalBillsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  countries() {
    return this.http.request("GET", "international-bills/countries");
  }
  providers(input) {
    const payload = internationalProvidersSchema.parse(input);
    return this.http.request("GET", `international-bills/providers?${query({ iso: payload.iso })}`);
  }
  products(input) {
    const payload = internationalProductsSchema.parse(input);
    return this.http.request(
      "GET",
      `international-bills/products?${query({ iso: payload.iso, code: payload.code })}`
    );
  }
  rate(input) {
    const payload = internationalRateSchema.parse(input);
    return this.http.request(
      "GET",
      `international-bills/rate?${query({
        iso: payload.iso,
        sku: payload.sku,
        amount: String(payload.amount)
      })}`
    );
  }
  vend(input) {
    const payload = vendInternationalBillSchema.parse(input);
    return this.http.request("POST", "international-bills/vend", {
      iso: payload.iso,
      provider_code: payload.providerCode,
      sku: payload.sku,
      amount: String(payload.amount),
      account: payload.account,
      debit_currency: payload.debitCurrency,
      ref: payload.reference
    });
  }
};
function query(params) {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0) {
      queryParams.set(key, String(value));
    }
  }
  return queryParams.toString();
}

// src/resources/checkout.ts
var import_zod2 = require("zod");
var createSessionSchema = import_zod2.z.object({
  currency: import_zod2.z.string().min(1).default("NGN"),
  reference: import_zod2.z.string().min(1),
  name: import_zod2.z.string().min(1),
  email: import_zod2.z.string().email(),
  phone: import_zod2.z.string().min(1),
  origin: import_zod2.z.string().url().optional(),
  successUrl: import_zod2.z.string().url().optional(),
  cancelUrl: import_zod2.z.string().url().optional()
});
var transferSchema = import_zod2.z.object({
  token: import_zod2.z.string().min(1),
  name: import_zod2.z.string().min(1).optional(),
  email: import_zod2.z.string().email().optional(),
  amount: import_zod2.z.number().positive()
});
var validateSessionSchema = import_zod2.z.object({
  service: import_zod2.z.enum(["airtime", "data", "electricity", "cable", "betting"]),
  metadata: import_zod2.z.record(import_zod2.z.unknown()),
  amount: import_zod2.z.number().positive()
});
var CheckoutResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  createSession(input) {
    return this.http.request("POST", "button/init", createSessionSchema.parse(input));
  }
  getSession(token) {
    return this.http.request("GET", `button/session/${encodeURIComponent(token)}`);
  }
  validateSession(token, input) {
    return this.http.request(
      "POST",
      `button/session/${encodeURIComponent(token)}/validate`,
      validateSessionSchema.parse(input)
    );
  }
  initializeTransfer(input) {
    return this.http.request("POST", "button/transfer/init", transferSchema.parse(input));
  }
  getSessionStatus(token) {
    return this.http.request("GET", `button/session/${encodeURIComponent(token)}/status`);
  }
};

// src/resources/virtual-accounts.ts
var import_zod3 = require("zod");
var staticAccountSchema = import_zod3.z.object({
  customerId: import_zod3.z.string().min(1),
  banks: import_zod3.z.array(import_zod3.z.string().min(1)).min(1),
  currency: import_zod3.z.string().default("NGN"),
  identity: import_zod3.z.object({
    type: import_zod3.z.string().min(1),
    number: import_zod3.z.string().min(1)
  }).optional()
});
var dynamicAccountSchema = import_zod3.z.object({
  reference: import_zod3.z.string().min(1),
  amount: import_zod3.z.number().positive(),
  amountType: import_zod3.z.enum(["EXACT", "ANY"]).default("EXACT"),
  description: import_zod3.z.string().optional(),
  currency: import_zod3.z.string().default("NGN"),
  expiresIn: import_zod3.z.object({
    duration: import_zod3.z.number().positive(),
    type: import_zod3.z.string().min(1)
  }),
  customer: import_zod3.z.object({
    name: import_zod3.z.string().min(1),
    email: import_zod3.z.string().email(),
    phone: import_zod3.z.string().min(1)
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

// src/resources/virtual-cards.ts
var import_zod4 = require("zod");
var cardLimitsSchema = import_zod4.z.object({
  dailyLimit: import_zod4.z.number().positive().optional(),
  transactionLimit: import_zod4.z.number().positive().optional()
}).optional();
var createCardSchema = import_zod4.z.object({
  customerId: import_zod4.z.string().min(1),
  currency: import_zod4.z.string().default("USD"),
  brand: import_zod4.z.string().min(1),
  amount: import_zod4.z.number().positive(),
  type: import_zod4.z.string().default("virtual"),
  reference: import_zod4.z.string().min(1),
  contactless: import_zod4.z.boolean().optional(),
  cardLimits: cardLimitsSchema
});
var stablecoinFundingSchema = import_zod4.z.object({
  stablecoinCurrency: import_zod4.z.string().default("USDT"),
  stablecoinNetwork: import_zod4.z.string().default("Tron"),
  stablecoinChain: import_zod4.z.string().default("TRC20")
});
var createStablecoinCardSchema = createCardSchema.merge(stablecoinFundingSchema);
var topUpSchema = import_zod4.z.object({
  amount: import_zod4.z.number().positive(),
  reference: import_zod4.z.string().min(1).optional()
});
var topUpStablecoinSchema = topUpSchema.merge(stablecoinFundingSchema);
var withdrawSchema = import_zod4.z.object({
  amount: import_zod4.z.number().positive(),
  reference: import_zod4.z.string().min(1)
});
var referenceSchema2 = import_zod4.z.object({
  reference: import_zod4.z.string().min(1)
});
var transactionsSchema = import_zod4.z.object({
  startDate: import_zod4.z.string().min(1),
  endDate: import_zod4.z.string().min(1),
  pageSize: import_zod4.z.number().int().positive().optional(),
  page: import_zod4.z.number().int().positive().optional()
});
var updateContactSchema = import_zod4.z.object({
  email: import_zod4.z.string().email().optional(),
  mobile: import_zod4.z.string().min(1).optional(),
  billingDetails: import_zod4.z.object({
    address1: import_zod4.z.string().min(1).optional(),
    address2: import_zod4.z.string().min(1).optional(),
    city: import_zod4.z.string().min(1).optional(),
    state: import_zod4.z.string().min(1).optional(),
    zipcode: import_zod4.z.string().min(1).optional(),
    country: import_zod4.z.string().min(1).optional()
  }).optional()
});
var VirtualCardsResource = class {
  constructor(http) {
    this.http = http;
  }
  http;
  create(input) {
    const payload = createCardSchema.parse(input);
    return this.http.request("POST", "cards/create", mapCreateCardPayload(payload));
  }
  createWithStablecoin(input) {
    const payload = createStablecoinCardSchema.parse(input);
    return this.http.request("POST", "cards/create", {
      ...mapCreateCardPayload(payload),
      payment_method: "stablecoin",
      stablecoin_currency: payload.stablecoinCurrency,
      stablecoin_network: payload.stablecoinNetwork,
      stablecoin_chain: payload.stablecoinChain
    });
  }
  topUp(cardId, input) {
    const payload = topUpSchema.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/topup`, {
      amount: payload.amount,
      ...payload.reference ? { ref: payload.reference } : {}
    });
  }
  topUpWithStablecoin(cardId, input) {
    const payload = topUpStablecoinSchema.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/topup`, {
      amount: payload.amount,
      ...payload.reference ? { ref: payload.reference } : {},
      payment_method: "stablecoin",
      stablecoin_currency: payload.stablecoinCurrency,
      stablecoin_network: payload.stablecoinNetwork,
      stablecoin_chain: payload.stablecoinChain
    });
  }
  withdraw(cardId, input) {
    const payload = withdrawSchema.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/withdraw`, {
      amount: payload.amount,
      ref: payload.reference
    });
  }
  get(cardId) {
    return this.http.request("GET", `cards/${encodeURIComponent(cardId)}`);
  }
  replace(cardId) {
    return this.http.request("PATCH", `cards/replace/${encodeURIComponent(cardId)}`);
  }
  regularize(cardId) {
    return this.replace(cardId);
  }
  transactions(cardId, input) {
    const payload = transactionsSchema.parse(input);
    const query2 = new URLSearchParams({
      start_date: payload.startDate,
      end_date: payload.endDate,
      ...payload.pageSize ? { page_size: String(payload.pageSize) } : {},
      ...payload.page ? { page: String(payload.page) } : {}
    });
    return this.http.request(
      "GET",
      `cards/${encodeURIComponent(cardId)}/transactions?${query2.toString()}`
    );
  }
  freeze(cardId, input) {
    const payload = referenceSchema2.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/freeze`, {
      ref: payload.reference
    });
  }
  unfreeze(cardId, input) {
    const payload = referenceSchema2.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/unfreeze`, {
      ref: payload.reference
    });
  }
  terminate(cardId, input) {
    const payload = referenceSchema2.parse(input);
    return this.http.request("POST", `cards/${encodeURIComponent(cardId)}/terminate`, {
      ref: payload.reference
    });
  }
  updateContact(cardId, input) {
    const payload = updateContactSchema.parse(input);
    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/card-contact`, {
      ...payload.email ? { email: payload.email } : {},
      ...payload.mobile ? { mobile: payload.mobile } : {},
      ...payload.billingDetails ? {
        billing_details: {
          address1: payload.billingDetails.address1,
          address2: payload.billingDetails.address2,
          city: payload.billingDetails.city,
          state: payload.billingDetails.state,
          zipcode: payload.billingDetails.zipcode,
          country: payload.billingDetails.country
        }
      } : {}
    });
  }
};
function mapCreateCardPayload(payload) {
  return {
    customer_id: payload.customerId,
    currency: payload.currency,
    brand: payload.brand,
    amount: payload.amount,
    type: payload.type,
    ref: payload.reference,
    ...payload.contactless === void 0 ? {} : { contactless: payload.contactless },
    ...payload.cardLimits ? {
      card_limits: {
        daily_limit: payload.cardLimits.dailyLimit,
        transaction_limit: payload.cardLimits.transactionLimit
      }
    } : {}
  };
}

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
  bills;
  checkout;
  virtualAccounts;
  virtualCards;
  webhooks;
  constructor(config) {
    const http = new HttpClient(config);
    this.bills = new BillsResource(http);
    this.checkout = new CheckoutResource(http);
    this.virtualAccounts = new VirtualAccountsResource(http);
    this.virtualCards = new VirtualCardsResource(http);
    this.webhooks = new WebhooksResource(config.secretKey);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Payscribe,
  PayscribeApiError
});
