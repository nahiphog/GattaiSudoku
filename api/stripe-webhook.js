"use strict";

const crypto = require("crypto");
const { json, upsertSubscription } = require("./_lib/supabase");
const { stripe } = require("./_lib/stripe");

const readBody = request => new Promise((resolve, reject) => {
  const chunks = [];
  request.on("data", chunk => chunks.push(chunk));
  request.on("end", () => resolve(Buffer.concat(chunks)));
  request.on("error", reject);
});
function verifiedEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return null;
  const fields = Object.fromEntries(signature.split(",").map(part => part.split("=")).filter(([key, value]) => key && value));
  if (!fields.t || !fields.v1 || Math.abs(Date.now() / 1000 - Number(fields.t)) > 300) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${fields.t}.${rawBody.toString("utf8")}`).digest("hex");
  const actual = Buffer.from(fields.v1, "hex"), expectedBuffer = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) return null;
  return JSON.parse(rawBody.toString("utf8"));
}
async function subscriptionFor(object) {
  if (object.object === "subscription") return object;
  if (!object.subscription) return null;
  return stripe(`/subscriptions/${object.subscription}`);
}
async function persistSubscription(subscription, fallbackUserId = "") {
  const userId = subscription.metadata?.supabase_user_id || fallbackUserId;
  if (!userId) throw new Error("Stripe event has no Supabase user mapping.");
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const active = ["active", "trialing"].includes(subscription.status);
  return upsertSubscription({
    user_id: userId,
    tier: active ? "pro" : "free",
    status: subscription.status || "inactive",
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    current_period_end: currentPeriodEnd
  });
}

module.exports = async (request, response) => {
  if (request.method !== "POST") return json(response, 405, { error: "method_not_allowed" });
  try {
    const event = verifiedEvent(await readBody(request), request.headers["stripe-signature"]);
    if (!event) return json(response, 400, { error: "invalid_signature" });
    const object = event.data.object;
    if (["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_succeeded", "invoice.payment_failed"].includes(event.type)) {
      const subscription = await subscriptionFor(object);
      if (subscription) await persistSubscription(subscription, object.client_reference_id || object.metadata?.supabase_user_id);
    }
    return json(response, 200, { received: true });
  } catch (error) {
    console.error("stripe-webhook", error);
    return json(response, 500, { error: "webhook_processing_failed" });
  }
};
module.exports.config = { api: { bodyParser: false } };
