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
