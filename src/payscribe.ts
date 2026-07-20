import { HttpClient } from "./http.js";
import { VirtualAccountsResource } from "./resources/virtual-accounts.js";
import { WebhooksResource } from "./resources/webhooks.js";
import type { PayscribeConfig } from "./types/common.js";

export class Payscribe {
  readonly virtualAccounts: VirtualAccountsResource;
  readonly webhooks: WebhooksResource;

  constructor(config: PayscribeConfig) {
    const http = new HttpClient(config);
    this.virtualAccounts = new VirtualAccountsResource(http);
    this.webhooks = new WebhooksResource(config.secretKey);
  }
}
