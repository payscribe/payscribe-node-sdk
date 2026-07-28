from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


OUTPUT = "output/pdf/payscribe-bill-checkout-api-requirements.pdf"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(18 * mm, 12 * mm, "Payscribe Bill Checkout API Requirements")
    canvas.drawRightString(192 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#101828"),
        spaceAfter=8,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="Subtle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#667085"),
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="Heading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#344054"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeBlock",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#101828"),
        backColor=colors.HexColor("#F2F4F7"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=10,
    )
)


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def code(text):
    escaped = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
        .replace(" ", "&nbsp;")
    )
    return Paragraph(escaped, styles["CodeBlock"])


def table(data, widths=None):
    converted = [[Paragraph(str(cell), styles["Body"]) for cell in row] for row in data]
    t = Table(converted, colWidths=widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E6F4F1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#101828")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D5DD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=18 * mm,
    bottomMargin=18 * mm,
)

story = []

story.append(p("Payscribe Bill Checkout API Requirements", "TitleCustom"))
story.append(
    p(
        "Requested backend/API scope for enabling a hosted bills checkout at checkout.payscribe.co.",
        "Subtle",
    )
)

story.append(p("Purpose", "Heading"))
story.append(
    p(
        "The hosted bill checkout should let a merchant create a checkout session from their backend, redirect a customer to checkout.payscribe.co, and allow the customer to complete a bill purchase through a Payscribe-managed checkout UI."
    )
)
story.append(
    p(
        "The checkout page must never receive a Payscribe secret API key. All calls that require merchant authentication, wallet debit, vending, requery, and sensitive status handling should be handled by Payscribe backend APIs or by a merchant backend using the Payscribe SDK."
    )
)

story.append(p("Current Assets Already Available", "Heading"))
story.append(
    table(
        [
            ["Area", "Current capability"],
            [
                "Node.js SDK",
                "Typed wrappers for virtual accounts, virtual cards, and bills payment APIs.",
            ],
            [
                "Bills SDK",
                "Supports airtime, data, electricity, cable TV, betting, internet, epins, international bills, SMS, airtime-to-wallet, and transaction requery.",
            ],
            [
                "Hosted checkout UI",
                "Static HTML checkout page at hosted-checkout/index.html. It can load a session, collect bill details, validate details, confirm payment, and show the result.",
            ],
            [
                "Swagger/consumer tooling",
                "Local Swagger playground and typed consumer test server for SDK endpoint testing.",
            ],
        ],
        [42 * mm, 126 * mm],
    )
)

story.append(p("Required Payscribe APIs", "Heading"))
story.append(
    p(
        "These APIs are the recommended native Payscribe APIs needed to support a complete hosted checkout product."
    )
)
story.append(
    table(
        [
            ["Method", "Path", "Purpose"],
            [
                "POST",
                "/checkout/sessions",
                "Create a checkout session and return a checkout URL.",
            ],
            [
                "GET",
                "/checkout/sessions/:sessionId",
                "Return safe public session data for the hosted checkout page.",
            ],
            [
                "POST",
                "/checkout/sessions/:sessionId/validate",
                "Validate customer-entered bill details before final payment.",
            ],
            [
                "POST",
                "/checkout/sessions/:sessionId/confirm",
                "Execute the selected bill payment and finalize the checkout attempt.",
            ],
            [
                "GET",
                "/checkout/sessions/:sessionId/status",
                "Return final or current checkout status for polling, reconciliation, and merchant support.",
            ],
        ],
        [22 * mm, 72 * mm, 74 * mm],
    )
)

story.append(p("Create Checkout Session", "Heading"))
story.append(p("Endpoint: POST /checkout/sessions"))
story.append(
    p(
        "Called by the merchant backend before redirecting the customer. This endpoint should authenticate with the merchant secret key, create the session, lock the intended amount/rules, and return a hosted checkout URL."
    )
)
story.append(
    code(
        """{
  "reference": "order_123",
  "amount": 5000,
  "currency": "NGN",
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "phone": "08012345678"
  },
  "allowedCategories": ["electricity", "data", "airtime", "cable"],
  "successUrl": "https://merchant.com/success",
  "cancelUrl": "https://merchant.com/cancel",
  "metadata": {
    "orderId": "order_123"
  }
}"""
    )
)
story.append(
    code(
        """{
  "id": "chk_123",
  "checkoutUrl": "https://checkout.payscribe.co/chk_123",
  "status": "open",
  "expiresAt": "2026-07-24T15:30:00.000Z"
}"""
    )
)

story.append(PageBreak())

story.append(p("Load Checkout Session", "Heading"))
story.append(p("Endpoint: GET /checkout/sessions/:sessionId"))
story.append(
    p(
        "Called by the hosted checkout page when opened by the customer. It should only return public-safe data needed to render the checkout. It must not return secret keys, wallet details, internal auth tokens, or sensitive merchant configuration."
    )
)
story.append(
    code(
        """{
  "id": "chk_123",
  "merchantName": "Demo Merchant",
  "amount": 5000,
  "currency": "NGN",
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "phone": "08012345678"
  },
  "allowedCategories": ["electricity", "data", "airtime", "cable"],
  "status": "open",
  "expiresAt": "2026-07-24T15:30:00.000Z"
}"""
    )
)

story.append(p("Validate Bill Details", "Heading"))
story.append(p("Endpoint: POST /checkout/sessions/:sessionId/validate"))
story.append(
    p(
        "Called after the customer enters bill details. It should route validation based on category. Electricity validates meter information, cable validates smartcard information, and data/airtime can validate or normalize recipient and provider details where supported."
    )
)
story.append(
    code(
        """{
  "category": "electricity",
  "provider": "phedc",
  "meterNumber": "45083082250",
  "meterType": "prepaid",
  "amount": 1000
}"""
    )
)
story.append(
    code(
        """{
  "valid": true,
  "customerName": "Ada Lovelace",
  "address": "12 Broad Street, Lagos"
}"""
    )
)

story.append(PageBreak())

story.append(p("Confirm Checkout", "Heading"))
story.append(p("Endpoint: POST /checkout/sessions/:sessionId/confirm"))
story.append(
    p(
        "Called when the customer confirms the payment. It should execute the actual bill payment, update the checkout session status, make the operation idempotent by session/reference, and return the transaction result."
    )
)
story.append(
    code(
        """{
  "category": "electricity",
  "provider": "phedc",
  "meterNumber": "45083082250",
  "meterType": "prepaid",
  "amount": 1000,
  "customerName": "Ada Lovelace",
  "phone": "08012345678"
}"""
    )
)
story.append(
    code(
        """{
  "status": "success",
  "reference": "order_123",
  "transactionId": "txn_123",
  "token": "1234-5678-9012"
}"""
    )
)

story.append(PageBreak())

story.append(p("Get Checkout Status", "Heading"))
story.append(p("Endpoint: GET /checkout/sessions/:sessionId/status"))
story.append(
    p(
        "Used by the checkout page and merchant systems for polling, reconciliation, and support. The response should expose the current state without leaking internal processing details."
    )
)
story.append(
    code(
        """{
  "id": "chk_123",
  "status": "success",
  "reference": "order_123",
  "transactionId": "txn_123",
  "paidAt": "2026-07-24T15:10:00.000Z"
}"""
    )
)

story.append(p("Expected Process Flow", "Heading"))
story.append(
    table(
        [
            ["Step", "Action"],
            ["1", "Merchant backend calls POST /checkout/sessions."],
            ["2", "Payscribe returns checkoutUrl such as https://checkout.payscribe.co/chk_123."],
            ["3", "Merchant redirects the customer to the checkout URL."],
            ["4", "Hosted checkout page calls GET /checkout/sessions/:sessionId."],
            ["5", "Customer selects bill category and enters bill details."],
            ["6", "Hosted checkout page calls POST /validate."],
            ["7", "Customer reviews validated details and confirms."],
            ["8", "Hosted checkout page calls POST /confirm."],
            ["9", "Payscribe executes the bill transaction and updates the checkout status."],
            ["10", "Payscribe redirects to successUrl or cancelUrl and sends merchant webhook events."],
        ],
        [18 * mm, 150 * mm],
    )
)

story.append(p("Required Webhook Events", "Heading"))
story.append(
    table(
        [
            ["Event", "Meaning"],
            ["checkout.session.completed", "Checkout completed successfully."],
            ["checkout.session.failed", "Checkout failed after a confirmation attempt."],
            ["checkout.session.expired", "Checkout expired before completion."],
            ["bill.payment.success", "Underlying bill payment succeeded."],
            ["bill.payment.failed", "Underlying bill payment failed."],
            ["bill.payment.pending", "Underlying bill payment is pending final confirmation."],
        ],
        [62 * mm, 106 * mm],
    )
)

story.append(p("SDK Integration", "Heading"))
story.append(
    p(
        "The Node.js SDK should expose a higher-level checkout resource once the Payscribe APIs exist. This resource should sit above the current lower-level bills APIs."
    )
)
story.append(
    code(
        """const session = await payscribe.checkout.sessions.create({
  reference: "order_123",
  amount: 5000,
  currency: "NGN",
  allowedCategories: ["electricity", "data", "airtime", "cable"],
  successUrl: "https://merchant.com/success",
  cancelUrl: "https://merchant.com/cancel"
});"""
    )
)

story.append(p("Security And Product Requirements", "Heading"))
story.append(
    table(
        [
            ["Requirement", "Details"],
            ["No browser secret keys", "The checkout page must never expose merchant secret keys."],
            ["Idempotency", "Confirm calls should be safe to retry by session ID/reference."],
            ["Expiry", "Checkout sessions should expire and reject late confirmation."],
            ["Status states", "Recommended states: open, validating, confirmed, success, pending, failed, expired, canceled."],
            ["Category controls", "Merchants should restrict allowed bill categories per session."],
            ["Metadata", "Merchant metadata should be stored and returned in webhooks."],
            ["Redirects", "Support successUrl and cancelUrl after completion or cancellation."],
            ["Webhook signing", "All webhook events should be signed for merchant verification."],
        ],
        [48 * mm, 120 * mm],
    )
)

story.append(p("Minimum Request To Payscribe Team", "Heading"))
story.append(
    p(
        "Please provide native hosted checkout session APIs for bills payment with the following endpoints: POST /checkout/sessions, GET /checkout/sessions/:sessionId, POST /checkout/sessions/:sessionId/validate, POST /checkout/sessions/:sessionId/confirm, and GET /checkout/sessions/:sessionId/status."
    )
)
story.append(
    p(
        "These APIs will allow the open-source SDK and static checkout UI to provide a Stripe-like checkout experience while keeping all sensitive credentials and transaction execution server-side."
    )
)

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
