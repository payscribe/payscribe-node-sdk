export class PayscribeApiError extends Error {
  readonly statusCode: number;
  readonly response: unknown;

  constructor(message: string, statusCode: number, response: unknown) {
    super(message);
    this.name = "PayscribeApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
}
