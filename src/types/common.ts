export type PayscribeEnvironment = "sandbox" | "production";

export type PayscribeConfig = {
  secretKey: string;
  environment?: PayscribeEnvironment;
  baseUrl?: string;
};

export type PayscribeRequestOptions = {
  signal?: AbortSignal;
};

export type PayscribeResponse<T> = {
  status: boolean;
  description?: string;
  message?: T;
  data?: T;
  status_code: number;
};
