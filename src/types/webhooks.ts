export type PayscribeWebhookEvent = {
  event_id?: string;
  event_type?: string;
  event?: string;
  trans_id?: string;
  amount?: number;
  fee?: number;
  currency?: string;
  transaction?: {
    session_id?: string;
    date?: string;
    amount?: number;
    currency?: string;
    narration?: string;
    bank_name?: string;
    bank_code?: string;
    sender_account?: string;
    sender_name?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    number?: string;
    bank?: string;
    account_id?: string;
    account_type?: string;
  };
  created_at?: string;
  transaction_hash?: string;
  [key: string]: unknown;
};
