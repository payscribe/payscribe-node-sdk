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
  currency?: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  origin?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionDetails = {
  token: string;
  canvas_url: string;
  expires_at: string;
  service?: CheckoutService;
  amount?: number | null;
  currency?: string;
  reference?: string;
  email?: string;
  name?: string;
  phone?: string;
  metadata?: CheckoutMetadata | null;
  validated_metadata?: Record<string, unknown> | null;
  environment?: string;
  business_name?: string;
  business_logo?: string;
  button_color?: string;
  button_text?: string;
  success_url?: string;
  cancel_url?: string;
  status?: string;
};

export type CreateCheckoutSessionResponse = PayscribeResponse<CheckoutSessionDetails>;

export type ValidateCheckoutSessionInput = {
  service: Exclude<CheckoutService, "pay" | "bills">;
  metadata: CheckoutMetadata | Record<string, unknown>;
  amount: number;
};

export type InitializeCheckoutTransferInput = {
  token: string;
  name?: string;
  email?: string;
  amount: number;
};

export type CheckoutApiResponse = PayscribeResponse<Record<string, unknown>>;
