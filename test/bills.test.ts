import { describe, expect, it, vi } from "vitest";
import { Payscribe } from "../src/index.js";

describe("bills", () => {
  it("builds cable bouquet lookup and vend payloads", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.bills.cable.fetchBouquets({ service: "dstv" });
    await payscribe.bills.cable.validateSmartCard({
      service: "dstv",
      account: "8062415043",
      month: 1,
      planId: "PLAN_123"
    });
    await payscribe.bills.cable.pay({
      planId: "PLAN_123",
      customerName: "Ada Lovelace",
      account: "8062415043",
      service: "dstv",
      reference: "cable_ref_123",
      phone: "08199228811",
      email: "ada@example.com",
      month: 1
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/bouquets?service=dstv"
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      service: "dstv",
      account: "8062415043",
      month: 1,
      plan_id: "PLAN_123"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      plan_id: "PLAN_123",
      customer_name: "Ada Lovelace",
      account: "8062415043",
      service: "dstv",
      ref: "cable_ref_123",
      phone: "08199228811",
      email: "ada@example.com",
      month: 1
    });

    vi.unstubAllGlobals();
  });

  it("maps data lookup and vending", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.bills.data.lookup({ network: "airtel", category: "sme" });
    await payscribe.bills.data.vend({
      plan: "PSPLAN_177",
      recipient: ["08169254598", "07038067493"],
      network: "mtn",
      reference: "data_ref_123"
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/data/lookup?network=airtel&category=sme"
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      plan: "PSPLAN_177",
      recipient: ["08169254598", "07038067493"],
      network: "mtn",
      ref: "data_ref_123"
    });

    vi.unstubAllGlobals();
  });

  it("maps electricity validate, pay, and requery", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.bills.electricity.validate({
      meterNumber: "45083082250",
      meterType: "prepaid",
      amount: 1000,
      service: "phedc"
    });
    await payscribe.bills.electricity.pay({
      meterNumber: "45083082250",
      meterType: "prepaid",
      amount: 1000,
      service: "phedc",
      phone: "07038067493",
      customerName: "Ada Lovelace",
      address: "12 Broad Street",
      reference: "electricity_ref_123"
    });
    await payscribe.bills.requery({ transactionId: "trans-id-123" });

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      meter_number: "45083082250",
      meter_type: "prepaid",
      amount: 1000,
      service: "phedc"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      meter_number: "45083082250",
      customer_name: "Ada Lovelace",
      ref: "electricity_ref_123"
    });
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/requery?trans_id=trans-id-123"
    );

    vi.unstubAllGlobals();
  });

  it("maps airtime and betting payloads", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.bills.airtime.vend({
      network: "mtn",
      amount: 50,
      recipient: "08169254598",
      ported: false,
      reference: "airtime_ref_123"
    });
    await payscribe.bills.airtime.bulkVend({
      rows: [
        { phone: "08169254598", amount: 50, provider: "mtn", country: "NG" },
        { phone: "08012345678", amount: 100, provider: "airtel", country: "NG" }
      ],
      reference: "bulk_airtime_ref_123"
    });
    await payscribe.bills.betting.lookup({
      betId: "bet9ja",
      customerId: "422984"
    });

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      network: "mtn",
      amount: 50,
      recipient: "08169254598",
      ported: false,
      ref: "airtime_ref_123"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      rows: [
        { phone: "08169254598", amount: 50, provider: "mtn", country: "NG" },
        { phone: "08012345678", amount: 100, provider: "airtel", country: "NG" }
      ],
      ref: "bulk_airtime_ref_123"
    });
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/betting/lookup?bet_id=bet9ja&customer_id=422984"
    );

    vi.unstubAllGlobals();
  });

  it("maps international bills lookup and vend", async () => {
    const fetchMock = mockFetch();

    const payscribe = new Payscribe({ secretKey: "ps_sk_test_123" });
    await payscribe.bills.international.providers({ iso: "GH" });
    await payscribe.bills.international.products({ iso: "GH", code: "MTGH" });
    await payscribe.bills.international.rate({
      iso: "GH",
      sku: "GH_MT_TopUp",
      amount: 1.2
    });
    await payscribe.bills.international.vend({
      iso: "GH",
      providerCode: "MTGH",
      sku: "GH_MT_TopUp",
      amount: "1.5",
      account: "233547011800",
      debitCurrency: "ngn",
      reference: "intl_ref_123"
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/international-bills/providers?iso=GH"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/international-bills/products?iso=GH&code=MTGH"
    );
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      "https://sandbox.payscribe.ng/api/v1/international-bills/rate?iso=GH&sku=GH_MT_TopUp&amount=1.2"
    );
    expect(JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body))).toEqual({
      iso: "GH",
      provider_code: "MTGH",
      sku: "GH_MT_TopUp",
      amount: "1.5",
      account: "233547011800",
      debit_currency: "ngn",
      ref: "intl_ref_123"
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
