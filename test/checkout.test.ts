import { describe, expect, it, vi } from "vitest";
import { Payscribe } from "../src/index.js";

describe("hosted checkout", () => {
  it("creates a Button Checkout session and exposes the canvas URL", async () => {
    const response = {
      status: true,
      status_code: 200,
      data: {
        token: "btn_abc123",
        canvas_url: "https://links.payscribe.co/canvas?token=btn_abc123",
        expires_at: "2026-08-06T15:30:00.000Z"
      }
    };
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify(response))
    );
    vi.stubGlobal("fetch", fetchMock);

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    const result = await payscribe.checkout.createSession({
      reference: "order_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "08012345678"
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).not.toHaveProperty("service");
    expect(requestBody).not.toHaveProperty("metadata");
    expect(requestBody).not.toHaveProperty("amount");

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/button/init"
    );
    expect(result.data?.canvas_url).toContain("btn_abc123");
    vi.unstubAllGlobals();
  });

  it("maps the remaining checkout workflow endpoints", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ status: true, status_code: 200, data: {} }))
    );
    vi.stubGlobal("fetch", fetchMock);
    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });

    await payscribe.checkout.getSession("btn_123");
    await payscribe.checkout.validateSession("btn_123", {
      service: "airtime",
      metadata: { network: "mtn", recipient: "08012345678" },
      amount: 100
    });
    await payscribe.checkout.initializeTransfer({ token: "btn_123", amount: 100 });
    await payscribe.checkout.getSessionStatus("btn_123");

    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "https://sandbox.payscribe.ng/api/v1/button/session/btn_123",
      "https://sandbox.payscribe.ng/api/v1/button/session/btn_123/validate",
      "https://sandbox.payscribe.ng/api/v1/button/transfer/init",
      "https://sandbox.payscribe.ng/api/v1/button/session/btn_123/status"
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      service: "airtime",
      metadata: { network: "mtn", recipient: "08012345678" },
      amount: 100
    });
    vi.unstubAllGlobals();
  });
});
