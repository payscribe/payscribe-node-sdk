(function () {
  "use strict";

  const config = Object.assign(
    { apiBaseUrl: "https://api.payscribe.ng/api/v1", pollIntervalMs: 3000 },
    window.PAYSCRIBE_CHECKOUT_CONFIG || {}
  );
  const checkoutUrl = new URL(location.href);
  const publicKey = checkoutUrl.searchParams.get("publicKey");
  const environment = checkoutUrl.searchParams.get("environment");
  if (/^pk_(test|live)_/i.test(publicKey || "")) {
    config.publicKey = publicKey;
    config.apiBaseUrl = /^pk_live_/i.test(publicKey)
      ? "https://api.payscribe.ng/api/v1"
      : "https://sandbox.payscribe.ng/api/v1";
  }
  if (environment === "production") {
    config.apiBaseUrl = "https://api.payscribe.ng/api/v1";
  }
  if (environment === "sandbox") {
    config.apiBaseUrl = "https://sandbox.payscribe.ng/api/v1";
  }
  if (environment === "proxy") {
    config.apiBaseUrl = "/payscribe-api";
  }
  const token = checkoutUrl.searchParams.get("token");
  const terminalStatuses = new Set([
    "success", "failed", "pending_manual_review", "expired", "canceled"
  ]);
  const state = {
    token,
    session: null,
    service: "pay",
    form: {},
    validation: null,
    transfer: null,
    result: null,
    step: "details",
    eventSource: null,
    pollTimer: null,
    completed: false
  };

  const fields = {
    pay: [],
    airtime: [
      ["network", "Network", "text"], ["recipient", "Recipient phone", "tel"]
    ],
    data: [
      ["network", "Network", "text"], ["recipient", "Recipient phone", "tel"],
      ["plan", "Plan ID", "text"]
    ],
    electricity: [
      ["provider", "Provider", "text"], ["meterNumber", "Meter number", "text"],
      ["meterType", "Meter type", "select", ["prepaid", "postpaid"]]
    ],
    cable: [
      ["provider", "Provider", "text"], ["account", "Smart card / IUC number", "text"],
      ["planId", "Bouquet / plan ID", "text"]
    ],
    betting: [
      ["provider", "Provider", "text"], ["account", "Betting account", "text"]
    ]
  };

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("beforeunload", cleanup);

  async function init() {
    if (!token) return fatal("This checkout link is missing a session token.");
    try {
      const payload = await request(`/button/session/${encodeURIComponent(token)}`);
      state.session = unwrap(payload);
      state.service = normalizeService(state.session);
      state.form = Object.assign({}, state.session.metadata || {});
      if (state.session.amount != null) state.form.amount = state.session.amount;
      setText("merchantName", state.session.business?.name || state.session.business_name || state.session.merchantName || "Payscribe merchant");
      setSessionStatus(state.session.status || "pending");
      notifyParent("ready", { token, service: state.service });
      routeLoadedStatus();
    } catch (error) {
      if (error.status === 404 || /session not found|already used/i.test(error.message)) {
        showSessionUnavailable(error.message);
      } else {
        fatal(error.message);
      }
    }
  }

  function routeLoadedStatus() {
    const status = state.session.status || "pending";
    if (terminalStatuses.has(status)) {
      complete(state.session);
    } else if (["awaiting_payment", "payment_received", "fulfilling"].includes(status)) {
      state.step = "payment";
      renderPayment();
      listenForStatus();
    } else {
      renderDetails();
    }
  }

  function renderDetails() {
    state.step = "details";
    updateChrome();
    const serviceFields = fields[state.service];
    if (!serviceFields) return fatal(`Unsupported checkout service: ${state.service}`);
    setMessage(
      state.service === "pay" ? "Review the payment details to continue." : "Confirm the service details before payment.",
      "info"
    );
    const editable = serviceFields.filter(([name]) => !hasValue(state.form[name]));
    const amountField = hasValue(state.session.amount)
      ? ""
      : inputField("amount", "Amount", "number", null, true);
    byId("view").innerHTML = `
      <h2 class="section-title">${escapeHtml(serviceTitle())} details</h2>
      <form id="detailsForm" class="field-grid">
        ${editable.map((field) => inputField(...field, true)).join("")}
        ${amountField}
      </form>
      <div class="actions">
        <button class="btn secondary" id="cancel" type="button">Cancel</button>
        <button class="btn primary" id="continue" type="button">Continue</button>
      </div>`;
    byId("cancel").onclick = cancel;
    byId("continue").onclick = continueToReview;
  }

  function continueToReview() {
    const form = byId("detailsForm");
    if (!form.reportValidity()) return;
    Object.assign(state.form, Object.fromEntries(new FormData(form).entries()));
    if (state.form.amount != null) state.form.amount = Number(state.form.amount);
    state.step = "review";
    renderReview();
  }

  function renderReview() {
    updateChrome();
    setMessage("Review these details, then generate your transfer account.", "info");
    const rows = Object.entries(state.form)
      .filter(([, value]) => hasValue(value))
      .map(([key, value]) => row(labelFor(key), key === "amount" ? money(value) : value))
      .join("");
    const customerRows = [
      (state.validation?.customerName || state.session.name) && row("Customer", state.validation?.customerName || state.session.name),
      state.validation?.address && row("Address", state.validation.address)
    ].filter(Boolean).join("");
    byId("view").innerHTML = `
      <h2 class="section-title">Review payment</h2>
      <div class="review-box">${rows}${customerRows}</div>
      <div class="actions">
        <button class="btn secondary" id="back" type="button">Back</button>
        <button class="btn primary" id="pay" type="button">Pay ${escapeHtml(money(amount()))}</button>
      </div>`;
    byId("back").onclick = renderDetails;
    byId("pay").onclick = initializeTransfer;
  }

  async function initializeTransfer() {
    setBusy("pay", true, "Creating account…");
    const customer = state.session.customer || {
      name: state.session.name,
      email: state.session.email,
      phone: state.session.phone
    };
    try {
      const payload = await request("/button/transfer/init", {
        method: "POST",
        body: JSON.stringify({
          token,
          name: customer.name || state.validation?.customerName,
          email: customer.email,
          amount: amount()
        })
      });
      state.transfer = normalizeTransfer(payload);
      if (!state.transfer.accountNumber) {
        throw new Error("The transfer account response did not include an account number.");
      }
      state.step = "payment";
      renderPayment();
      listenForStatus();
    } catch (error) {
      setMessage(error.message, "error");
      setBusy("pay", false, `Pay ${money(amount())}`);
    }
  }

  function renderPayment() {
    updateChrome();
    const transfer = state.transfer || normalizeTransfer(state.session.transfer || {});
    setMessage("Transfer the exact amount to the account below. We will confirm it automatically.", "info");
    byId("view").innerHTML = `
      <h2 class="section-title">Pay by bank transfer</h2>
      <div class="transfer-account">
        <span>Transfer exactly <strong>${escapeHtml(formatTransferMoney(transfer))}</strong> to</span>
        <span class="account-number" id="transferAccountNumber">${escapeHtml(transfer.accountNumber || "Loading…")}</span>
        <button class="btn secondary copy-account" id="copyAccount" type="button">Copy account number</button>
        <div class="review-box">
          ${row("Bank", transfer.bankName || "—")}
          ${row("Account name", transfer.accountName || "—")}
          ${row("Amount", formatTransferMoney(transfer))}
          ${row("Currency", transfer.currency || state.session.currency || "NGN")}
        </div>
        <small>${transfer.expiresAt ? `Account expires ${escapeHtml(formatDate(transfer.expiresAt))}` : "Keep this page open while we confirm your payment."}</small>
      </div>
      <div class="progress-card" id="paymentProgress" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <div><strong id="paymentProgressTitle">Waiting for payment</strong><span id="paymentProgressCopy">We are securely monitoring this account. Keep this page open.</span></div>
      </div>
      <div class="actions">
        <button class="btn secondary" id="cancel" type="button">Cancel</button>
        <button class="btn primary" id="check" type="button">Check status</button>
      </div>`;
    byId("cancel").onclick = cancel;
    byId("check").onclick = pollStatus;
    byId("copyAccount").onclick = copyAccountNumber;
  }

  function listenForStatus() {
    cleanupConnections();
    if (!("EventSource" in window)) return startPolling();
    const url = `${stripSlash(config.apiBaseUrl)}/button/transfer/status/${encodeURIComponent(token)}`;
    state.eventSource = new EventSource(url);
    state.eventSource.onmessage = (event) => {
      try { handleStatus(JSON.parse(event.data)); } catch (_) { /* ignore heartbeats */ }
    };
    state.eventSource.onerror = () => {
      if (!state.completed) {
        state.eventSource?.close();
        state.eventSource = null;
        startPolling();
      }
    };
  }

  function startPolling() {
    if (state.pollTimer || state.completed) return;
    pollStatus();
    state.pollTimer = window.setInterval(pollStatus, config.pollIntervalMs);
  }

  async function pollStatus() {
    try {
      const payload = await request(`/button/session/${encodeURIComponent(token)}/status`);
      handleStatus(unwrap(payload));
    } catch (error) {
      setMessage(`Still checking: ${error.message}`, "info");
    }
  }

  function handleStatus(payload) {
    const result = unwrap(payload);
    const status = inferStatus(result);
    result.status = status;
    state.result = result;
    setSessionStatus(status);
    updatePaymentProgress(status);
    if (status === "failed") setMessage(result.message || statusMessage(status), "error");
    else if (status === "payment_received" || status === "fulfilling") {
      setMessage("Payment confirmed. We are completing your order.", "success");
    } else {
      setMessage(statusMessage(status), "info");
    }
    if (terminalStatuses.has(status)) complete(result);
  }

  function complete(result) {
    if (state.completed) return;
    state.completed = true;
    state.result = result;
    state.step = "result";
    cleanupConnections();
    updateChrome();
    const success = result.status === "success";
    const manual = result.status === "pending_manual_review";
    setMessage(
      success ? "Payment and fulfillment completed successfully." : manual ? "Payment received. Your order needs manual review." : result.message || statusMessage(result.status),
      success || manual ? "success" : "error"
    );
    byId("view").innerHTML = `
      <div class="result-hero ${success ? "success" : manual ? "received" : "error"}">
        <div class="status-mark"><span>${success || manual ? "✓" : "!"}</span></div>
        <h2 class="section-title">${success ? "Payment confirmed" : manual ? "Payment received" : "Payment not completed"}</h2>
        <p>${success ? "Your payment and order have been completed successfully." : manual ? "Your payment is safe and the order is being reviewed." : escapeHtml(result.message || "We could not complete this payment.")}</p>
      </div>
      <div class="review-box">
        ${row("Status", humanStatus(result.status))}
        ${row("Reference", result.reference || state.session.reference || "—")}
        ${row("Transaction ID", result.transactionId || result.transId || "—")}
        ${result.token ? row("Electricity token", result.token) : ""}
      </div>
      <div class="actions">
        <button class="btn secondary" id="close" type="button">Close</button>
        ${success && state.session.successUrl ? '<button class="btn primary" id="done" type="button">Continue</button>' : ""}
      </div>`;
    byId("close").onclick = closeCheckout;
    if (byId("done")) byId("done").onclick = () => safeRedirect(state.session.successUrl);
    notifyParent(success ? "success" : "error", result);
  }

  function cancel() {
    notifyParent("close", { token, status: "canceled" });
    if (state.session?.cancelUrl) safeRedirect(state.session.cancelUrl);
    else closeCheckout();
  }

  function closeCheckout() {
    notifyParent("close", { token, status: state.result?.status || "canceled" });
  }

  function notifyParent(event, data) {
    if (window.parent === window) return;
    const origin = parentOrigin();
    if (!origin) return;
    window.parent.postMessage({ source: "payscribe-checkout", event, data }, origin);
  }

  function parentOrigin() {
    const configured = state.session?.origin || state.session?.allowedOrigin;
    if (configured) {
      try { return new URL(configured).origin; } catch (_) { return null; }
    }
    if (!document.referrer) return null;
    try { return new URL(document.referrer).origin; } catch (_) { return null; }
  }

  function safeRedirect(url) {
    try {
      const target = new URL(url, location.href);
      if (!["http:", "https:"].includes(target.protocol)) throw new Error();
      location.assign(target.href);
    } catch (_) { setMessage("The merchant redirect URL is invalid.", "error"); }
  }

  async function request(path, options = {}) {
    const response = await fetch(`${stripSlash(config.apiBaseUrl)}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(config.publicKey ? { Authorization: `Bearer ${config.publicKey}` } : {}),
        ...(options.headers || {})
      }
    });
    const rawBody = await response.text();
    let body = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        throw new Error("Payscribe returned an unreadable response. Please retry the payment.");
      }
    }
    if (!response.ok || body.status === false) {
      const error = new Error(body.message || body.description || body.error || `Request failed (${response.status})`);
      error.status = response.status || body.status_code;
      error.payload = body;
      throw error;
    }
    return body;
  }

  function unwrap(value) { return value?.data ?? value?.message?.data ?? value; }
  function normalizeTransfer(value) {
    const transfer = unwrap(value) || {};
    return {
      accountNumber: transfer.account_number ?? transfer.accountNumber ?? "",
      accountName: transfer.account_name ?? transfer.accountName ?? "",
      bankName: transfer.bank_name ?? transfer.bankName ?? "",
      currency: transfer.currency ?? state.session?.currency ?? "NGN",
      amount: Number(transfer.amount ?? amount()),
      expiresAt: transfer.expires_at ?? transfer.expiresAt ?? ""
    };
  }
  function inferStatus(result) {
    const rawStatus = typeof result.status === "string" ? result.status.toLowerCase() : "";
    const message = String(result.message || result.description || "").toLowerCase();
    const fulfillment = String(result.fulfillmentStatus || result.fulfillment_status || "").toLowerCase();
    const payment = String(result.paymentStatus || result.payment_status || "").toLowerCase();
    if (rawStatus === "success" || fulfillment === "success") return "success";
    if (["failed", "expired", "canceled", "pending_manual_review"].includes(rawStatus)) return rawStatus;
    if (rawStatus === "fail" && !message.includes("progress") && !message.includes("received")) return "failed";
    if (rawStatus === "fulfilling" || message.includes("transaction in progress") || fulfillment === "not_started" && payment === "received") return "fulfilling";
    if (rawStatus === "payment_received" || payment === "received" || message.includes("payment confirmed")) return "payment_received";
    return rawStatus || "pending";
  }
  function updatePaymentProgress(status) {
    const card = byId("paymentProgress");
    if (!card) return;
    const confirmed = status === "payment_received" || status === "fulfilling";
    const failed = status === "failed";
    card.className = `progress-card${confirmed ? " confirmed" : failed ? " failed" : ""}`;
    card.innerHTML = confirmed
      ? '<div class="status-mark" aria-hidden="true"><span>✓</span></div><div><strong>Payment confirmed</strong><span>Your transfer was received. We are completing your order now.</span></div>'
      : failed
        ? '<div class="status-mark" aria-hidden="true"><span>!</span></div><div><strong>Unable to complete payment</strong><span>Please review the message above or contact support.</span></div>'
        : '<div class="spinner" aria-hidden="true"></div><div><strong>Checking for your payment</strong><span>This updates automatically. You do not need to refresh the page.</span></div>';
  }
  function formatTransferMoney(transfer) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: transfer.currency || state.session?.currency || "NGN"
    }).format(Number(transfer.amount || amount()));
  }
  async function copyAccountNumber() {
    const accountNumber = state.transfer?.accountNumber;
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setBusy("copyAccount", false, "Copied");
      window.setTimeout(() => setBusy("copyAccount", false, "Copy account number"), 1600);
    } catch (_) {
      setMessage(`Account number: ${accountNumber}`, "info");
    }
  }
  function normalizeService(session) {
    return session.service === "bills" ? session.metadata?.category || "pay" : session.service || "pay";
  }
  function amount() { return Number(state.form.amount ?? state.session?.amount ?? 0); }
  function money(value) {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: state.session?.currency || "NGN" }).format(Number(value || 0));
  }
  function serviceTitle() { return state.service === "pay" ? "Payment" : state.service.replace(/\b\w/g, (c) => c.toUpperCase()); }
  function inputField(name, label, type, options, required) {
    const value = state.form[name] ?? "";
    const control = type === "select"
      ? `<select id="${name}" name="${name}" ${required ? "required" : ""}><option value="">Select ${escapeHtml(label.toLowerCase())}</option>${options.map((item) => `<option value="${escapeHtml(item)}" ${value === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>`
      : `<input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${type === "number" ? 'min="1" step="0.01"' : ""} ${required ? "required" : ""} />`;
    return `<div class="field"><label for="${name}">${escapeHtml(label)}</label>${control}</div>`;
  }
  function labelFor(key) { return ({ meterNumber: "Meter number", meterType: "Meter type", planId: "Plan ID" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()); }
  function row(label, value) { return `<div class="line-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
  function hasValue(value) { return value !== undefined && value !== null && value !== ""; }
  function stripSlash(value) { return String(value).replace(/\/$/, ""); }
  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { const element = byId(id); if (element) element.textContent = value; }
  function setSessionStatus(status) {
    const element = byId("sessionStatus");
    if (!element) return;
    const normalized = String(status || "pending").toLowerCase();
    element.textContent = humanStatus(normalized);
    const received = ["payment_received", "fulfilling", "pending_manual_review", "success"].includes(normalized);
    element.className = `session-status ${received ? "received" : normalized}`;
  }
  function setMessage(message, type) { const element = byId("message"); element.textContent = message; element.className = `notice ${type}`; }
  function setBusy(id, busy, label) { const button = byId(id); if (button) { button.disabled = busy; button.textContent = label; } }
  function formatDate(value) { return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  function humanStatus(value) { return String(value || "pending").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()); }
  function statusMessage(status) {
    return ({ pending: "Waiting for payment…", validating: "Validating service details…", validated: "Details validated.", awaiting_payment: "Waiting for your bank transfer…", payment_received: "Payment received, completing your order…", fulfilling: "Payment received, completing your order…", success: "Payment completed successfully.", failed: "Payment or fulfillment failed.", pending_manual_review: "Payment received; your order needs manual review.", expired: "This checkout session has expired.", canceled: "This checkout was canceled." })[status] || "Checking payment status…";
  }
  function updateChrome() {
    document.querySelectorAll("[data-step-label]").forEach((element) => element.classList.toggle("active", element.dataset.stepLabel === state.step));
    setText("summarySession", state.token ? `${state.token.slice(0, 12)}…` : "—");
    setText("summaryCategory", serviceTitle());
    const provider = state.form.provider || state.form.network;
    const recipient = state.form.meterNumber || state.form.account || state.form.recipient;
    setText("summaryProvider", provider || "Not provided");
    setText("summaryRecipient", recipient || "Not provided");
    byId("summaryProviderRow")?.classList.toggle("hidden", !provider);
    byId("summaryRecipientRow")?.classList.toggle("hidden", !recipient);
    setText("summaryReference", state.session?.reference || "Not available");
    setText("amountValue", money(amount()));
  }
  function fatal(message) { state.step = "result"; updateChrome(); setMessage(message, "error"); byId("view").innerHTML = '<h2 class="section-title">Unable to open checkout</h2><p>Please return to the merchant and try again.</p>'; notifyParent("error", { token, message }); }
  function showSessionUnavailable(message) {
    cleanupConnections();
    notifyParent("error", { token, status: "not_found", message });
    const overlay = document.createElement("div");
    overlay.className = "notification-overlay";
    overlay.innerHTML = `
      <section class="notification-modal" role="alertdialog" aria-modal="true" aria-labelledby="sessionUnavailableTitle" aria-describedby="sessionUnavailableMessage">
        <div class="status-mark" aria-hidden="true"><span>!</span></div>
        <h2 id="sessionUnavailableTitle">Session unavailable</h2>
        <p id="sessionUnavailableMessage">${escapeHtml(message || "Session not found or already used.")}</p>
        <button class="btn primary" id="closeUnavailableSession" type="button">Return to merchant</button>
      </section>`;
    document.body.appendChild(overlay);
    const closeButton = byId("closeUnavailableSession");
    closeButton.onclick = () => {
      notifyParent("close", { token, status: "not_found" });
      if (window.parent === window && history.length > 1) history.back();
    };
    closeButton.focus();
  }
  function cleanupConnections() { if (state.eventSource) state.eventSource.close(); state.eventSource = null; if (state.pollTimer) clearInterval(state.pollTimer); state.pollTimer = null; }
  function cleanup() { cleanupConnections(); }
})();
