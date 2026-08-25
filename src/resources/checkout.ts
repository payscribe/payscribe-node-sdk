import { z } from "zod";
import type { HttpClient } from "../http.js";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResponse,
  CheckoutApiResponse,
  InitializeCheckoutTransferInput,
  ValidateCheckoutSessionInput
} from "../types/checkout.js";

const createSessionSchema = z.object({
  currency: z.string().min(1).default("NGN"),
  reference: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  origin: z.string().url().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

const transferSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  amount: z.number().positive()
});

const validateSessionSchema = z.object({
  service: z.enum(["airtime", "data", "electricity", "cable", "betting"]),
  metadata: z.record(z.unknown()),
  amount: z.number().positive()
});

export class CheckoutResource {
  constructor(private readonly http: HttpClient) {}

  createSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResponse> {
    return this.http.request("POST", "button/init", createSessionSchema.parse(input));
  }

  getSession(token: string): Promise<CheckoutApiResponse> {
    return this.http.request("GET", `button/session/${encodeURIComponent(token)}`);
  }

  validateSession(
    token: string,
    input: ValidateCheckoutSessionInput
  ): Promise<CheckoutApiResponse> {
    return this.http.request(
      "POST",
      `button/session/${encodeURIComponent(token)}/validate`,
      validateSessionSchema.parse(input)
    );
  }

  initializeTransfer(input: InitializeCheckoutTransferInput): Promise<CheckoutApiResponse> {
    return this.http.request("POST", "button/transfer/init", transferSchema.parse(input));
  }

  getSessionStatus(token: string): Promise<CheckoutApiResponse> {
    return this.http.request("GET", `button/session/${encodeURIComponent(token)}/status`);
  }
}
