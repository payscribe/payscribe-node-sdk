import type { PayscribeResponse } from "./common.js";

export type CardBrand = "VISA" | "MASTERCARD" | string;
export type CardCurrency = "USD" | string;
export type CardType = "virtual" | "physical" | string;
export type StablecoinCurrency = "USDT" | "USDC" | string;
export type StablecoinNetwork = "Tron" | "Ethereum" | "BNB" | string;
export type StablecoinChain = "TRC20" | "ERC20" | "BEP20" | string;

export type VirtualCardBillingDetails = {
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  zipcode?: string;
  country?: string;
};

export type VirtualCardDetails = {
  id?: string;
  card_type?: string;
  currency?: string;
  brand?: string;
  name?: string;
  first_six?: string;
  last_four?: string;
  masked?: string;
  number?: string;
  card_number?: string;
  expiry?: string;
  ccv?: string;
  balance?: number;
  status?: string;
  billing?: VirtualCardBillingDetails;
  created_at?: string;
  updated_at?: string;
};

export type VirtualCardTransactionDetails = {
  trans_id?: string;
  ref?: string;
  ref_id?: string;
  customer?: {
    id?: string;
    name?: string;
  };
  card?: Pick<
    VirtualCardDetails,
    "id" | "first_six" | "last_four" | "brand" | "balance"
  > & {
    prev_balance?: number;
  };
  currency?: string;
  prev_balance?: number;
  balance?: number;
  amount?: number;
  action?: string;
  created_at?: string;
};

export type VirtualCardResponse = PayscribeResponse<{
  details?: {
    trans_id?: string;
    card?: VirtualCardDetails;
    customer?: {
      id?: string;
      name?: string;
    };
  };
}>;

export type VirtualCardActionResponse = PayscribeResponse<{
  details?: VirtualCardTransactionDetails;
}>;

export type VirtualCardTransactionsResponse = PayscribeResponse<{
  details?: VirtualCardTransactionDetails[] | Record<string, unknown>;
}>;

export type StablecoinCardOrderResponse = PayscribeResponse<{
  status?: "pending_payment" | string;
  payment_method?: "stablecoin" | string;
  address?: string;
  memo_tag?: string | null;
  currency?: string;
  network?: string;
  chain?: string;
  amount?: number;
  expires_at?: string;
}>;

export type CardLimitsInput = {
  dailyLimit?: number;
  transactionLimit?: number;
};

export type StablecoinFundingInput = {
  stablecoinCurrency?: StablecoinCurrency;
  stablecoinNetwork?: StablecoinNetwork;
  stablecoinChain?: StablecoinChain;
};

export type CreateVirtualCardInput = {
  customerId: string;
  currency?: CardCurrency;
  brand: CardBrand;
  amount: number;
  type?: CardType;
  reference: string;
  contactless?: boolean;
  cardLimits?: CardLimitsInput;
};

export type CreateStablecoinVirtualCardInput = CreateVirtualCardInput &
  StablecoinFundingInput;

export type TopUpVirtualCardInput = {
  amount: number;
  reference?: string;
};

export type TopUpVirtualCardWithStablecoinInput = TopUpVirtualCardInput &
  StablecoinFundingInput;

export type WithdrawVirtualCardInput = {
  amount: number;
  reference: string;
};

export type VirtualCardReferenceInput = {
  reference: string;
};

export type GetVirtualCardTransactionsInput = {
  startDate: string;
  endDate: string;
  pageSize?: number;
  page?: number;
};

export type UpdateVirtualCardContactInput = {
  email?: string;
  mobile?: string;
  billingDetails?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
  };
};
