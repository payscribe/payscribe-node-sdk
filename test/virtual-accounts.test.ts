import { describe, expect, it, vi } from "vitest";
import { Payscribe } from "../src/index.js";

describe("virtual accounts", () => {
  it("maps static account input to the Payscribe API payload", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ status: true, status_code: 200 }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualAccounts.createStatic({
      customerId: "customer-uuid",
      banks: ["9psb"]
    });

    const options = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(options?.body))).toEqual({
      account_type: "static",
      currency: "NGN",
      customer_id: "customer-uuid",
      bank: ["9psb"]
    });

    vi.unstubAllGlobals();
  });

  it("maps dynamic account input to the Payscribe API payload", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ status: true, status_code: 200 }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualAccounts.createDynamic({
      reference: "order_123",
      amount: 2500,
      expiresIn: { duration: 1, type: "hours" },
      customer: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "08099228833"
      }
    });

    const options = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      account_type: "dynamic",
      ref: "order_123",
      currency: "NGN",
      order: {
        amount: 2500,
        amount_type: "EXACT"
      }
    });

    vi.unstubAllGlobals();
  });
});
