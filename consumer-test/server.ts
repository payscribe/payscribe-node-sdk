import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response
} from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import {
  Payscribe,
  type CreateDynamicVirtualAccountInput,
  type CreateStaticVirtualAccountInput
} from "@payscribe.co/virtual-accounts-sdk";

type VerifyWebhookBody = {
  rawBody: string;
  signature: string;
};

const app = express();
const port = Number(process.env.PORT ?? 4001);

app.use(express.json());

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
