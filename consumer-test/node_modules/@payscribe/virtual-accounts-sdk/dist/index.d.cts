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
    readonly webhooks: WebhooksResource;
    constructor(config: PayscribeConfig);
}

declare class PayscribeApiError extends Error {
    readonly statusCode: number;
    readonly response: unknown;
    constructor(message: string, statusCode: number, response: unknown);
}

export { type AmountType, type BankCode, type ConfirmVirtualAccountPaymentInput, type CreateDynamicVirtualAccountInput, type CreateStaticVirtualAccountInput, Payscribe, PayscribeApiError, type PayscribeConfig, type PayscribeEnvironment, type PayscribeRequestOptions, type PayscribeWebhookEvent, type SimulateVirtualAccountTransferInput, type VirtualAccountResponse };
