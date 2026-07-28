import { z } from "zod";
import type { HttpClient } from "../http.js";
import type {
  BettingLookupInput,
  BillsResponse,
  BulkAirtimeInput,
  DataLookupInput,
  FetchCableBouquetsInput,
  FundBettingWalletInput,
  InternationalProductsInput,
  InternationalProvidersInput,
  InternationalRateInput,
  LookupJambUserInput,
  PayCableInput,
  PayElectricityInput,
  ProcessAirtimeToWalletInput,
  PurchaseEPinInput,
  PurchaseSpectranetPinsInput,
  RequeryTransactionInput,
  RetrieveEPinInput,
  SendBulkSmsInput,
  TopUpCableInput,
  ValidateCableSmartCardInput,
  ValidateElectricityInput,
  VendAirtimeInput,
  VendDataInput,
  VendInternationalBillInput
} from "../types/bills.js";

const nonEmptyString = z.string().min(1);
const amount = z.union([z.number().positive(), nonEmptyString]);

const referenceSchema = z.object({
  reference: nonEmptyString.optional()
});

const fetchCableBouquetsSchema = z.object({
  service: nonEmptyString
});

const validateCableSchema = z.object({
  service: nonEmptyString,
  account: nonEmptyString,
  planId: nonEmptyString,
  month: z.number().int().positive().optional()
});

const payCableSchema = z.object({
  planId: nonEmptyString,
  customerName: nonEmptyString,
  account: nonEmptyString,
  service: nonEmptyString,
  reference: nonEmptyString,
  phone: nonEmptyString.optional(),
  email: z.string().email().optional(),
  month: z.number().int().positive().optional()
});

const topUpCableSchema = payCableSchema
  .omit({ planId: true })
  .extend({ amount });

const dataLookupSchema = z.object({
  network: nonEmptyString.optional(),
  category: nonEmptyString.optional()
});

const vendDataSchema = z.object({
  plan: nonEmptyString,
  recipient: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]),
  network: nonEmptyString,
  reference: nonEmptyString.optional()
});

const purchaseSpectranetPinsSchema = z.object({
  planId: nonEmptyString,
  quantity: z.number().int().positive(),
  reference: nonEmptyString
});

const purchaseEPinSchema = z.object({
  id: nonEmptyString,
  quantity: z.number().int().positive(),
  reference: nonEmptyString
});

const lookupJambUserSchema = z.object({
  id: z.union([z.number(), nonEmptyString]),
  account: nonEmptyString
});

const retrieveEPinSchema = z.object({
  transactionId: nonEmptyString
});

const airtimeToWalletSchema = z.object({
  network: nonEmptyString,
  amount,
  phoneNumber: nonEmptyString,
  from: nonEmptyString,
  reference: nonEmptyString.optional()
});

const validateElectricitySchema = z.object({
  meterNumber: nonEmptyString,
  meterType: nonEmptyString,
  amount,
  service: nonEmptyString
});

const payElectricitySchema = validateElectricitySchema.extend({
  customerName: nonEmptyString,
  address: nonEmptyString.optional(),
  phone: nonEmptyString.optional(),
  email: z.string().email().optional(),
  reference: nonEmptyString.optional()
});

const requerySchema = z.object({
  transactionId: nonEmptyString
});

const smsSchema = z.object({
  to: nonEmptyString,
  message: nonEmptyString,
  reference: nonEmptyString.optional(),
  senderId: nonEmptyString.optional()
});

const bettingLookupSchema = z.object({
  betId: nonEmptyString,
  customerId: nonEmptyString
});

const fundBettingWalletSchema = bettingLookupSchema.extend({
  customerName: nonEmptyString,
  amount,
  reference: nonEmptyString
});

const vendAirtimeSchema = z.object({
  network: nonEmptyString,
  amount,
  recipient: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]),
  ported: z.boolean().optional(),
  reference: nonEmptyString.optional()
});

const bulkAirtimeSchema = z.object({
  rows: z
    .array(
      z.object({
        phone: nonEmptyString,
        amount: z.number().positive(),
        provider: nonEmptyString,
        country: nonEmptyString.optional(),
        reference: nonEmptyString.optional()
      })
    )
    .min(1),
  reference: nonEmptyString.optional()
});

const internationalProvidersSchema = z.object({
  iso: nonEmptyString
});

const internationalProductsSchema = z.object({
  iso: nonEmptyString,
  code: nonEmptyString
});

const internationalRateSchema = z.object({
  iso: nonEmptyString,
  sku: nonEmptyString,
  amount
});

const vendInternationalBillSchema = z.object({
  iso: nonEmptyString,
  providerCode: nonEmptyString,
  sku: nonEmptyString,
  amount,
  account: nonEmptyString,
  debitCurrency: nonEmptyString.optional(),
  reference: nonEmptyString
});

export class BillsResource {
  readonly cable: CableBillsResource;
  readonly internet: InternetBillsResource;
  readonly data: DataBillsResource;
  readonly epins: EPinBillsResource;
  readonly airtimeToWallet: AirtimeToWalletBillsResource;
  readonly electricity: ElectricityBillsResource;
  readonly sms: SmsBillsResource;
  readonly betting: BettingBillsResource;
  readonly airtime: AirtimeBillsResource;
  readonly international: InternationalBillsResource;

  constructor(private readonly http: HttpClient) {
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

  requery(input: RequeryTransactionInput): Promise<BillsResponse> {
    const payload = requerySchema.parse(input);

    return this.http.request("GET", `requery?${query({ trans_id: payload.transactionId })}`);
  }
}

export class CableBillsResource {
  constructor(private readonly http: HttpClient) {}

  fetchBouquets(input: FetchCableBouquetsInput): Promise<BillsResponse> {
    const payload = fetchCableBouquetsSchema.parse(input);

    return this.http.request("GET", `bouquets?${query({ service: payload.service })}`);
  }

  validateSmartCard(input: ValidateCableSmartCardInput): Promise<BillsResponse> {
    const payload = validateCableSchema.parse(input);

    return this.http.request("POST", "multichoice/validate", {
      service: payload.service,
      account: payload.account,
      month: payload.month,
      plan_id: payload.planId
    });
  }

  pay(input: PayCableInput): Promise<BillsResponse> {
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

  topUp(input: TopUpCableInput): Promise<BillsResponse> {
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
}

export class InternetBillsResource {
  constructor(private readonly http: HttpClient) {}

  listServices(): Promise<BillsResponse> {
    return this.http.request("GET", "internet/list");
  }

  spectranetPinPlans(): Promise<BillsResponse> {
    return this.http.request("GET", "internet/spectranet/pins/plans");
  }

  purchaseSpectranetPins(input: PurchaseSpectranetPinsInput): Promise<BillsResponse> {
    const payload = purchaseSpectranetPinsSchema.parse(input);

    return this.http.request("POST", "internet/spectranet/pins/vend", {
      plan_id: payload.planId,
      qty: payload.quantity,
      ref: payload.reference
    });
  }
}

export class DataBillsResource {
  constructor(private readonly http: HttpClient) {}

  lookup(input: DataLookupInput = {}): Promise<BillsResponse> {
    const payload = dataLookupSchema.parse(input);
    const params = query({
      network: payload.network,
      category: payload.category
    });

    return this.http.request("GET", params ? `data/lookup?${params}` : "data/lookup");
  }

  vend(input: VendDataInput): Promise<BillsResponse> {
    const payload = vendDataSchema.parse(input);

    return this.http.request("POST", "data/vend", {
      plan: payload.plan,
      recipient: payload.recipient,
      network: payload.network,
      ref: payload.reference
    });
  }
}

export class EPinBillsResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<BillsResponse> {
    return this.http.request("GET", "epins");
  }

  purchase(input: PurchaseEPinInput): Promise<BillsResponse> {
    const payload = purchaseEPinSchema.parse(input);

    return this.http.request("POST", "epins/vend", {
      qty: payload.quantity,
      id: payload.id,
      ref: payload.reference
    });
  }

  lookupJambUser(input: LookupJambUserInput): Promise<BillsResponse> {
    const payload = lookupJambUserSchema.parse(input);

    return this.http.request("POST", "epins/jamb/user/lookup", {
      id: payload.id,
      account: payload.account
    });
  }

  retrieve(input: RetrieveEPinInput): Promise<BillsResponse> {
    const payload = retrieveEPinSchema.parse(input);

    return this.http.request("GET", `epins/retrieve?${query({ trans_id: payload.transactionId })}`);
  }
}

export class AirtimeToWalletBillsResource {
  constructor(private readonly http: HttpClient) {}

  lookup(): Promise<BillsResponse> {
    return this.http.request("POST", "airtime_to_wallet");
  }

  process(input: ProcessAirtimeToWalletInput): Promise<BillsResponse> {
    const payload = airtimeToWalletSchema.parse(input);

    return this.http.request("POST", "airtime_to_wallet/vend", {
      network: payload.network,
      amount: String(payload.amount),
      phone_number: payload.phoneNumber,
      from: payload.from,
      ref: payload.reference
    });
  }
}

export class ElectricityBillsResource {
  constructor(private readonly http: HttpClient) {}

  validate(input: ValidateElectricityInput): Promise<BillsResponse> {
    const payload = validateElectricitySchema.parse(input);

    return this.http.request("POST", "electricity/validate", {
      meter_number: payload.meterNumber,
      meter_type: payload.meterType,
      amount: payload.amount,
      service: payload.service
    });
  }

  pay(input: PayElectricityInput): Promise<BillsResponse> {
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
}

export class SmsBillsResource {
  constructor(private readonly http: HttpClient) {}

  send(input: SendBulkSmsInput): Promise<BillsResponse> {
    const payload = smsSchema.parse(input);

    return this.http.request("POST", "sms", {
      to: payload.to,
      message: payload.message,
      ref: payload.reference,
      sender_id: payload.senderId
    });
  }
}

export class BettingBillsResource {
  constructor(private readonly http: HttpClient) {}

  listProviders(): Promise<BillsResponse> {
    return this.http.request("GET", "betting/list");
  }

  lookup(input: BettingLookupInput): Promise<BillsResponse> {
    const payload = bettingLookupSchema.parse(input);

    return this.http.request(
      "GET",
      `betting/lookup?${query({ bet_id: payload.betId, customer_id: payload.customerId })}`
    );
  }

  fundWallet(input: FundBettingWalletInput): Promise<BillsResponse> {
    const payload = fundBettingWalletSchema.parse(input);

    return this.http.request("POST", "betting/vend", {
      bet_id: payload.betId,
      customer_id: payload.customerId,
      customer_name: payload.customerName,
      amount: payload.amount,
      ref: payload.reference
    });
  }
}

export class AirtimeBillsResource {
  constructor(private readonly http: HttpClient) {}

  vend(input: VendAirtimeInput): Promise<BillsResponse> {
    const payload = vendAirtimeSchema.parse(input);

    return this.http.request("POST", "airtime", {
      network: payload.network,
      amount: payload.amount,
      recipient: payload.recipient,
      ported: payload.ported,
      ref: payload.reference
    });
  }

  bulkVend(input: BulkAirtimeInput): Promise<BillsResponse> {
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
}

export class InternationalBillsResource {
  constructor(private readonly http: HttpClient) {}

  countries(): Promise<BillsResponse> {
    return this.http.request("GET", "international-bills/countries");
  }

  providers(input: InternationalProvidersInput): Promise<BillsResponse> {
    const payload = internationalProvidersSchema.parse(input);

    return this.http.request("GET", `international-bills/providers?${query({ iso: payload.iso })}`);
  }

  products(input: InternationalProductsInput): Promise<BillsResponse> {
    const payload = internationalProductsSchema.parse(input);

    return this.http.request(
      "GET",
      `international-bills/products?${query({ iso: payload.iso, code: payload.code })}`
    );
  }

  rate(input: InternationalRateInput): Promise<BillsResponse> {
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

  vend(input: VendInternationalBillInput): Promise<BillsResponse> {
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
}

function query(params: Record<string, string | number | undefined>): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  }

  return queryParams.toString();
}
