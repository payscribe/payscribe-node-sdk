import { createHmac, timingSafeEqual } from "node:crypto";
import type { PayscribeWebhookEvent } from "../types/webhooks.js";

export class WebhooksResource {
  constructor(private readonly secretKey: string) {}

  verifySignature(rawBody: string | Buffer, signature: string): boolean {
    const expected = createHmac("sha256", this.secretKey).update(rawBody).digest("hex");
    return safeCompare(signature, expected);
  }

  constructEvent(input: {
    rawBody: string | Buffer;
    signature: string | string[] | undefined;
  }): PayscribeWebhookEvent {
    const signature = Array.isArray(input.signature) ? input.signature[0] : input.signature;

    if (!signature || !this.verifySignature(input.rawBody, signature)) {
      throw new Error("Invalid Payscribe webhook signature.");
    }

    return JSON.parse(Buffer.isBuffer(input.rawBody) ? input.rawBody.toString("utf8") : input.rawBody);
  }
}

function safeCompare(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
