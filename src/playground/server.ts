import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { Payscribe } from "../payscribe.js";
import { PayscribeApiError } from "../errors.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "1mb" }));

const payscribe = new Payscribe({
  secretKey: process.env.PAYSCRIBE_SECRET_KEY ?? "missing-secret-key",
  environment: process.env.PAYSCRIBE_ENVIRONMENT === "production" ? "production" : "sandbox"
});

app.get("/", (_req, res) => {
  res.redirect("/docs");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/openapi.json", (_req, res) => res.json(openApiSpec));

app.post("/api/checkout/sessions", asyncHandler(async (req, res) => {
  res.json(await payscribe.checkout.createSession(req.body));
}));

app.get("/api/checkout/sessions/:token", asyncHandler(async (req, res) => {
  res.json(await payscribe.checkout.getSession(pathParam(req.params.token)));
}));

app.post("/api/checkout/sessions/:token/validate", asyncHandler(async (req, res) => {
  res.json(await payscribe.checkout.validateSession(pathParam(req.params.token), req.body));
}));

app.post("/api/checkout/transfers", asyncHandler(async (req, res) => {
  res.json(await payscribe.checkout.initializeTransfer(req.body));
}));

app.get("/api/checkout/sessions/:token/status", asyncHandler(async (req, res) => {
  res.json(await payscribe.checkout.getSessionStatus(pathParam(req.params.token)));
}));

app.post("/api/virtual-accounts/static", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.createStatic(req.body));
}));

app.post("/api/virtual-accounts/dynamic", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.createDynamic(req.body));
}));

app.get("/api/virtual-accounts/:accountNumber", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.get(pathParam(req.params.accountNumber)));
}));

app.post("/api/virtual-accounts/:accountNumber/deactivate", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.deactivate(pathParam(req.params.accountNumber)));
}));

app.post("/api/virtual-accounts/:accountNumber/activate", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.activate(pathParam(req.params.accountNumber)));
}));

app.post("/api/virtual-accounts/confirm-payment", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualAccounts.confirmPayment(req.body));
}));

app.post("/api/virtual-cards", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.create(req.body));
}));

app.post("/api/virtual-cards/stablecoin", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.createWithStablecoin(req.body));
}));

app.get("/api/virtual-cards/:cardId", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.get(pathParam(req.params.cardId)));
}));

app.patch("/api/virtual-cards/:cardId/topup", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.topUp(pathParam(req.params.cardId), req.body));
}));

app.patch("/api/virtual-cards/:cardId/topup/stablecoin", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.topUpWithStablecoin(pathParam(req.params.cardId), req.body));
}));

app.patch("/api/virtual-cards/:cardId/withdraw", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.withdraw(pathParam(req.params.cardId), req.body));
}));

app.patch("/api/virtual-cards/:cardId/replace", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.replace(pathParam(req.params.cardId)));
}));

app.get("/api/virtual-cards/:cardId/transactions", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.virtualCards.transactions(pathParam(req.params.cardId), {
      startDate: String(req.query.startDate ?? ""),
      endDate: String(req.query.endDate ?? ""),
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined
    })
  );
}));

app.patch("/api/virtual-cards/:cardId/freeze", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.freeze(pathParam(req.params.cardId), req.body));
}));

app.patch("/api/virtual-cards/:cardId/unfreeze", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.unfreeze(pathParam(req.params.cardId), req.body));
}));

app.post("/api/virtual-cards/:cardId/terminate", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.terminate(pathParam(req.params.cardId), req.body));
}));

app.patch("/api/virtual-cards/:cardId/contact", asyncHandler(async (req, res) => {
  res.json(await payscribe.virtualCards.updateContact(pathParam(req.params.cardId), req.body));
}));

app.get("/api/bills/cable/bouquets", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.fetchBouquets({ service: String(req.query.service ?? "") }));
}));

app.post("/api/bills/cable/validate", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.validateSmartCard(req.body));
}));

app.post("/api/bills/cable/pay", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.pay(req.body));
}));

app.post("/api/bills/cable/topup", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.cable.topUp(req.body));
}));

app.get("/api/bills/internet/services", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.internet.listServices());
}));

app.get("/api/bills/internet/spectranet/pins/plans", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.internet.spectranetPinPlans());
}));

app.post("/api/bills/internet/spectranet/pins", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.internet.purchaseSpectranetPins(req.body));
}));

app.get("/api/bills/data/lookup", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.data.lookup({
      network: req.query.network ? String(req.query.network) : undefined,
      category: req.query.category ? String(req.query.category) : undefined
    })
  );
}));

app.post("/api/bills/data/vend", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.data.vend(req.body));
}));

app.get("/api/bills/epins", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.epins.list());
}));

app.post("/api/bills/epins", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.purchase(req.body));
}));

app.post("/api/bills/epins/jamb/lookup", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.lookupJambUser(req.body));
}));

app.get("/api/bills/epins/retrieve", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.epins.retrieve({ transactionId: String(req.query.transactionId ?? "") }));
}));

app.post("/api/bills/airtime-to-wallet/lookup", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.airtimeToWallet.lookup());
}));

app.post("/api/bills/airtime-to-wallet/process", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtimeToWallet.process(req.body));
}));

app.post("/api/bills/electricity/validate", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.electricity.validate(req.body));
}));

app.post("/api/bills/electricity/pay", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.electricity.pay(req.body));
}));

app.post("/api/bills/sms", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.sms.send(req.body));
}));

app.get("/api/bills/betting/providers", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.betting.listProviders());
}));

app.get("/api/bills/betting/lookup", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.betting.lookup({
      betId: String(req.query.betId ?? ""),
      customerId: String(req.query.customerId ?? "")
    })
  );
}));

app.post("/api/bills/betting/fund", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.betting.fundWallet(req.body));
}));

app.post("/api/bills/airtime", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtime.vend(req.body));
}));

app.post("/api/bills/airtime/bulk", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.airtime.bulkVend(req.body));
}));

app.get("/api/bills/international/countries", asyncHandler(async (_req, res) => {
  res.json(await payscribe.bills.international.countries());
}));

app.get("/api/bills/international/providers", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.international.providers({ iso: String(req.query.iso ?? "") }));
}));

app.get("/api/bills/international/products", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.international.products({
      iso: String(req.query.iso ?? ""),
      code: String(req.query.code ?? "")
    })
  );
}));

app.get("/api/bills/international/rate", asyncHandler(async (req, res) => {
  res.json(
    await payscribe.bills.international.rate({
      iso: String(req.query.iso ?? ""),
      sku: String(req.query.sku ?? ""),
      amount: String(req.query.amount ?? "")
    })
  );
}));

app.post("/api/bills/international/vend", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.international.vend(req.body));
}));

app.get("/api/bills/requery", asyncHandler(async (req, res) => {
  res.json(await payscribe.bills.requery({ transactionId: String(req.query.transactionId ?? "") }));
}));

app.post("/api/webhooks/verify", (req, res) => {
  const rawBody = String(req.body.rawBody ?? "");
  const signature = String(req.body.signature ?? "");
  res.json({ valid: payscribe.webhooks.verifySignature(rawBody, signature) });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof PayscribeApiError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      response: error.response
    });
    return;
  }

  const statusCode = error instanceof Error && error.name === "ZodError" ? 400 : 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unexpected error"
  });
});

app.listen(port, () => {
  console.log(`Payscribe SDK playground running at http://localhost:${port}/docs`);
});

function asyncHandler(
  handler: (req: express.Request, res: express.Response) => Promise<void>
): express.RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

function pathParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
