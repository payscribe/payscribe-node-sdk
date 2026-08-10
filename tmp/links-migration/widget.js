(function (root, factory) {
  const checkout = factory(root);
  if (typeof module === "object" && module.exports) module.exports = checkout;
  root.PayscribeCheckout = checkout;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  let active = null;
  let listener = null;

  function renderButton(options) {
    if (!options || !options.publicKey) {
      throw new TypeError("PayscribeCheckout.renderButton requires a publicKey.");
    }
    if (!/^pk_(test|live)_/i.test(options.publicKey)) {
      throw new TypeError("Use a Payscribe publishable key (pk_test_… or pk_live_…). Never use a secret key in browser code.");
    }
    const container = resolveContainer(options.container);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = options.label || "Pay with Payscribe";
    button.setAttribute("data-payscribe-button", "");
    button.style.cssText = buttonStyles(options);

    button.addEventListener("click", async function () {
      if (button.disabled) return;
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = options.loadingLabel || "Opening secure checkout…";
      button.style.opacity = ".72";
      try {
        const session = await createSession(options);
        const data = session.data || session.message?.data || session;
        if (!data.token) throw new Error("Payscribe did not return a checkout session token.");
        open({
          ...options,
          publicKey: options.publicKey,
          sessionToken: data.token,
          canvasUrl: options.canvasUrl || data.canvas_url
        });
      } catch (error) {
        if (typeof options.onError === "function") {
          options.onError({ status: "error", message: error.message });
        } else {
          root.console?.error("Payscribe Checkout:", error);
        }
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
        button.style.opacity = "1";
      }
    });

    container.appendChild(button);
    return {
      button,
      open: () => button.click(),
      destroy: () => button.remove()
    };
  }

  async function createSession(options) {
    const apiBaseUrl = options.apiBaseUrl || (/^pk_live_/i.test(options.publicKey)
      ? "https://api.payscribe.ng/api/v1"
      : "https://sandbox.payscribe.ng/api/v1");
    const response = await fetch(`${String(apiBaseUrl).replace(/\/$/, "")}/button/init`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.publicKey}`
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency || "NGN",
        reference: typeof options.reference === "function" ? options.reference() : options.reference,
        name: options.customer?.name,
        email: options.customer?.email,
        phone: options.customer?.phone,
        service: options.service || "pay",
        metadata: options.metadata,
        origin: root.location?.origin,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.status === false) {
      throw new Error(body.description || body.message || `Unable to create checkout (${response.status}).`);
    }
    return body;
  }

  function open(options) {
    if (!options || !options.sessionToken) {
      throw new TypeError("PayscribeCheckout.open requires a sessionToken.");
    }
    if (active) destroy();

    const canvasUrl = options.canvasUrl || "https://links.payscribe.co/canvas";
    const url = new URL(canvasUrl, root.location?.href);
    url.searchParams.set("token", options.sessionToken);
    if (options.publicKey) url.searchParams.set("publicKey", options.publicKey);
    const canvasOrigin = url.origin;

    const overlay = document.createElement("div");
    overlay.setAttribute("data-payscribe-checkout", "");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(11,21,54,.66);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)";

    const shell = document.createElement("div");
    shell.setAttribute("data-payscribe-checkout-shell", "");
    shell.style.cssText = "position:relative;width:min(980px,100%);height:min(680px,calc(100dvh - 40px))";

    const frame = document.createElement("iframe");
    frame.src = url.href;
    frame.title = "Payscribe checkout";
    frame.allow = "payment";
    frame.style.cssText = "width:100%;height:100%;border:0;border-radius:16px;background:#fff;box-shadow:0 24px 72px rgba(11,21,54,.26)";
    shell.appendChild(frame);
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close Payscribe checkout");
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    closeButton.style.cssText = "position:absolute;z-index:2;top:-14px;right:-14px;display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid rgba(33,77,192,.14);border-radius:12px;background:#fff;color:#214dc0;cursor:pointer;box-shadow:0 10px 30px rgba(11,21,54,.2);transition:transform .15s ease,box-shadow .15s ease";
    closeButton.onclick = close;
    closeButton.onmouseenter = () => { closeButton.style.transform = "scale(1.04)"; };
    closeButton.onmouseleave = () => { closeButton.style.transform = "scale(1)"; };
    shell.appendChild(closeButton);
    overlay.appendChild(shell);
    const responsiveStyles = document.createElement("style");
    responsiveStyles.textContent = '@media (max-width:600px){[data-payscribe-checkout]{padding:0!important}[data-payscribe-checkout-shell]{width:100vw!important;height:100dvh!important}[data-payscribe-checkout-shell] iframe{border-radius:0!important}[data-payscribe-checkout-shell] button{top:10px!important;right:10px!important}}';
    overlay.appendChild(responsiveStyles);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    listener = function (event) {
      if (event.origin !== canvasOrigin || event.source !== frame.contentWindow) return;
      const message = event.data;
      if (!message || message.source !== "payscribe-checkout") return;
      const callback = {
        ready: options.onReady,
        success: options.onSuccess,
        error: options.onError,
        close: options.onClose
      }[message.event];
      if (typeof callback === "function") callback(message.data);
      if (message.event === "close") destroy();
    };
    root.addEventListener("message", listener);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay && options.closeOnBackdrop !== false) close();
    });
    overlay.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    active = { overlay, frame, options };
    return { close, destroy };
  }

  function close() {
    const callback = active?.options?.onClose;
    destroy();
    if (typeof callback === "function") callback({ reason: "merchant_close" });
  }

  function destroy() {
    if (listener) root.removeEventListener("message", listener);
    listener = null;
    active?.overlay?.remove();
    active = null;
    if (typeof document !== "undefined") document.documentElement.style.overflow = "";
  }

  function resolveContainer(container) {
    if (container instanceof Element) return container;
    if (typeof container === "string") {
      const element = document.querySelector(container);
      if (element) return element;
      throw new Error(`Payscribe Checkout container not found: ${container}`);
    }
    const script = document.currentScript;
    if (script?.parentElement) return script.parentElement;
    return document.body;
  }

  function buttonStyles(options) {
    const background = options.buttonColor || "#0f766e";
    const color = options.buttonTextColor || "#ffffff";
    return `min-height:48px;padding:0 22px;border:0;border-radius:8px;background:${background};color:${color};font:700 15px/1 system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(15,118,110,.18);transition:opacity .2s,transform .2s`;
  }

  return { renderButton, createSession, open, close, destroy };
});
