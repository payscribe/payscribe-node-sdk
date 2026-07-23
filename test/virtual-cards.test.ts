import { describe, expect, it, vi } from "vitest";
import { Payscribe } from "../src/index.js";

describe("virtual cards", () => {
  it("maps create card input to the Payscribe API payload", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualCards.create({
      customerId: "customer-uuid",
      brand: "VISA",
      amount: 10,
      reference: "card_ref_123",
      contactless: true,
      cardLimits: {
        dailyLimit: 100,
        transactionLimit: 25
      }
    });

    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://sandbox.payscribe.ng/api/v1/cards/create");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      customer_id: "customer-uuid",
      currency: "USD",
      brand: "VISA",
      amount: 10,
      type: "virtual",
      ref: "card_ref_123",
      contactless: true,
      card_limits: {
        daily_limit: 100,
        transaction_limit: 25
      }
    });

    vi.unstubAllGlobals();
  });

  it("maps stablecoin card creation fields", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualCards.createWithStablecoin({
      customerId: "customer-uuid",
      brand: "MASTERCARD",
      amount: 5,
      reference: "stable_ref_123",
      stablecoinCurrency: "USDC",
      stablecoinNetwork: "Ethereum",
      stablecoinChain: "ERC20"
    });

    const options = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      customer_id: "customer-uuid",
      brand: "MASTERCARD",
      amount: 5,
      ref: "stable_ref_123",
      payment_method: "stablecoin",
      stablecoin_currency: "USDC",
      stablecoin_network: "Ethereum",
      stablecoin_chain: "ERC20"
    });

    vi.unstubAllGlobals();
  });

  it("maps top up and stablecoin top up payloads", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualCards.topUp("card-uuid", {
      amount: 10,
      reference: "topup_ref_123"
    });
    await payscribe.virtualCards.topUpWithStablecoin("card-uuid", {
      amount: 15
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/cards/card-uuid/topup"
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      amount: 10,
      ref: "topup_ref_123"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      amount: 15,
      payment_method: "stablecoin",
      stablecoin_currency: "USDT",
      stablecoin_network: "Tron",
      stablecoin_chain: "TRC20"
    });

    vi.unstubAllGlobals();
  });

  it("builds transaction query params", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualCards.transactions("card-uuid", {
      startDate: "2024-07-01",
      endDate: "2024-07-30",
      pageSize: 20,
      page: 1
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/cards/card-uuid/transactions?start_date=2024-07-01&end_date=2024-07-30&page_size=20&page=1"
    );

    vi.unstubAllGlobals();
  });

  it("maps card control actions", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.virtualCards.freeze("card-uuid", { reference: "freeze_ref" });
    await payscribe.virtualCards.unfreeze("card-uuid", { reference: "unfreeze_ref" });
    await payscribe.virtualCards.terminate("card-uuid", { reference: "terminate_ref" });

    expect(fetchMock.mock.calls.map((call) => [String(call[0]), call[1]?.method])).toEqual([
      ["https://sandbox.payscribe.ng/api/v1/cards/card-uuid/freeze", "PATCH"],
      ["https://sandbox.payscribe.ng/api/v1/cards/card-uuid/unfreeze", "PATCH"],
      ["https://sandbox.payscribe.ng/api/v1/cards/card-uuid/terminate", "POST"]
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      ref: "terminate_ref"
    });

    vi.unstubAllGlobals();
  });
});

function mockFetch() {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ status: true, status_code: 200 }))
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
