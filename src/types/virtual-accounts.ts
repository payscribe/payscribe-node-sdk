import type { PayscribeResponse } from "./common.js";

export type BankCode = "9psb" | "palmpay" | string;
export type AmountType = "EXACT" | "ANY";
export type DurationType = "minutes" | "minute" | "hours" | "hour";
export type IdentityType = "bvn" | "nin" | string;

export type VirtualAccountBankDetails = {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  currency: string;
  account_type: string;
};

export type VirtualAccountDetails = {
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  account?: VirtualAccountBankDetails | VirtualAccountBankDetails[];
  expiry?: number;
  expiry_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type VirtualAccountResponse = PayscribeResponse<{
  details: VirtualAccountDetails;
}>;

export type CreateStaticVirtualAccountInput = {
  customerId: string;
  banks: BankCode[];
  currency?: "NGN" | string;
  identity?: {
    type: IdentityType;
    number: string;
  };
};

export type CreateDynamicVirtualAccountInput = {
  reference: string;
  amount: number;
  amountType?: AmountType;
  description?: string;
  currency?: "NGN" | string;
  expiresIn: {
    duration: number;
    type: DurationType;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

export type ConfirmVirtualAccountPaymentInput = {
  transId?: string;
  sessionId: string;
  amount: number;
  accountNumber: string;
};

export type SimulateVirtualAccountTransferInput = {
  reference: string;
  amount: string | number;
  description: string;
  currency?: "NGN" | string;
  account: string;
  name: string;
  bank: string;
  senderAccountNumber: string;
  senderName: string;
  hash: string;
};
