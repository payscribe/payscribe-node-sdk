type PayscribeEnvironment = "sandbox" | "production";
type PayscribeConfig = {
    secretKey: string;
    environment?: PayscribeEnvironment;
    baseUrl?: string;
};
type PayscribeRequestOptions = {
    signal?: AbortSignal;
};
type PayscribeResponse<T> = {
    status: boolean;
    description?: string;
    message?: T;
    data?: T;
    status_code: number;
};

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
declare class HttpClient {
    private readonly baseUrl;
    private readonly secretKey;
    constructor(config: PayscribeConfig);
    request<T>(method: HttpMethod, path: string, body?: unknown, options?: PayscribeRequestOptions): Promise<T>;
}

type BankCode = "9psb" | "palmpay" | string;
type AmountType = "EXACT" | "ANY";
type DurationType = "minutes" | "minute" | "hours" | "hour";
type IdentityType = "bvn" | "nin" | string;
type VirtualAccountBankDetails = {
    id: string;
    account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    currency: string;
    account_type: string;
};
type VirtualAccountDetails = {
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
type VirtualAccountResponse = PayscribeResponse<{
    details: VirtualAccountDetails;
}>;
type CreateStaticVirtualAccountInput = {
    customerId: string;
    banks: BankCode[];
    currency?: "NGN" | string;
    identity?: {
        type: IdentityType;
        number: string;
    };
};
type CreateDynamicVirtualAccountInput = {
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
type ConfirmVirtualAccountPaymentInput = {
    transId?: string;
    sessionId: string;
    amount: number;
    accountNumber: string;
};
type SimulateVirtualAccountTransferInput = {
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

declare class VirtualAccountsResource {
    private readonly http;
    constructor(http: HttpClient);
    createStatic(input: CreateStaticVirtualAccountInput): Promise<VirtualAccountResponse>;
    createDynamic(input: CreateDynamicVirtualAccountInput): Promise<VirtualAccountResponse>;
    get(accountNumber: string): Promise<VirtualAccountResponse>;
    deactivate(accountNumber: string): Promise<VirtualAccountResponse>;
    activate(accountNumber: string): Promise<VirtualAccountResponse>;
    confirmPayment(input: ConfirmVirtualAccountPaymentInput): Promise<VirtualAccountResponse>;
    simulateTransfer(input: SimulateVirtualAccountTransferInput): Promise<VirtualAccountResponse>;
}

type CardBrand = "VISA" | "MASTERCARD" | string;
type CardCurrency = "USD" | string;
type CardType = "virtual" | "physical" | string;
type StablecoinCurrency = "USDT" | "USDC" | string;
type StablecoinNetwork = "Tron" | "Ethereum" | "BNB" | string;
type StablecoinChain = "TRC20" | "ERC20" | "BEP20" | string;
type VirtualCardBillingDetails = {
    address?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zipcode?: string;
    country?: string;
};
type VirtualCardDetails = {
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
type VirtualCardTransactionDetails = {
    trans_id?: string;
    ref?: string;
    ref_id?: string;
    customer?: {
        id?: string;
        name?: string;
    };
    card?: Pick<VirtualCardDetails, "id" | "first_six" | "last_four" | "brand" | "balance"> & {
        prev_balance?: number;
    };
    currency?: string;
    prev_balance?: number;
    balance?: number;
    amount?: number;
    action?: string;
    created_at?: string;
};
type VirtualCardResponse = PayscribeResponse<{
    details?: {
        trans_id?: string;
        card?: VirtualCardDetails;
        customer?: {
            id?: string;
            name?: string;
        };
    };
}>;
type VirtualCardActionResponse = PayscribeResponse<{
    details?: VirtualCardTransactionDetails;
}>;
type VirtualCardTransactionsResponse = PayscribeResponse<{
    details?: VirtualCardTransactionDetails[] | Record<string, unknown>;
}>;
type StablecoinCardOrderResponse = PayscribeResponse<{
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
type CardLimitsInput = {
    dailyLimit?: number;
    transactionLimit?: number;
};
type StablecoinFundingInput = {
    stablecoinCurrency?: StablecoinCurrency;
    stablecoinNetwork?: StablecoinNetwork;
    stablecoinChain?: StablecoinChain;
};
type CreateVirtualCardInput = {
    customerId: string;
    currency?: CardCurrency;
    brand: CardBrand;
    amount: number;
    type?: CardType;
    reference: string;
    contactless?: boolean;
    cardLimits?: CardLimitsInput;
};
type CreateStablecoinVirtualCardInput = CreateVirtualCardInput & StablecoinFundingInput;
type TopUpVirtualCardInput = {
    amount: number;
    reference?: string;
};
type TopUpVirtualCardWithStablecoinInput = TopUpVirtualCardInput & StablecoinFundingInput;
type WithdrawVirtualCardInput = {
    amount: number;
    reference: string;
};
type VirtualCardReferenceInput = {
    reference: string;
};
type GetVirtualCardTransactionsInput = {
    startDate: string;
    endDate: string;
    pageSize?: number;
    page?: number;
};
type UpdateVirtualCardContactInput = {
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

declare class VirtualCardsResource {
    private readonly http;
    constructor(http: HttpClient);
    create(input: CreateVirtualCardInput): Promise<VirtualCardResponse>;
    createWithStablecoin(input: CreateStablecoinVirtualCardInput): Promise<StablecoinCardOrderResponse>;
    topUp(cardId: string, input: TopUpVirtualCardInput): Promise<VirtualCardActionResponse>;
    topUpWithStablecoin(cardId: string, input: TopUpVirtualCardWithStablecoinInput): Promise<StablecoinCardOrderResponse>;
    withdraw(cardId: string, input: WithdrawVirtualCardInput): Promise<VirtualCardActionResponse>;
    get(cardId: string): Promise<VirtualCardResponse>;
    replace(cardId: string): Promise<VirtualCardResponse>;
    regularize(cardId: string): Promise<VirtualCardResponse>;
    transactions(cardId: string, input: GetVirtualCardTransactionsInput): Promise<VirtualCardTransactionsResponse>;
    freeze(cardId: string, input: VirtualCardReferenceInput): Promise<VirtualCardActionResponse>;
    unfreeze(cardId: string, input: VirtualCardReferenceInput): Promise<VirtualCardActionResponse>;
    terminate(cardId: string, input: VirtualCardReferenceInput): Promise<VirtualCardActionResponse>;
    updateContact(cardId: string, input: UpdateVirtualCardContactInput): Promise<VirtualCardResponse>;
}

type PayscribeWebhookEvent = {
    event_id?: string;
    event_type?: string;
    event?: string;
    trans_id?: string;
    amount?: number;
    fee?: number;
    currency?: string;
    transaction?: {
        session_id?: string;
        date?: string;
        amount?: number;
        currency?: string;
        narration?: string;
        bank_name?: string;
        bank_code?: string;
        sender_account?: string;
        sender_name?: string;
    };
    customer?: {
        id?: string;
        name?: string;
        number?: string;
        bank?: string;
        account_id?: string;
        account_type?: string;
    };
    created_at?: string;
    transaction_hash?: string;
    [key: string]: unknown;
};

declare class WebhooksResource {
    private readonly secretKey;
    constructor(secretKey: string);
    verifySignature(rawBody: string | Buffer, signature: string): boolean;
    constructEvent(input: {
        rawBody: string | Buffer;
        signature: string | string[] | undefined;
    }): PayscribeWebhookEvent;
}

declare class Payscribe {
    readonly virtualAccounts: VirtualAccountsResource;
    readonly virtualCards: VirtualCardsResource;
    readonly webhooks: WebhooksResource;
    constructor(config: PayscribeConfig);
}

declare class PayscribeApiError extends Error {
    readonly statusCode: number;
    readonly response: unknown;
    constructor(message: string, statusCode: number, response: unknown);
}

export { type AmountType, type BankCode, type CardBrand, type CardCurrency, type CardLimitsInput, type CardType, type ConfirmVirtualAccountPaymentInput, type CreateDynamicVirtualAccountInput, type CreateStablecoinVirtualCardInput, type CreateStaticVirtualAccountInput, type CreateVirtualCardInput, type GetVirtualCardTransactionsInput, Payscribe, PayscribeApiError, type PayscribeConfig, type PayscribeEnvironment, type PayscribeRequestOptions, type PayscribeWebhookEvent, type SimulateVirtualAccountTransferInput, type StablecoinCardOrderResponse, type StablecoinChain, type StablecoinCurrency, type StablecoinFundingInput, type StablecoinNetwork, type TopUpVirtualCardInput, type TopUpVirtualCardWithStablecoinInput, type UpdateVirtualCardContactInput, type VirtualAccountResponse, type VirtualCardActionResponse, type VirtualCardDetails, type VirtualCardReferenceInput, type VirtualCardResponse, type VirtualCardTransactionDetails, type VirtualCardTransactionsResponse, type WithdrawVirtualCardInput };
