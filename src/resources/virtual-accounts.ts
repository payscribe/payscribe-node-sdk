import { z } from "zod";
import type { HttpClient } from "../http.js";
import type {
  ConfirmVirtualAccountPaymentInput,
  CreateDynamicVirtualAccountInput,
  CreateStaticVirtualAccountInput,
  SimulateVirtualAccountTransferInput,
  VirtualAccountResponse
} from "../types/virtual-accounts.js";

const staticAccountSchema = z.object({
  customerId: z.string().min(1),
  banks: z.array(z.string().min(1)).min(1),
  currency: z.string().default("NGN"),
  identity: z
    .object({
      type: z.string().min(1),
      number: z.string().min(1)
    })
    .optional()
});

const dynamicAccountSchema = z.object({
  reference: z.string().min(1),
  amount: z.number().positive(),
  amountType: z.enum(["EXACT", "ANY"]).default("EXACT"),
  description: z.string().optional(),
  currency: z.string().default("NGN"),
  expiresIn: z.object({
    duration: z.number().positive(),
    type: z.string().min(1)
  }),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1)
  })
});

export class VirtualAccountsResource {
  constructor(private readonly http: HttpClient) {}

  createStatic(input: CreateStaticVirtualAccountInput): Promise<VirtualAccountResponse> {
    const payload = staticAccountSchema.parse(input);

    return this.http.request("POST", "collections/virtual-accounts/create", {
      account_type: "static",
      currency: payload.currency,
      customer_id: payload.customerId,
      bank: payload.banks,
      ...(payload.identity
        ? {
            identity_type: payload.identity.type,
            identity_number: payload.identity.number
          }
        : {})
    });
  }

  createDynamic(input: CreateDynamicVirtualAccountInput): Promise<VirtualAccountResponse> {
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

  get(accountNumber: string): Promise<VirtualAccountResponse> {
    return this.http.request(
      "GET",
      `collections/virtual-accounts/${encodeURIComponent(accountNumber)}`
    );
  }

  deactivate(accountNumber: string): Promise<VirtualAccountResponse> {
    return this.http.request("POST", "collections/virtual-accounts/deactivate", {
      account: accountNumber
    });
  }

  activate(accountNumber: string): Promise<VirtualAccountResponse> {
    return this.http.request("POST", "collections/virtual-accounts/activate", {
      account: accountNumber
    });
  }

  confirmPayment(input: ConfirmVirtualAccountPaymentInput): Promise<VirtualAccountResponse> {
    return this.http.request("POST", "collections/virtual-accounts/confirm-payment", {
      trans_id: input.transId ?? "",
      session_id: input.sessionId,
      amount: input.amount,
      account_number: input.accountNumber
    });
  }

  simulateTransfer(input: SimulateVirtualAccountTransferInput): Promise<VirtualAccountResponse> {
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
}
