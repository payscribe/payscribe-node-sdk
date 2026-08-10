import type { PayscribeResponse } from "./common.js";

export type CheckoutService =
  | "pay"
  | "airtime"
  | "data"
  | "electricity"
  | "cable"
  | "betting"
  | "bills";

export type CheckoutNetwork = "mtn" | "airtel" | "glo" | "9mobile";
export type CheckoutElectricityProvider =
  | "ikedc"
  | "ekedc"
  | "eedc"
  | "phedc"
  | "aedc"
  | "ibedc"
  | "kedco"
  | "jed";
export type CheckoutCableProvider = "dstv" | "gotv" | "startimes" | "dstvshowmax";

export type AirtimeCheckoutMetadata = {
  network: CheckoutNetwork;
  recipient: string;
};

export type DataCheckoutMetadata = AirtimeCheckoutMetadata & {
  plan: number;
};

export type ElectricityCheckoutMetadata = {
  provider: CheckoutElectricityProvider;
  meterNumber: string;
  meterType: "prepaid" | "postpaid";
};

export type CableCheckoutMetadata = {
  provider: CheckoutCableProvider;
  account: string;
  planId: string | number;
};

export type BettingCheckoutMetadata = {
  account: string;
  provider?: string;
  betId?: string;
};

export type BillsCheckoutMetadata = {
  category: Exclude<CheckoutService, "pay" | "bills">;
  [key: string]: unknown;
};

export type CheckoutMetadata =
  | AirtimeCheckoutMetadata
  | DataCheckoutMetadata
  | ElectricityCheckoutMetadata
  | CableCheckoutMetadata
  | BettingCheckoutMetadata
  | BillsCheckoutMetadata;

export type CreateCheckoutSessionInput = {
  amount: number;
  currency?: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  service: CheckoutService;
  metadata?: CheckoutMetadata;
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
