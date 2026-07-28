const payscribeResponse = { "200": { description: "Payscribe response" } };
const verificationResponse = { "200": { description: "Verification result" } };

const jsonBody = (schema: string) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` }
    }
  }
});

const pathParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" }
});

const queryParam = (name: string, required = false, example?: string | number) => ({
  name,
  in: "query",
  required,
  schema: { type: typeof example === "number" ? "number" : "string", example }
});

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Payscribe SDK Playground",
    version: "0.3.0",
    description:
      "Local testing UI that proxies virtual account, virtual card, bills, and webhook requests through the TypeScript SDK. Configure PAYSCRIBE_SECRET_KEY in .env before trying live requests."
  },
  servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}` }],
  tags: [
    { name: "Virtual Accounts" },
    { name: "Virtual Cards" },
    { name: "Bills - Cable" },
    { name: "Bills - Internet" },
    { name: "Bills - Data" },
    { name: "Bills - ePins" },
    { name: "Bills - Airtime To Wallet" },
    { name: "Bills - Electricity" },
    { name: "Bills - SMS" },
    { name: "Bills - Betting" },
    { name: "Bills - Airtime" },
    { name: "Bills - International" },
    { name: "Bills - Requery" },
    { name: "Webhooks" }
  ],
  paths: {
    "/api/virtual-accounts/static": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Create a permanent virtual account",
        requestBody: jsonBody("CreateStaticAccount"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-accounts/dynamic": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Create a dynamic virtual account",
        requestBody: jsonBody("CreateDynamicAccount"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-accounts/{accountNumber}": {
      get: {
        tags: ["Virtual Accounts"],
        summary: "Get virtual account details",
        parameters: [pathParam("accountNumber")],
        responses: payscribeResponse
      }
    },
    "/api/virtual-accounts/{accountNumber}/activate": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Reactivate a virtual account",
        parameters: [pathParam("accountNumber")],
        responses: payscribeResponse
      }
    },
    "/api/virtual-accounts/{accountNumber}/deactivate": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Deactivate a virtual account",
        parameters: [pathParam("accountNumber")],
        responses: payscribeResponse
      }
    },
    "/api/virtual-accounts/confirm-payment": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Confirm a virtual account payment",
        requestBody: jsonBody("ConfirmPayment"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Create a virtual USD card",
        requestBody: jsonBody("CreateVirtualCard"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/stablecoin": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Create a virtual USD card funded by stablecoin",
        requestBody: jsonBody("CreateStablecoinVirtualCard"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}": {
      get: {
        tags: ["Virtual Cards"],
        summary: "Get virtual card details",
        parameters: [pathParam("cardId")],
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/topup": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Top up a virtual card",
        parameters: [pathParam("cardId")],
        requestBody: jsonBody("TopUpVirtualCard"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/topup/stablecoin": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Top up a virtual card with stablecoin",
        parameters: [pathParam("cardId")],
        requestBody: jsonBody("TopUpStablecoinVirtualCard"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/withdraw": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Withdraw from a virtual card",
        parameters: [pathParam("cardId")],
        requestBody: jsonBody("CardReferenceAmount"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/replace": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Replace a virtual card",
        parameters: [pathParam("cardId")],
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/transactions": {
      get: {
        tags: ["Virtual Cards"],
        summary: "Get virtual card transactions",
        parameters: [
          pathParam("cardId"),
          queryParam("startDate", true, "2024-07-01"),
          queryParam("endDate", true, "2024-07-30"),
          queryParam("pageSize", false, 20),
          queryParam("page", false, 1)
        ],
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/freeze": cardActionPath("Freeze a virtual card"),
    "/api/virtual-cards/{cardId}/unfreeze": cardActionPath("Unfreeze a virtual card"),
    "/api/virtual-cards/{cardId}/terminate": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Terminate a virtual card",
        parameters: [pathParam("cardId")],
        requestBody: jsonBody("CardReference"),
        responses: payscribeResponse
      }
    },
    "/api/virtual-cards/{cardId}/contact": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Update virtual card contact details",
        parameters: [pathParam("cardId")],
        requestBody: jsonBody("UpdateVirtualCardContact"),
        responses: payscribeResponse
      }
    },
    "/api/bills/cable/bouquets": {
      get: {
        tags: ["Bills - Cable"],
        summary: "Fetch cable bouquets",
        parameters: [queryParam("service", true, "dstv")],
        responses: payscribeResponse
      }
    },
    "/api/bills/cable/validate": billPost("Bills - Cable", "Validate smart card number", "ValidateCableSmartCard"),
    "/api/bills/cable/pay": billPost("Bills - Cable", "Pay cable TV subscription", "PayCable"),
    "/api/bills/cable/topup": billPost("Bills - Cable", "Top up cable TV subscription", "TopUpCable"),
    "/api/bills/internet/services": billGet("Bills - Internet", "List internet services"),
    "/api/bills/internet/spectranet/pins/plans": billGet("Bills - Internet", "Fetch Spectranet pin plans"),
    "/api/bills/internet/spectranet/pins": billPost("Bills - Internet", "Purchase Spectranet pins", "PurchaseSpectranetPins"),
    "/api/bills/data/lookup": {
      get: {
        tags: ["Bills - Data"],
        summary: "Lookup data plans",
        parameters: [queryParam("network", false, "mtn"), queryParam("category", false, "sme")],
        responses: payscribeResponse
      }
    },
    "/api/bills/data/vend": billPost("Bills - Data", "Vend data", "VendData"),
    "/api/bills/epins": {
      get: { tags: ["Bills - ePins"], summary: "List available ePins", responses: payscribeResponse },
      post: {
        tags: ["Bills - ePins"],
        summary: "Purchase ePin",
        requestBody: jsonBody("PurchaseEPin"),
        responses: payscribeResponse
      }
    },
    "/api/bills/epins/jamb/lookup": billPost("Bills - ePins", "Lookup JAMB user", "LookupJambUser"),
    "/api/bills/epins/retrieve": {
      get: {
        tags: ["Bills - ePins"],
        summary: "Retrieve ePin by transaction ID",
        parameters: [queryParam("transactionId", true, "transaction-id")],
        responses: payscribeResponse
      }
    },
    "/api/bills/airtime-to-wallet/lookup": billPost("Bills - Airtime To Wallet", "Lookup airtime-to-wallet networks", undefined, false),
    "/api/bills/airtime-to-wallet/process": billPost("Bills - Airtime To Wallet", "Process airtime to wallet", "ProcessAirtimeToWallet"),
    "/api/bills/electricity/validate": billPost("Bills - Electricity", "Validate electricity meter", "ValidateElectricity"),
    "/api/bills/electricity/pay": billPost("Bills - Electricity", "Pay electricity bill", "PayElectricity"),
    "/api/bills/sms": billPost("Bills - SMS", "Send bulk SMS", "SendBulkSms"),
    "/api/bills/betting/providers": billGet("Bills - Betting", "List betting providers"),
    "/api/bills/betting/lookup": {
      get: {
        tags: ["Bills - Betting"],
        summary: "Lookup betting account",
        parameters: [queryParam("betId", true, "bet9ja"), queryParam("customerId", true, "422984")],
        responses: payscribeResponse
      }
    },
    "/api/bills/betting/fund": billPost("Bills - Betting", "Fund betting wallet", "FundBettingWallet"),
    "/api/bills/airtime": billPost("Bills - Airtime", "Vend airtime", "VendAirtime"),
    "/api/bills/airtime/bulk": billPost("Bills - Airtime", "Vend bulk airtime across networks", "BulkAirtime"),
    "/api/bills/international/countries": billGet("Bills - International", "List international bills countries"),
    "/api/bills/international/providers": {
      get: {
        tags: ["Bills - International"],
        summary: "List international bill providers",
        parameters: [queryParam("iso", true, "GH")],
        responses: payscribeResponse
      }
    },
    "/api/bills/international/products": {
      get: {
        tags: ["Bills - International"],
        summary: "List international bill products",
        parameters: [queryParam("iso", true, "GH"), queryParam("code", true, "MTGH")],
        responses: payscribeResponse
      }
    },
    "/api/bills/international/rate": {
      get: {
        tags: ["Bills - International"],
        summary: "Estimate international bill rate",
        parameters: [
          queryParam("iso", true, "GH"),
          queryParam("sku", true, "GH_MT_TopUp"),
          queryParam("amount", true, 1.2)
        ],
        responses: payscribeResponse
      }
    },
    "/api/bills/international/vend": billPost("Bills - International", "Vend international bill", "VendInternationalBill"),
    "/api/bills/requery": {
      get: {
        tags: ["Bills - Requery"],
        summary: "Requery a pending or completed transaction",
        parameters: [queryParam("transactionId", true, "transaction-id")],
        responses: payscribeResponse
      }
    },
    "/api/webhooks/verify": {
      post: {
        tags: ["Webhooks"],
        summary: "Verify a Payscribe webhook signature",
        requestBody: jsonBody("VerifyWebhook"),
        responses: verificationResponse
      }
    }
  },
  components: {
    schemas: {
      ...accountSchemas(),
      ...cardSchemas(),
      ...billSchemas(),
      VerifyWebhook: objectSchema(["rawBody", "signature"], {
        rawBody: { type: "string", example: "{\"event_type\":\"accounts.payment.status\"}" },
        signature: { type: "string", example: "hmac-signature" }
      })
    }
  }
};

function cardActionPath(summary: string) {
  return {
    patch: {
      tags: ["Virtual Cards"],
      summary,
      parameters: [pathParam("cardId")],
      requestBody: jsonBody("CardReference"),
      responses: payscribeResponse
    }
  };
}

function billGet(tag: string, summary: string) {
  return { get: { tags: [tag], summary, responses: payscribeResponse } };
}

function billPost(tag: string, summary: string, schema?: string, hasBody = true) {
  return {
    post: {
      tags: [tag],
      summary,
      ...(hasBody && schema ? { requestBody: jsonBody(schema) } : {}),
      responses: payscribeResponse
    }
  };
}

function objectSchema(required: string[], properties: Record<string, unknown>) {
  return { type: "object", required, properties };
}

function accountSchemas() {
  return {
    CreateStaticAccount: objectSchema(["customerId", "banks"], {
    customerId: { type: "string", example: "customer-uuid" },
    banks: { type: "array", items: { type: "string" }, example: ["9psb"] },
    currency: { type: "string", default: "NGN" },
    identity: {
      type: "object",
      properties: {
        type: { type: "string", example: "bvn" },
        number: { type: "string", example: "2233990011" }
      }
    }
    }),
    CreateDynamicAccount: objectSchema(["reference", "amount", "expiresIn", "customer"], {
    reference: { type: "string", example: "order_123" },
    amount: { type: "number", example: 2500 },
    amountType: { type: "string", enum: ["EXACT", "ANY"], default: "EXACT" },
    description: { type: "string", example: "Payment for order_123" },
    currency: { type: "string", default: "NGN" },
    expiresIn: {
      type: "object",
      required: ["duration", "type"],
      properties: {
        duration: { type: "number", example: 1 },
        type: { type: "string", example: "hours" }
      }
    },
    customer: {
      type: "object",
      required: ["name", "email", "phone"],
      properties: {
        name: { type: "string", example: "Ada Lovelace" },
        email: { type: "string", example: "ada@example.com" },
        phone: { type: "string", example: "08099228833" }
      }
    }
    }),
    ConfirmPayment: objectSchema(["sessionId", "amount", "accountNumber"], {
    transId: { type: "string" },
    sessionId: { type: "string" },
    amount: { type: "number" },
    accountNumber: { type: "string" }
    })
  };
}

function cardSchemas() {
  return {
    CreateVirtualCard: objectSchema(["customerId", "brand", "amount", "reference"], {
    customerId: { type: "string", example: "customer-uuid" },
    currency: { type: "string", default: "USD" },
    brand: { type: "string", enum: ["VISA", "MASTERCARD"], example: "VISA" },
    amount: { type: "number", example: 10 },
    type: { type: "string", default: "virtual" },
    reference: { type: "string", example: "card_ref_123" },
    contactless: { type: "boolean", example: true },
    cardLimits: {
      type: "object",
      properties: {
        dailyLimit: { type: "number", example: 100 },
        transactionLimit: { type: "number", example: 25 }
      }
    }
    }),
    CreateStablecoinVirtualCard: {
      allOf: [{ $ref: "#/components/schemas/CreateVirtualCard" }, { $ref: "#/components/schemas/StablecoinFunding" }]
    },
    TopUpVirtualCard: objectSchema(["amount"], {
    amount: { type: "number", example: 10 },
    reference: { type: "string", example: "topup_ref_123" }
    }),
    TopUpStablecoinVirtualCard: {
      allOf: [{ $ref: "#/components/schemas/TopUpVirtualCard" }, { $ref: "#/components/schemas/StablecoinFunding" }]
    },
    StablecoinFunding: objectSchema([], {
    stablecoinCurrency: { type: "string", default: "USDT", example: "USDT" },
    stablecoinNetwork: { type: "string", default: "Tron", example: "Tron" },
    stablecoinChain: { type: "string", default: "TRC20", example: "TRC20" }
    }),
    CardReferenceAmount: objectSchema(["amount", "reference"], {
    amount: { type: "number", example: 5 },
    reference: { type: "string", example: "withdraw_ref_123" }
    }),
    CardReference: objectSchema(["reference"], {
    reference: { type: "string", example: "card_action_ref_123" }
    }),
    UpdateVirtualCardContact: objectSchema([], {
    email: { type: "string", example: "john.doe@example.com" },
    mobile: { type: "string", example: "+2348012345678" },
    billingDetails: {
      type: "object",
      properties: {
        address1: { type: "string", example: "12 Broad Street" },
        address2: { type: "string", example: "Suite 4" },
        city: { type: "string", example: "Lagos" },
        state: { type: "string", example: "Lagos" },
        zipcode: { type: "string", example: "100001" },
        country: { type: "string", example: "NG" }
      }
    }
    })
  };
}

function billSchemas() {
  return {
    ValidateCableSmartCard: objectSchema(["service", "account", "planId"], {
    service: { type: "string", example: "dstv" },
    account: { type: "string", example: "8062415043" },
    month: { type: "integer", example: 1 },
    planId: { type: "string", example: "PLAN_CODE" }
    }),
    PayCable: objectSchema(["planId", "customerName", "account", "service", "reference"], {
    planId: { type: "string", example: "PLAN_CODE" },
    customerName: { type: "string", example: "Ada Lovelace" },
    account: { type: "string", example: "8062415043" },
    service: { type: "string", example: "dstv" },
    reference: { type: "string", example: "cable_ref_123" },
    phone: { type: "string", example: "08199228811" },
    email: { type: "string", example: "ada@example.com" },
    month: { type: "integer", example: 1 }
    }),
    TopUpCable: objectSchema(["amount", "customerName", "account", "service", "reference"], {
    amount: { type: "number", example: 10000 },
    customerName: { type: "string", example: "Ada Lovelace" },
    account: { type: "string", example: "8062415043" },
    service: { type: "string", example: "dstv" },
    reference: { type: "string", example: "cable_topup_ref_123" },
    phone: { type: "string", example: "08199228811" },
    email: { type: "string", example: "ada@example.com" },
    month: { type: "integer", example: 1 }
    }),
    PurchaseSpectranetPins: objectSchema(["planId", "quantity", "reference"], {
    planId: { type: "string", example: "PSPLAN_1270" },
    quantity: { type: "integer", example: 1 },
    reference: { type: "string", example: "spectranet_ref_123" }
    }),
    VendData: objectSchema(["plan", "recipient", "network"], {
    plan: { type: "string", example: "PSPLAN_177" },
    recipient: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }], example: ["08169254598"] },
    network: { type: "string", example: "mtn" },
    reference: { type: "string", example: "data_ref_123" }
    }),
    PurchaseEPin: objectSchema(["id", "quantity", "reference"], {
    id: { type: "string", example: "neco" },
    quantity: { type: "integer", example: 1 },
    reference: { type: "string", example: "epin_ref_123" }
    }),
    LookupJambUser: objectSchema(["id", "account"], {
    id: { type: "integer", example: 3 },
    account: { type: "string", example: "9610729153" }
    }),
    ProcessAirtimeToWallet: objectSchema(["network", "amount", "phoneNumber", "from"], {
    network: { type: "string", example: "mtn" },
    amount: { type: "number", example: 1000 },
    phoneNumber: { type: "string", example: "07038067493" },
    from: { type: "string", example: "08169254598" },
    reference: { type: "string", example: "airtime_wallet_ref_123" }
    }),
    ValidateElectricity: objectSchema(["meterNumber", "meterType", "amount", "service"], {
    meterNumber: { type: "string", example: "45083082250" },
    meterType: { type: "string", example: "prepaid" },
    amount: { type: "number", example: 1000 },
    service: { type: "string", example: "phedc" }
    }),
    PayElectricity: objectSchema(["meterNumber", "meterType", "amount", "service", "customerName"], {
    meterNumber: { type: "string", example: "45083082250" },
    meterType: { type: "string", example: "prepaid" },
    amount: { type: "number", example: 1000 },
    service: { type: "string", example: "phedc" },
    customerName: { type: "string", example: "Ada Lovelace" },
    address: { type: "string", example: "12 Broad Street" },
    phone: { type: "string", example: "07038067493" },
    email: { type: "string", example: "ada@example.com" },
    reference: { type: "string", example: "electricity_ref_123" }
    }),
    SendBulkSms: objectSchema(["to", "message"], {
    to: { type: "string", example: "08169254598" },
    message: { type: "string", example: "Hello Payscribe!" },
    reference: { type: "string", example: "sms_ref_123" },
    senderId: { type: "string", example: "Pscribe" }
    }),
    FundBettingWallet: objectSchema(["betId", "customerId", "customerName", "amount", "reference"], {
    betId: { type: "string", example: "bet9ja" },
    customerId: { type: "string", example: "422984" },
    customerName: { type: "string", example: "Ada Lovelace" },
    amount: { type: "number", example: 100 },
    reference: { type: "string", example: "betting_ref_123" }
    }),
    VendAirtime: objectSchema(["network", "amount", "recipient"], {
    network: { type: "string", example: "mtn" },
    amount: { type: "number", example: 50 },
    recipient: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }], example: "08169254598" },
    ported: { type: "boolean", example: false },
    reference: { type: "string", example: "airtime_ref_123" }
    }),
    BulkAirtime: objectSchema(["rows"], {
    rows: {
      type: "array",
      items: {
        type: "object",
        required: ["phone", "amount", "provider"],
        properties: {
          phone: { type: "string", example: "08169254598" },
          amount: { type: "number", example: 50 },
          provider: { type: "string", example: "mtn" },
          country: { type: "string", example: "NG" },
          reference: { type: "string", example: "row_ref_123" }
        }
      }
    },
    reference: { type: "string", example: "bulk_airtime_ref_123" }
    }),
    VendInternationalBill: objectSchema(["iso", "providerCode", "sku", "amount", "account", "reference"], {
    iso: { type: "string", example: "GH" },
    providerCode: { type: "string", example: "MTGH" },
    sku: { type: "string", example: "GH_MT_TopUp" },
    amount: { type: "string", example: "1.5" },
    account: { type: "string", example: "233547011800" },
    debitCurrency: { type: "string", example: "ngn" },
    reference: { type: "string", example: "intl_ref_123" }
    })
  };
}
