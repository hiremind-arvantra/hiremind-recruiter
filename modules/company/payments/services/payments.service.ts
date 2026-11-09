import { API, getAccessToken } from "@/lib/api/config";

export interface SubscribeResponse {
  subscriptionId: string;
  razorpayKeyId: string;
  planName: string;
  period: string;
  amountPaise: number;
  currency: string;
}

export interface SubscriptionResponse {
  planKey: string;
  planName: string;
  period: string;
  status: string;
  active: boolean;
  currentEnd: string | null;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? `Request failed (${res.status})`);
  return json.data as T;
}

/** POST /company/payments/subscribe — create a Razorpay subscription for checkout. */
export async function createSubscription(planKey: string, period: "monthly" | "yearly"): Promise<SubscribeResponse> {
  const res = await fetch(`${API.COMPANY}/company/payments/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ planKey, period }),
  });
  return unwrap<SubscribeResponse>(res);
}

/** POST /company/payments/verify — confirm a checkout success (signature-verified server-side). */
export async function verifyPayment(success: RazorpaySuccess): Promise<SubscriptionResponse> {
  const res = await fetch(`${API.COMPANY}/company/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({
      razorpayPaymentId: success.razorpay_payment_id,
      razorpaySubscriptionId: success.razorpay_subscription_id,
      razorpaySignature: success.razorpay_signature,
    }),
  });
  return unwrap<SubscriptionResponse>(res);
}

/** GET /company/payments/subscription — current subscription, or null if none. */
export async function getSubscription(): Promise<SubscriptionResponse | null> {
  const res = await fetch(`${API.COMPANY}/company/payments/subscription`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  return (json?.data ?? null) as SubscriptionResponse | null;
}

/** Inject Razorpay Checkout script once; resolves true when window.Razorpay is available. */
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
