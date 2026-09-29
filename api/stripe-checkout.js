"use strict";

const { json, requireUser, selectSubscriptions, upsertSubscription } = require("./_lib/supabase");
const { siteUrl, stripe } = require("./_lib/stripe");

module.exports = async (request, response) => {
  if (request.method !== "POST") return json(response, 405, { error: "method_not_allowed" });
  try {
    const user = await requireUser(request);
    if (!user) return json(response, 401, { error: "unauthenticated" });
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRICE_ID is not configured.");
    const existing = await selectSubscriptions(user.id);
    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe("/customers", { method: "POST", form: { email: user.email || "", "metadata[supabase_user_id]": user.id } });
      customerId = customer.id;
      await upsertSubscription({ user_id: user.id, tier: "free", status: "inactive", stripe_customer_id: customerId });
    }
    const session = await stripe("/checkout/sessions", {
      method: "POST",
      form: {
        mode: "subscription",
        customer: customerId,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        client_reference_id: user.id,
        "metadata[supabase_user_id]": user.id,
        "subscription_data[metadata][supabase_user_id]": user.id,
        success_url: `${siteUrl()}/?checkout=success`,
        cancel_url: `${siteUrl()}/?checkout=cancelled`
      }
    });
    return json(response, 200, { url: session.url });
  } catch (error) {
    console.error("stripe-checkout", error);
    return json(response, 500, { error: "checkout_unavailable" });
  }
};
