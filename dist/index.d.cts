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

type BillNetwork = "mtn" | "glo" | "airtel" | "9mobile" | string;
type CableService = "gotv" | "dstv" | "startimes" | "dstvshowmax" | string;
type MeterType = "prepaid" | "postpaid" | string;
type ElectricityService = "ikedc" | "ekedc" | "eedc" | "phedc" | "aedc" | "ibedc" | "kedco" | "jed" | string;
type BillsResponse<T = Record<string, unknown>> = PayscribeResponse<{
    details?: T;
}>;
type FetchCableBouquetsInput = {
    service: CableService;
};
type ValidateCableSmartCardInput = {
    service: CableService;
    account: string;
    planId: string;
    month?: number;
};
type PayCableInput = {
    planId: string;
    customerName: string;
    account: string;
    service: CableService;
    reference: string;
    phone?: string;
    email?: string;
    month?: number;
};
type TopUpCableInput = {
    amount: number | string;
    customerName: string;
    account: string;
    service: CableService;
    reference: string;
    phone?: string;
    email?: string;
    month?: number;
};
type DataLookupInput = {
    network?: BillNetwork;
    category?: string;
};
type VendDataInput = {
    plan: string;
    recipient: string | string[];
    network: BillNetwork;
    reference?: string;
};
type PurchaseSpectranetPinsInput = {
    planId: string;
    quantity: number;
    reference: string;
};
type PurchaseEPinInput = {
    id: string;
    quantity: number;
    reference: string;
};
type LookupJambUserInput = {
    id: number | string;
    account: string;
};
type RetrieveEPinInput = {
    transactionId: string;
};
type ProcessAirtimeToWalletInput = {
    network: BillNetwork;
    amount: number | string;
    phoneNumber: string;
    from: string;
    reference?: string;
};
type ValidateElectricityInput = {
    meterNumber: string;
    meterType: MeterType;
    amount: number | string;
    service: ElectricityService;
};
type PayElectricityInput = ValidateElectricityInput & {
    customerName: string;
    address?: string;
    phone?: string;
    email?: string;
    reference?: string;
};
type RequeryTransactionInput = {
    transactionId: string;
};
type SendBulkSmsInput = {
    to: string;
    message: string;
    reference?: string;
    senderId?: string;
};
type BettingLookupInput = {
    betId: string;
    customerId: string;
};
type FundBettingWalletInput = BettingLookupInput & {
    customerName: string;
    amount: number | string;
    reference: string;
};
type VendAirtimeInput = {
    network: BillNetwork;
    amount: number | string;
    recipient: string | string[];
    ported?: boolean;
    reference?: string;
};
type BulkAirtimeRow = {
    phone: string;
    amount: number;
    provider: BillNetwork;
    country?: string;
    reference?: string;
};
type BulkAirtimeInput = {
    rows: BulkAirtimeRow[];
    reference?: string;
};
type InternationalProvidersInput = {
    iso: string;
};
type InternationalProductsInput = {
    iso: string;
    code: string;
};
type InternationalRateInput = {
    iso: string;
    sku: string;
    amount: number | string;
};
type VendInternationalBillInput = {
    iso: string;
    providerCode: string;
    sku: string;
    amount: number | string;
    account: string;
    debitCurrency?: string;
    reference: string;
};

declare class BillsResource {
    private readonly http;
    readonly cable: CableBillsResource;
    readonly internet: InternetBillsResource;
    readonly data: DataBillsResource;
    readonly epins: EPinBillsResource;
    readonly airtimeToWallet: AirtimeToWalletBillsResource;
    readonly electricity: ElectricityBillsResource;
    readonly sms: SmsBillsResource;
    readonly betting: BettingBillsResource;
    readonly airtime: AirtimeBillsResource;
    readonly international: InternationalBillsResource;
    constructor(http: HttpClient);
    requery(input: RequeryTransactionInput): Promise<BillsResponse>;
}
declare class CableBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    fetchBouquets(input: FetchCableBouquetsInput): Promise<BillsResponse>;
    validateSmartCard(input: ValidateCableSmartCardInput): Promise<BillsResponse>;
    pay(input: PayCableInput): Promise<BillsResponse>;
    topUp(input: TopUpCableInput): Promise<BillsResponse>;
}
declare class InternetBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    listServices(): Promise<BillsResponse>;
    spectranetPinPlans(): Promise<BillsResponse>;
    purchaseSpectranetPins(input: PurchaseSpectranetPinsInput): Promise<BillsResponse>;
}
declare class DataBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    lookup(input?: DataLookupInput): Promise<BillsResponse>;
    vend(input: VendDataInput): Promise<BillsResponse>;
}
declare class EPinBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    list(): Promise<BillsResponse>;
    purchase(input: PurchaseEPinInput): Promise<BillsResponse>;
    lookupJambUser(input: LookupJambUserInput): Promise<BillsResponse>;
    retrieve(input: RetrieveEPinInput): Promise<BillsResponse>;
}
declare class AirtimeToWalletBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    lookup(): Promise<BillsResponse>;
    process(input: ProcessAirtimeToWalletInput): Promise<BillsResponse>;
}
declare class ElectricityBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    validate(input: ValidateElectricityInput): Promise<BillsResponse>;
    pay(input: PayElectricityInput): Promise<BillsResponse>;
}
declare class SmsBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    send(input: SendBulkSmsInput): Promise<BillsResponse>;
}
declare class BettingBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    listProviders(): Promise<BillsResponse>;
    lookup(input: BettingLookupInput): Promise<BillsResponse>;
    fundWallet(input: FundBettingWalletInput): Promise<BillsResponse>;
}
declare class AirtimeBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    vend(input: VendAirtimeInput): Promise<BillsResponse>;
    bulkVend(input: BulkAirtimeInput): Promise<BillsResponse>;
}
declare class InternationalBillsResource {
    private readonly http;
    constructor(http: HttpClient);
    countries(): Promise<BillsResponse>;
    providers(input: InternationalProvidersInput): Promise<BillsResponse>;
    products(input: InternationalProductsInput): Promise<BillsResponse>;
    rate(input: InternationalRateInput): Promise<BillsResponse>;
    vend(input: VendInternationalBillInput): Promise<BillsResponse>;
}

type CheckoutService = "pay" | "airtime" | "data" | "electricity" | "cable" | "betting" | "bills";
type CheckoutNetwork = "mtn" | "airtel" | "glo" | "9mobile";
type CheckoutElectricityProvider = "ikedc" | "ekedc" | "eedc" | "phedc" | "aedc" | "ibedc" | "kedco" | "jed";
type CheckoutCableProvider = "dstv" | "gotv" | "startimes" | "dstvshowmax";
type AirtimeCheckoutMetadata = {
    network: CheckoutNetwork;
    recipient: string;
};
type DataCheckoutMetadata = AirtimeCheckoutMetadata & {
    plan: number;
};
type ElectricityCheckoutMetadata = {
    provider: CheckoutElectricityProvider;
    meterNumber: string;
    meterType: "prepaid" | "postpaid";
};
type CableCheckoutMetadata = {
    provider: CheckoutCableProvider;
    account: string;
    planId: string | number;
};
type BettingCheckoutMetadata = {
    account: string;
    provider?: string;
    betId?: string;
};
type BillsCheckoutMetadata = {
    category: Exclude<CheckoutService, "pay" | "bills">;
    [key: string]: unknown;
};
type CheckoutMetadata = AirtimeCheckoutMetadata | DataCheckoutMetadata | ElectricityCheckoutMetadata | CableCheckoutMetadata | BettingCheckoutMetadata | BillsCheckoutMetadata;
type CreateCheckoutSessionInput = {
    currency?: string;
    reference: string;
    name: string;
    email: string;
    phone: string;
    origin?: string;
    successUrl?: string;
    cancelUrl?: string;
};
type CheckoutSessionDetails = {
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
type CreateCheckoutSessionResponse = PayscribeResponse<CheckoutSessionDetails>;
type ValidateCheckoutSessionInput = {
    service: Exclude<CheckoutService, "pay" | "bills">;
    metadata: CheckoutMetadata | Record<string, unknown>;
    amount: number;
};
type InitializeCheckoutTransferInput = {
    token: string;
    name?: string;
    email?: string;
    amount: number;
};
type CheckoutApiResponse = PayscribeResponse<Record<string, unknown>>;

declare class CheckoutResource {
    private readonly http;
    constructor(http: HttpClient);
    createSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResponse>;
    getSession(token: string): Promise<CheckoutApiResponse>;
    validateSession(token: string, input: ValidateCheckoutSessionInput): Promise<CheckoutApiResponse>;
    initializeTransfer(input: InitializeCheckoutTransferInput): Promise<CheckoutApiResponse>;
    getSessionStatus(token: string): Promise<CheckoutApiResponse>;
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
    readonly bills: BillsResource;
    readonly checkout: CheckoutResource;
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

export { type AirtimeCheckoutMetadata, type AmountType, type BankCode, type BettingCheckoutMetadata, type BettingLookupInput, type BillNetwork, type BillsCheckoutMetadata, type BillsResponse, type BulkAirtimeInput, type BulkAirtimeRow, type CableCheckoutMetadata, type CableService, type CardBrand, type CardCurrency, type CardLimitsInput, type CardType, type CheckoutApiResponse, type CheckoutCableProvider, type CheckoutElectricityProvider, type CheckoutMetadata, type CheckoutNetwork, type CheckoutService, type CheckoutSessionDetails, type ConfirmVirtualAccountPaymentInput, type CreateCheckoutSessionInput, type CreateCheckoutSessionResponse, type CreateDynamicVirtualAccountInput, type CreateStablecoinVirtualCardInput, type CreateStaticVirtualAccountInput, type CreateVirtualCardInput, type DataCheckoutMetadata, type DataLookupInput, type ElectricityCheckoutMetadata, type ElectricityService, type FetchCableBouquetsInput, type FundBettingWalletInput, type GetVirtualCardTransactionsInput, type InitializeCheckoutTransferInput, type InternationalProductsInput, type InternationalProvidersInput, type InternationalRateInput, type LookupJambUserInput, type MeterType, type PayCableInput, type PayElectricityInput, Payscribe, PayscribeApiError, type PayscribeConfig, type PayscribeEnvironment, type PayscribeRequestOptions, type PayscribeWebhookEvent, type ProcessAirtimeToWalletInput, type PurchaseEPinInput, type PurchaseSpectranetPinsInput, type RequeryTransactionInput, type RetrieveEPinInput, type SendBulkSmsInput, type SimulateVirtualAccountTransferInput, type StablecoinCardOrderResponse, type StablecoinChain, type StablecoinCurrency, type StablecoinFundingInput, type StablecoinNetwork, type TopUpCableInput, type TopUpVirtualCardInput, type TopUpVirtualCardWithStablecoinInput, type UpdateVirtualCardContactInput, type ValidateCableSmartCardInput, type ValidateCheckoutSessionInput, type ValidateElectricityInput, type VendAirtimeInput, type VendDataInput, type VendInternationalBillInput, type VirtualAccountResponse, type VirtualCardActionResponse, type VirtualCardDetails, type VirtualCardReferenceInput, type VirtualCardResponse, type VirtualCardTransactionDetails, type VirtualCardTransactionsResponse, type WithdrawVirtualCardInput };
