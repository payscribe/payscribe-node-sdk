import { z } from "zod";
import type { HttpClient } from "../http.js";
import type {
  CreateStablecoinVirtualCardInput,
  CreateVirtualCardInput,
  GetVirtualCardTransactionsInput,
  StablecoinCardOrderResponse,
  TopUpVirtualCardInput,
  TopUpVirtualCardWithStablecoinInput,
  UpdateVirtualCardContactInput,
  VirtualCardActionResponse,
  VirtualCardReferenceInput,
  VirtualCardResponse,
  VirtualCardTransactionsResponse,
  WithdrawVirtualCardInput
} from "../types/virtual-cards.js";

const cardLimitsSchema = z
  .object({
    dailyLimit: z.number().positive().optional(),
    transactionLimit: z.number().positive().optional()
  })
  .optional();

const createCardSchema = z.object({
  customerId: z.string().min(1),
  currency: z.string().default("USD"),
  brand: z.string().min(1),
  amount: z.number().positive(),
  type: z.string().default("virtual"),
  reference: z.string().min(1),
  contactless: z.boolean().optional(),
  cardLimits: cardLimitsSchema
});

const stablecoinFundingSchema = z.object({
  stablecoinCurrency: z.string().default("USDT"),
  stablecoinNetwork: z.string().default("Tron"),
  stablecoinChain: z.string().default("TRC20")
});

const createStablecoinCardSchema = createCardSchema.merge(stablecoinFundingSchema);

const topUpSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().min(1).optional()
});

const topUpStablecoinSchema = topUpSchema.merge(stablecoinFundingSchema);

const withdrawSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().min(1)
});

const referenceSchema = z.object({
  reference: z.string().min(1)
});

const transactionsSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  pageSize: z.number().int().positive().optional(),
  page: z.number().int().positive().optional()
});

const updateContactSchema = z.object({
  email: z.string().email().optional(),
  mobile: z.string().min(1).optional(),
  billingDetails: z
    .object({
      address1: z.string().min(1).optional(),
      address2: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      zipcode: z.string().min(1).optional(),
      country: z.string().min(1).optional()
    })
    .optional()
});

export class VirtualCardsResource {
  constructor(private readonly http: HttpClient) {}

  create(input: CreateVirtualCardInput): Promise<VirtualCardResponse> {
    const payload = createCardSchema.parse(input);

    return this.http.request("POST", "cards/create", mapCreateCardPayload(payload));
  }

  createWithStablecoin(
    input: CreateStablecoinVirtualCardInput
  ): Promise<StablecoinCardOrderResponse> {
    const payload = createStablecoinCardSchema.parse(input);

    return this.http.request("POST", "cards/create", {
      ...mapCreateCardPayload(payload),
      payment_method: "stablecoin",
      stablecoin_currency: payload.stablecoinCurrency,
      stablecoin_network: payload.stablecoinNetwork,
      stablecoin_chain: payload.stablecoinChain
    });
  }

  topUp(cardId: string, input: TopUpVirtualCardInput): Promise<VirtualCardActionResponse> {
    const payload = topUpSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/topup`, {
      amount: payload.amount,
      ...(payload.reference ? { ref: payload.reference } : {})
    });
  }

  topUpWithStablecoin(
    cardId: string,
    input: TopUpVirtualCardWithStablecoinInput
  ): Promise<StablecoinCardOrderResponse> {
    const payload = topUpStablecoinSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/topup`, {
      amount: payload.amount,
      ...(payload.reference ? { ref: payload.reference } : {}),
      payment_method: "stablecoin",
      stablecoin_currency: payload.stablecoinCurrency,
      stablecoin_network: payload.stablecoinNetwork,
      stablecoin_chain: payload.stablecoinChain
    });
  }

  withdraw(
    cardId: string,
    input: WithdrawVirtualCardInput
  ): Promise<VirtualCardActionResponse> {
    const payload = withdrawSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/withdraw`, {
      amount: payload.amount,
      ref: payload.reference
    });
  }

  get(cardId: string): Promise<VirtualCardResponse> {
    return this.http.request("GET", `cards/${encodeURIComponent(cardId)}`);
  }

  replace(cardId: string): Promise<VirtualCardResponse> {
    return this.http.request("PATCH", `cards/replace/${encodeURIComponent(cardId)}`);
  }

  regularize(cardId: string): Promise<VirtualCardResponse> {
    return this.replace(cardId);
  }

  transactions(
    cardId: string,
    input: GetVirtualCardTransactionsInput
  ): Promise<VirtualCardTransactionsResponse> {
    const payload = transactionsSchema.parse(input);
    const query = new URLSearchParams({
      start_date: payload.startDate,
      end_date: payload.endDate,
      ...(payload.pageSize ? { page_size: String(payload.pageSize) } : {}),
      ...(payload.page ? { page: String(payload.page) } : {})
    });

    return this.http.request(
      "GET",
      `cards/${encodeURIComponent(cardId)}/transactions?${query.toString()}`
    );
  }

  freeze(
    cardId: string,
    input: VirtualCardReferenceInput
  ): Promise<VirtualCardActionResponse> {
    const payload = referenceSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/freeze`, {
      ref: payload.reference
    });
  }

  unfreeze(
    cardId: string,
    input: VirtualCardReferenceInput
  ): Promise<VirtualCardActionResponse> {
    const payload = referenceSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/unfreeze`, {
      ref: payload.reference
    });
  }

  terminate(
    cardId: string,
    input: VirtualCardReferenceInput
  ): Promise<VirtualCardActionResponse> {
    const payload = referenceSchema.parse(input);

    return this.http.request("POST", `cards/${encodeURIComponent(cardId)}/terminate`, {
      ref: payload.reference
    });
  }

  updateContact(
    cardId: string,
    input: UpdateVirtualCardContactInput
  ): Promise<VirtualCardResponse> {
    const payload = updateContactSchema.parse(input);

    return this.http.request("PATCH", `cards/${encodeURIComponent(cardId)}/card-contact`, {
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.mobile ? { mobile: payload.mobile } : {}),
      ...(payload.billingDetails
        ? {
            billing_details: {
              address1: payload.billingDetails.address1,
              address2: payload.billingDetails.address2,
              city: payload.billingDetails.city,
              state: payload.billingDetails.state,
              zipcode: payload.billingDetails.zipcode,
              country: payload.billingDetails.country
            }
          }
        : {})
    });
  }
}

function mapCreateCardPayload(payload: z.infer<typeof createCardSchema>) {
  return {
    customer_id: payload.customerId,
    currency: payload.currency,
    brand: payload.brand,
    amount: payload.amount,
    type: payload.type,
    ref: payload.reference,
    ...(payload.contactless === undefined ? {} : { contactless: payload.contactless }),
    ...(payload.cardLimits
      ? {
          card_limits: {
            daily_limit: payload.cardLimits.dailyLimit,
            transaction_limit: payload.cardLimits.transactionLimit
          }
        }
      : {})
  };
}
