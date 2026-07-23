export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Payscribe SDK Playground",
    version: "0.1.0",
    description:
      "Local testing UI that proxies virtual account and virtual card requests through the TypeScript SDK. Configure PAYSCRIBE_SECRET_KEY in .env before trying live requests."
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [{ name: "Virtual Accounts" }, { name: "Virtual Cards" }],
  paths: {
    "/api/virtual-accounts/static": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Create a permanent virtual account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStaticAccount" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-accounts/dynamic": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Create a dynamic virtual account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDynamicAccount" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-accounts/{accountNumber}": {
      get: {
        tags: ["Virtual Accounts"],
        summary: "Get virtual account details",
        parameters: [{ $ref: "#/components/parameters/AccountNumber" }],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-accounts/{accountNumber}/activate": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Reactivate a virtual account",
        parameters: [{ $ref: "#/components/parameters/AccountNumber" }],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-accounts/{accountNumber}/deactivate": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Deactivate a virtual account",
        parameters: [{ $ref: "#/components/parameters/AccountNumber" }],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-accounts/confirm-payment": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Confirm a virtual account payment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfirmPayment" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Create a virtual USD card",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVirtualCard" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/stablecoin": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Create a virtual USD card funded by stablecoin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStablecoinVirtualCard" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}": {
      get: {
        tags: ["Virtual Cards"],
        summary: "Get virtual card details",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/topup": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Top up a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TopUpVirtualCard" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/topup/stablecoin": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Top up a virtual card with stablecoin",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TopUpStablecoinVirtualCard" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/withdraw": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Withdraw from a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardReferenceAmount" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/replace": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Replace a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/transactions": {
      get: {
        tags: ["Virtual Cards"],
        summary: "Get virtual card transactions",
        parameters: [
          { $ref: "#/components/parameters/CardId" },
          {
            name: "startDate",
            in: "query",
            required: true,
            schema: { type: "string", example: "2024-07-01" }
          },
          {
            name: "endDate",
            in: "query",
            required: true,
            schema: { type: "string", example: "2024-07-30" }
          },
          { name: "pageSize", in: "query", schema: { type: "integer", example: 20 } },
          { name: "page", in: "query", schema: { type: "integer", example: 1 } }
        ],
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/freeze": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Freeze a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardReference" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/unfreeze": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Unfreeze a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardReference" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/terminate": {
      post: {
        tags: ["Virtual Cards"],
        summary: "Terminate a virtual card",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardReference" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/virtual-cards/{cardId}/contact": {
      patch: {
        tags: ["Virtual Cards"],
        summary: "Update virtual card contact details",
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateVirtualCardContact" }
            }
          }
        },
        responses: { "200": { description: "Payscribe response" } }
      }
    },
    "/api/webhooks/verify": {
      post: {
        tags: ["Virtual Accounts"],
        summary: "Verify a Payscribe webhook signature",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyWebhook" }
            }
          }
        },
        responses: { "200": { description: "Verification result" } }
      }
    }
  },
  components: {
    parameters: {
      AccountNumber: {
        name: "accountNumber",
        in: "path",
        required: true,
        schema: { type: "string" }
      },
      CardId: {
        name: "cardId",
        in: "path",
        required: true,
        schema: { type: "string" }
      }
    },
    schemas: {
      CreateStaticAccount: {
        type: "object",
        required: ["customerId", "banks"],
        properties: {
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
        }
      },
      CreateDynamicAccount: {
        type: "object",
        required: ["reference", "amount", "expiresIn", "customer"],
        properties: {
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
        }
      },
      ConfirmPayment: {
        type: "object",
        required: ["sessionId", "amount", "accountNumber"],
        properties: {
          transId: { type: "string" },
          sessionId: { type: "string" },
          amount: { type: "number" },
          accountNumber: { type: "string" }
        }
      },
      CreateVirtualCard: {
        type: "object",
        required: ["customerId", "brand", "amount", "reference"],
        properties: {
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
        }
      },
      CreateStablecoinVirtualCard: {
        allOf: [
          { $ref: "#/components/schemas/CreateVirtualCard" },
          { $ref: "#/components/schemas/StablecoinFunding" }
        ]
      },
      TopUpVirtualCard: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: { type: "number", example: 10 },
          reference: { type: "string", example: "topup_ref_123" }
        }
      },
      TopUpStablecoinVirtualCard: {
        allOf: [
          { $ref: "#/components/schemas/TopUpVirtualCard" },
          { $ref: "#/components/schemas/StablecoinFunding" }
        ]
      },
      StablecoinFunding: {
        type: "object",
        properties: {
          stablecoinCurrency: { type: "string", default: "USDT", example: "USDT" },
          stablecoinNetwork: { type: "string", default: "Tron", example: "Tron" },
          stablecoinChain: { type: "string", default: "TRC20", example: "TRC20" }
        }
      },
      CardReferenceAmount: {
        type: "object",
        required: ["amount", "reference"],
        properties: {
          amount: { type: "number", example: 5 },
          reference: { type: "string", example: "withdraw_ref_123" }
        }
      },
      CardReference: {
        type: "object",
        required: ["reference"],
        properties: {
          reference: { type: "string", example: "card_action_ref_123" }
        }
      },
      UpdateVirtualCardContact: {
        type: "object",
        properties: {
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
        }
      },
      VerifyWebhook: {
        type: "object",
        required: ["rawBody", "signature"],
        properties: {
          rawBody: { type: "string" },
          signature: { type: "string" }
        }
      }
    }
  }
};
