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
import { z } from "zod";
var nonEmptyString = z.string().min(1);
var amount = z.union([z.number().positive(), nonEmptyString]);
var referenceSchema = z.object({
  reference: nonEmptyString.optional()
});
var fetchCableBouquetsSchema = z.object({
  service: nonEmptyString
});
var validateCableSchema = z.object({
  service: nonEmptyString,
  account: nonEmptyString,
  planId: nonEmptyString,
  month: z.number().int().positive().optional()
});
var payCableSchema = z.object({
  planId: nonEmptyString,
  customerName: nonEmptyString,
  account: nonEmptyString,
  service: nonEmptyString,
  reference: nonEmptyString,
  phone: nonEmptyString.optional(),
  email: z.string().email().optional(),
  month: z.number().int().positive().optional()
});
var topUpCableSchema = payCableSchema.omit({ planId: true }).extend({ amount });
var dataLookupSchema = z.object({
  network: nonEmptyString.optional(),
  category: nonEmptyString.optional()
});
var vendDataSchema = z.object({
  plan: nonEmptyString,
  recipient: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]),
  network: nonEmptyString,
  reference: nonEmptyString.optional()
});
var purchaseSpectranetPinsSchema = z.object({
  planId: nonEmptyString,
  quantity: z.number().int().positive(),
  reference: nonEmptyString
});
var purchaseEPinSchema = z.object({
  id: nonEmptyString,
  quantity: z.number().int().positive(),
  reference: nonEmptyString
});
var lookupJambUserSchema = z.object({
  id: z.union([z.number(), nonEmptyString]),
  account: nonEmptyString
});
var retrieveEPinSchema = z.object({
  transactionId: nonEmptyString
});
var airtimeToWalletSchema = z.object({
  network: nonEmptyString,
  amount,
  phoneNumber: nonEmptyString,
  from: nonEmptyString,
  reference: nonEmptyString.optional()
});
var validateElectricitySchema = z.object({
  meterNumber: nonEmptyString,
  meterType: nonEmptyString,
  amount,
  service: nonEmptyString
});
var payElectricitySchema = validateElectricitySchema.extend({
  customerName: nonEmptyString,
  address: nonEmptyString.optional(),
  phone: nonEmptyString.optional(),
  email: z.string().email().optional(),
  reference: nonEmptyString.optional()
});
var requerySchema = z.object({
  transactionId: nonEmptyString
});
var smsSchema = z.object({
  to: nonEmptyString,
  message: nonEmptyString,
  reference: nonEmptyString.optional(),
  senderId: nonEmptyString.optional()
});
var bettingLookupSchema = z.object({
  betId: nonEmptyString,
  customerId: nonEmptyString
});
var fundBettingWalletSchema = bettingLookupSchema.extend({
  customerName: nonEmptyString,
  amount,
  reference: nonEmptyString
});
var vendAirtimeSchema = z.object({
  network: nonEmptyString,
  amount,
  recipient: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]),
  ported: z.boolean().optional(),
  reference: nonEmptyString.optional()
});
var bulkAirtimeSchema = z.object({
  rows: z.array(
    z.object({
      phone: nonEmptyString,
      amount: z.number().positive(),
      provider: nonEmptyString,
      country: nonEmptyString.optional(),
      reference: nonEmptyString.optional()
    })
  ).min(1),
  reference: nonEmptyString.optional()
});
var internationalProvidersSchema = z.object({
  iso: nonEmptyString
});
var internationalProductsSchema = z.object({
  iso: nonEmptyString,
  code: nonEmptyString
});
var internationalRateSchema = z.object({
  iso: nonEmptyString,
  sku: nonEmptyString,
  amount
});
var vendInternationalBillSchema = z.object({
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
import { z as z2 } from "zod";
var createSessionSchema = z2.object({
  amount: z2.number().positive(),
  currency: z2.string().min(1).default("NGN"),
  reference: z2.string().min(1),
  name: z2.string().min(1),
  email: z2.string().email(),
  phone: z2.string().min(1),
  service: z2.enum(["pay", "airtime", "data", "electricity", "cable", "betting", "bills"]),
  metadata: z2.record(z2.unknown()).optional(),
  origin: z2.string().url().optional(),
  allowedOrigin: z2.string().url().optional(),
  successUrl: z2.string().url().optional(),
  cancelUrl: z2.string().url().optional()
});
var transferSchema = z2.object({
  token: z2.string().min(1),
  name: z2.string().min(1).optional(),
  email: z2.string().email().optional(),
  amount: z2.number().positive()
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
      input
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
import { z as z3 } from "zod";
var staticAccountSchema = z3.object({
  customerId: z3.string().min(1),
  banks: z3.array(z3.string().min(1)).min(1),
  currency: z3.string().default("NGN"),
  identity: z3.object({
    type: z3.string().min(1),
    number: z3.string().min(1)
  }).optional()
});
var dynamicAccountSchema = z3.object({
  reference: z3.string().min(1),
  amount: z3.number().positive(),
  amountType: z3.enum(["EXACT", "ANY"]).default("EXACT"),
  description: z3.string().optional(),
  currency: z3.string().default("NGN"),
  expiresIn: z3.object({
    duration: z3.number().positive(),
    type: z3.string().min(1)
  }),
  customer: z3.object({
    name: z3.string().min(1),
    email: z3.string().email(),
    phone: z3.string().min(1)
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
import { z as z4 } from "zod";
var cardLimitsSchema = z4.object({
  dailyLimit: z4.number().positive().optional(),
  transactionLimit: z4.number().positive().optional()
}).optional();
var createCardSchema = z4.object({
  customerId: z4.string().min(1),
  currency: z4.string().default("USD"),
  brand: z4.string().min(1),
  amount: z4.number().positive(),
  type: z4.string().default("virtual"),
  reference: z4.string().min(1),
  contactless: z4.boolean().optional(),
  cardLimits: cardLimitsSchema
});
var stablecoinFundingSchema = z4.object({
  stablecoinCurrency: z4.string().default("USDT"),
  stablecoinNetwork: z4.string().default("Tron"),
  stablecoinChain: z4.string().default("TRC20")
});
var createStablecoinCardSchema = createCardSchema.merge(stablecoinFundingSchema);
var topUpSchema = z4.object({
  amount: z4.number().positive(),
  reference: z4.string().min(1).optional()
});
var topUpStablecoinSchema = topUpSchema.merge(stablecoinFundingSchema);
var withdrawSchema = z4.object({
  amount: z4.number().positive(),
  reference: z4.string().min(1)
});
var referenceSchema2 = z4.object({
  reference: z4.string().min(1)
});
var transactionsSchema = z4.object({
  startDate: z4.string().min(1),
  endDate: z4.string().min(1),
  pageSize: z4.number().int().positive().optional(),
  page: z4.number().int().positive().optional()
});
var updateContactSchema = z4.object({
  email: z4.string().email().optional(),
  mobile: z4.string().min(1).optional(),
  billingDetails: z4.object({
    address1: z4.string().min(1).optional(),
    address2: z4.string().min(1).optional(),
    city: z4.string().min(1).optional(),
    state: z4.string().min(1).optional(),
    zipcode: z4.string().min(1).optional(),
    country: z4.string().min(1).optional()
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
import { createHmac, timingSafeEqual } from "crypto";
var WebhooksResource = class {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  secretKey;
  verifySignature(rawBody, signature) {
    const expected = createHmac("sha256", this.secretKey).update(rawBody).digest("hex");
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
  return timingSafeEqual(receivedBuffer, expectedBuffer);
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
export {
  Payscribe,
  PayscribeApiError
};
