export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Payscribe Virtual Accounts SDK Playground",
    version: "0.1.0",
    description:
      "Local testing UI that proxies requests through the TypeScript SDK. Configure PAYSCRIBE_SECRET_KEY in .env before trying live requests."
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [{ name: "Virtual Accounts" }],
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
