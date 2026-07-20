import { PayscribeApiError } from "./errors.js";
import type { PayscribeConfig, PayscribeRequestOptions } from "./types/common.js";

const BASE_URLS = {
  sandbox: "https://sandbox.payscribe.ng/api/v1/",
  production: "https://api.payscribe.ng/api/v1/"
} as const;

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class HttpClient {
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(config: PayscribeConfig) {
    if (!config.secretKey) {
      throw new Error("Payscribe secretKey is required.");
    }

    this.secretKey = config.secretKey;
    this.baseUrl = normalizeBaseUrl(
      config.baseUrl ?? BASE_URLS[config.environment ?? "sandbox"]
    );
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: PayscribeRequestOptions = {}
  ): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), {
      method,
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const raw = await response.text();
    const parsed = parseJson(raw);

    if (!response.ok) {
      throw new PayscribeApiError(
        extractErrorMessage(parsed, response.statusText),
        response.status,
        parsed
      );
    }

    return parsed as T;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function parseJson(raw: string): unknown {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function extractErrorMessage(response: unknown, fallback: string): string {
  if (response && typeof response === "object" && "description" in response) {
    const description = (response as { description?: unknown }).description;
    if (typeof description === "string" && description.length > 0) {
      return description;
    }
  }

  return fallback || "Payscribe API request failed.";
}
