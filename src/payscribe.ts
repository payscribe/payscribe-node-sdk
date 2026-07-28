import { HttpClient } from "./http.js";
import { BillsResource } from "./resources/bills.js";
import { VirtualAccountsResource } from "./resources/virtual-accounts.js";
import { VirtualCardsResource } from "./resources/virtual-cards.js";
import { WebhooksResource } from "./resources/webhooks.js";
import type { PayscribeConfig } from "./types/common.js";

export class Payscribe {
  readonly bills: BillsResource;
  readonly virtualAccounts: VirtualAccountsResource;
  readonly virtualCards: VirtualCardsResource;
  readonly webhooks: WebhooksResource;

  constructor(config: PayscribeConfig) {
    const http = new HttpClient(config);
    this.bills = new BillsResource(http);
    this.virtualAccounts = new VirtualAccountsResource(http);
    this.virtualCards = new VirtualCardsResource(http);
    this.webhooks = new WebhooksResource(config.secretKey);
  }
}
