import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Payscribe } from "../src/index.js";

describe("webhooks", () => {
  it("verifies a valid Payscribe webhook signature", () => {
    const rawBody = JSON.stringify({ event_type: "accounts.payment.status" });
    const secretKey = "ps_sk_test_123";
    const signature = createHmac("sha256", secretKey).update(rawBody).digest("hex");
    const payscribe = new Payscribe({ secretKey });

    expect(payscribe.webhooks.verifySignature(rawBody, signature)).toBe(true);
  });

  it("rejects an invalid Payscribe webhook signature", () => {
    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });

    expect(payscribe.webhooks.verifySignature("{}", "00")).toBe(false);
  });
});
