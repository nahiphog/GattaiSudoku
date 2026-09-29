"use strict";

const { json, requireUser, selectSubscriptions } = require("./_lib/supabase");
const { siteUrl, stripe } = require("./_lib/stripe");

module.exports = async (request, response) => {
  if (request.method !== "POST") return json(response, 405, { error: "method_not_allowed" });
  try {
    const user = await requireUser(request);
    if (!user) return json(response, 401, { error: "unauthenticated" });
    const subscription = await selectSubscriptions(user.id);
    if (!subscription?.stripe_customer_id) return json(response, 409, { error: "no_billing_customer" });
    const session = await stripe("/billing_portal/sessions", {
      method: "POST",
      form: { customer: subscription.stripe_customer_id, return_url: siteUrl() }
    });
    return json(response, 200, { url: session.url });
  } catch (error) {
    console.error("stripe-portal", error);
    return json(response, 500, { error: "portal_unavailable" });
  }
};
