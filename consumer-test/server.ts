import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response
} from "express";
import swaggerUi from "swagger-ui-express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import {
  Payscribe,
  type BulkAirtimeInput,
  type CreateVirtualCardInput,
  type CreateDynamicVirtualAccountInput,
  type CreateStaticVirtualAccountInput,
  type FundBettingWalletInput,
  type LookupJambUserInput,
  type PayCableInput,
  type PayElectricityInput,
  type ProcessAirtimeToWalletInput,
  type PurchaseEPinInput,
  type PurchaseSpectranetPinsInput,
  type SendBulkSmsInput,
  type TopUpCableInput,
  type ValidateCableSmartCardInput,
  type ValidateElectricityInput,
  type VendAirtimeInput,
  type VendDataInput,
  type VendInternationalBillInput
} from "@payscribe.co/sdk";
import { consumerOpenApiSpec } from "./openapi.js";

type VerifyWebhookBody = {
  rawBody: string;
  signature: string;
};

const app = express();
const port = Number(process.env.PORT ?? 4001);

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(consumerOpenApiSpec));
app.get("/openapi.json", (_req, res) => res.json(consumerOpenApiSpec));

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY ?? "missing-secret-key",
  environment: process.env.PAYSCRIBE_ENVIRONMENT === "production" ? "production" : "sandbox"
});

console.log("Payscribe SDK config", {
  environment: process.env.PAYSCRIBE_ENVIRONMENT ?? "sandbox",
  hasSecretKey: Boolean(process.env.PAYSCRIBE_SECRET_KEY),
  secretKeyPrefix: maskPrefix(process.env.PAYSCRIBE_SECRET_KEY)
});

app.get("/", (_req, res) => {
  res.json({
    service: "Payscribe SDK consumer test",
    routes: [
      "GET /health",
      "POST /virtual-accounts/static",
      "POST /virtual-accounts/dynamic",
      "GET /virtual-accounts/:accountNumber",
      "POST /virtual-cards",
      "GET /virtual-cards/:cardId",
      "GET /bills/cable/bouquets",
      "POST /bills/cable/validate",
      "POST /bills/cable/pay",
      "POST /bills/cable/topup",
      "GET /bills/data/lookup",
      "POST /bills/data/vend",
      "POST /bills/electricity/validate",
      "POST /bills/electricity/pay",
      "POST /bills/airtime",
      "POST /bills/airtime/bulk",
      "GET /bills/requery",
      "POST /webhooks/verify"
    ]
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    environment: process.env.PAYSCRIBE_ENVIRONMENT ?? "sandbox"
  });
});

app.post(
  "/virtual-accounts/static",
  asyncHandler(async (req: Request<object, unknown, CreateStaticVirtualAccountInput>, res) => {
    const result = await payscribe.virtualAccounts.createStatic(req.body);
    res.json(result);
  })
);

app.post(
  "/virtual-accounts/dynamic",
  asyncHandler(async (req: Request<object, unknown, CreateDynamicVirtualAccountInput>, res) => {
    const result = await payscribe.virtualAccounts.createDynamic(req.body);
    res.json(result);
  })
);

app.get(
  "/virtual-accounts/:accountNumber",
  asyncHandler(async (req: Request<{ accountNumber: string }>, res) => {
    const result = await payscribe.virtualAccounts.get(req.params.accountNumber);
    res.json(result);
  })
);

app.post(
  "/virtual-cards",
  asyncHandler(async (req: Request<object, unknown, CreateVirtualCardInput>, res) => {
    const result = await payscribe.virtualCards.create(req.body);
    res.json(result);
  })
);

app.post(
  "/virtual-cards/stablecoin",
  asyncHandler(async (req: Request, res) => {
    res.json(await payscribe.virtualCards.createWithStablecoin(req.body));
  })
);

app.get(
  "/virtual-cards/:cardId",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    const result = await payscribe.virtualCards.get(req.params.cardId);
    res.json(result);
  })
);

app.patch(
  "/virtual-cards/:cardId/topup",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.topUp(req.params.cardId, req.body));
  })
);

app.patch(
  "/virtual-cards/:cardId/topup/stablecoin",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.topUpWithStablecoin(req.params.cardId, req.body));
  })
);

app.patch(
  "/virtual-cards/:cardId/withdraw",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.withdraw(req.params.cardId, req.body));
  })
);

app.patch(
  "/virtual-cards/:cardId/replace",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.replace(req.params.cardId));
  })
);

app.get(
  "/virtual-cards/:cardId/transactions",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(
      await payscribe.virtualCards.transactions(req.params.cardId, {
        startDate: String(req.query.startDate ?? ""),
        endDate: String(req.query.endDate ?? ""),
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined
      })
    );
  })
);

app.patch(
  "/virtual-cards/:cardId/freeze",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.freeze(req.params.cardId, req.body));
  })
);

app.patch(
  "/virtual-cards/:cardId/unfreeze",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.unfreeze(req.params.cardId, req.body));
  })
);

app.post(
  "/virtual-cards/:cardId/terminate",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.terminate(req.params.cardId, req.body));
  })
);

app.patch(
  "/virtual-cards/:cardId/contact",
  asyncHandler(async (req: Request<{ cardId: string }>, res) => {
    res.json(await payscribe.virtualCards.updateContact(req.params.cardId, req.body));
  })
);

app.get("/bills/cable/bouquets", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.fetchBouquets({ service: String(req.query.service ?? "") }));
}));

app.post("/bills/cable/validate", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.validateSmartCard(body<ValidateCableSmartCardInput>(req)));
}));

app.post("/bills/cable/pay", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.pay(body<PayCableInput>(req)));
}));

app.post("/bills/cable/topup", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.topUp(body<TopUpCableInput>(req)));
}));

app.get("/bills/internet/services", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.internet.listServices());
}));

app.get("/bills/internet/spectranet/pins/plans", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.internet.spectranetPinPlans());
}));

app.post("/bills/internet/spectranet/pins", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.internet.purchaseSpectranetPins(body<PurchaseSpectranetPinsInput>(req)));
}));

app.get("/bills/data/lookup", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.data.lookup({
      network: req.query.network ? String(req.query.network) : undefined,
      category: req.query.category ? String(req.query.category) : undefined
    })
  );
}));

app.post("/bills/data/vend", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.data.vend(body<VendDataInput>(req)));
}));

app.get("/bills/epins", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.epins.list());
}));

app.post("/bills/epins", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.purchase(body<PurchaseEPinInput>(req)));
}));

app.post("/bills/epins/jamb/lookup", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.lookupJambUser(body<LookupJambUserInput>(req)));
}));

app.get("/bills/epins/retrieve", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.retrieve({ transactionId: String(req.query.transactionId ?? "") }));
}));

app.post("/bills/airtime-to-wallet/lookup", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.airtimeToWallet.lookup());
}));

app.post("/bills/airtime-to-wallet/process", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtimeToWallet.process(body<ProcessAirtimeToWalletInput>(req)));
}));

app.post("/bills/electricity/validate", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.electricity.validate(body<ValidateElectricityInput>(req)));
}));

app.post("/bills/electricity/pay", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.electricity.pay(body<PayElectricityInput>(req)));
}));

app.post("/bills/sms", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.sms.send(body<SendBulkSmsInput>(req)));
}));

app.get("/bills/betting/providers", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.betting.listProviders());
}));

app.get("/bills/betting/lookup", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.betting.lookup({
      betId: String(req.query.betId ?? ""),
      customerId: String(req.query.customerId ?? "")
    })
  );
}));

app.post("/bills/betting/fund", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.betting.fundWallet(body<FundBettingWalletInput>(req)));
}));

app.post("/bills/airtime", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtime.vend(body<VendAirtimeInput>(req)));
}));

app.post("/bills/airtime/bulk", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtime.bulkVend(body<BulkAirtimeInput>(req)));
}));

app.get("/bills/international/countries", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.international.countries());
}));

app.get("/bills/international/providers", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.international.providers({ iso: String(req.query.iso ?? "") }));
}));

app.get("/bills/international/products", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.international.products({
      iso: String(req.query.iso ?? ""),
      code: String(req.query.code ?? "")
    })
  );
}));

app.get("/bills/international/rate", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.international.rate({
      iso: String(req.query.iso ?? ""),
      sku: String(req.query.sku ?? ""),
      amount: String(req.query.amount ?? "")
    })
  );
}));

app.post("/bills/international/vend", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.international.vend(body<VendInternationalBillInput>(req)));
}));

app.get("/bills/requery", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.requery({ transactionId: String(req.query.transactionId ?? "") }));
}));

app.post("/webhooks/verify", (req: Request<object, unknown, VerifyWebhookBody>, res) => {
  const rawBody = String(req.body.rawBody ?? "");
  const signature = String(req.body.signature ?? "");

  res.json({
    valid: payscribe.webhooks.verifySignature(rawBody, signature)
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const typedError = error as {
    name?: string;
    message?: string;
    statusCode?: number;
    response?: unknown;
  };

  res.status(typedError.statusCode ?? 500).json({
    error: typedError.name ?? "Error",
    message: typedError.message ?? "Unexpected error",
    response: typedError.response
  });
});

app.listen(port, () => {
  console.log(`Consumer test server running at http://localhost:${port}`);
  console.log(`Consumer Swagger docs running at http://localhost:${port}/docs`);
});

function asyncHandler<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
>(
  handler: RequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function maskPrefix(value: string | undefined): string | null {
  if (!value) return null;
  return `${value.slice(0, 10)}...`;
}

function body<T>(req: Request): T {
  return req.body as T;
}
