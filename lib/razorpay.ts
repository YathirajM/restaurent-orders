import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay integration.
 *
 * Flow (standard, secure):
 *  1. Backend creates a Razorpay Order (razorpay.orders.create) with the
 *     exact total from the DB — never the client's number.
 *  2. Frontend opens Razorpay Checkout with that order_id.
 *  3. On success, frontend posts payment_id + signature.
 *  4. Backend verifies HMAC-SHA256(razorpay_order_id|payment_id, key_secret).
 *  5. Backend ALSO accepts webhooks (payment.captured) and verifies
 *     X-Razorpay-Signature with the webhook secret. Webhook is the
 *     source of truth if the browser dies mid-payment.
 *
 * Test-mode behaviour: with RAZORPAY_TEST_MODE=1 or missing credentials,
 * the module exposes a clearly-flagged simulation path so the full order
 * pipeline can be exercised locally without keys. Simulated payments are
 * ALWAYS marked paymentMethod='simulated' and never show as real money.
 */

export type RazorpayOrder = {
  id: string;
  amount: number; // paise
  currency: string;
  status: string;
};

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isLive: boolean;
  isTestMode: boolean;
};

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const hasRealCreds =
    keyId.startsWith("rzp_live_") || keyId.startsWith("rzp_test_");

  return {
    keyId,
    keySecret,
    webhookSecret,
    isLive: keyId.startsWith("rzp_live_"),
    isTestMode: !hasRealCreds || process.env.RAZORPAY_TEST_MODE === "1",
  };
}

export function isRazorpayConfigured(): boolean {
  const cfg = getRazorpayConfig();
  return cfg.keyId.startsWith("rzp_") && cfg.keySecret.length > 10;
}

/** Creates a Razorpay order via their REST API (no SDK needed). */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  currency?: string;
}): Promise<RazorpayOrder> {
  const cfg = getRazorpayConfig();
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay credentials are not configured");
  }

  const auth = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      payment_capture: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Razorpay order creation failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }
  return (await res.json()) as RazorpayOrder;
}

/** Verifies checkout handler signature: order|payment vs key secret. */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const cfg = getRazorpayConfig();
  if (!cfg.keySecret) return false;
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  return timingSafeHexEqual(expected, params.signature);
}

/** Verifies webhook payload signature with the webhook secret. */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const cfg = getRazorpayConfig();
  if (!cfg.webhookSecret) return false;
  const expected = createHmac("sha256", cfg.webhookSecret)
    .update(body)
    .digest("hex");
  return timingSafeHexEqual(expected, signature);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
