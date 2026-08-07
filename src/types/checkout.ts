import type { PayscribeResponse } from "./common.js";

export type CheckoutService =
  | "pay"
  | "airtime"
  | "data"
  | "electricity"
  | "cable"
  | "betting"
  | "bills";

export type CreateCheckoutSessionInput = {
  amount: number;
  currency?: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  service: CheckoutService;
  metadata?: Record<string, unknown>;
  origin?: string;
  allowedOrigin?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionDetails = {
  token: string;
  canvas_url: string;
  expires_at: string;
};

export type CreateCheckoutSessionResponse = PayscribeResponse<CheckoutSessionDetails>;

export type ValidateCheckoutSessionInput = Record<string, unknown>;

export type InitializeCheckoutTransferInput = {
  token: string;
  name?: string;
  email?: string;
  amount: number;
};

export type CheckoutApiResponse = PayscribeResponse<Record<string, unknown>>;
