import type { PayscribeResponse } from "./common.js";

export type BillNetwork = "mtn" | "glo" | "airtel" | "9mobile" | string;
export type CableService = "gotv" | "dstv" | "startimes" | "dstvshowmax" | string;
export type MeterType = "prepaid" | "postpaid" | string;
export type ElectricityService =
  | "ikedc"
  | "ekedc"
  | "eedc"
  | "phedc"
  | "aedc"
  | "ibedc"
  | "kedco"
  | "jed"
  | string;

export type BillsResponse<T = Record<string, unknown>> = PayscribeResponse<{
  details?: T;
}>;

export type FetchCableBouquetsInput = {
  service: CableService;
};

export type ValidateCableSmartCardInput = {
  service: CableService;
  account: string;
  planId: string;
  month?: number;
};

export type PayCableInput = {
  planId: string;
  customerName: string;
  account: string;
  service: CableService;
  reference: string;
  phone?: string;
  email?: string;
  month?: number;
};

export type TopUpCableInput = {
  amount: number | string;
  customerName: string;
  account: string;
  service: CableService;
  reference: string;
  phone?: string;
  email?: string;
  month?: number;
};

export type DataLookupInput = {
  network?: BillNetwork;
  category?: string;
};

export type VendDataInput = {
  plan: string;
  recipient: string | string[];
  network: BillNetwork;
  reference?: string;
};

export type PurchaseSpectranetPinsInput = {
  planId: string;
  quantity: number;
  reference: string;
};

export type PurchaseEPinInput = {
  id: string;
  quantity: number;
  reference: string;
};

export type LookupJambUserInput = {
  id: number | string;
  account: string;
};

export type RetrieveEPinInput = {
  transactionId: string;
};

export type ProcessAirtimeToWalletInput = {
  network: BillNetwork;
  amount: number | string;
  phoneNumber: string;
  from: string;
  reference?: string;
};

export type ValidateElectricityInput = {
  meterNumber: string;
  meterType: MeterType;
  amount: number | string;
  service: ElectricityService;
};

export type PayElectricityInput = ValidateElectricityInput & {
  customerName: string;
  address?: string;
  phone?: string;
  email?: string;
  reference?: string;
};

export type RequeryTransactionInput = {
  transactionId: string;
};

export type SendBulkSmsInput = {
  to: string;
  message: string;
  reference?: string;
  senderId?: string;
};

export type BettingLookupInput = {
  betId: string;
  customerId: string;
};

export type FundBettingWalletInput = BettingLookupInput & {
  customerName: string;
  amount: number | string;
  reference: string;
};

export type VendAirtimeInput = {
  network: BillNetwork;
  amount: number | string;
  recipient: string | string[];
  ported?: boolean;
  reference?: string;
};

export type BulkAirtimeRow = {
  phone: string;
  amount: number;
  provider: BillNetwork;
  country?: string;
  reference?: string;
};

export type BulkAirtimeInput = {
  rows: BulkAirtimeRow[];
  reference?: string;
};

export type InternationalProvidersInput = {
  iso: string;
};

export type InternationalProductsInput = {
  iso: string;
  code: string;
};

export type InternationalRateInput = {
  iso: string;
  sku: string;
  amount: number | string;
};

export type VendInternationalBillInput = {
  iso: string;
  providerCode: string;
  sku: string;
  amount: number | string;
  account: string;
  debitCurrency?: string;
  reference: string;
};
