"use strict";

function stripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured.");
  return { secretKey };
}

async function stripe(path, { method = "GET", form, body } = {}) {
  const { secretKey } = stripeConfig();
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: form ? new URLSearchParams(form).toString() : body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Stripe request failed.");
  return payload;
}

function siteUrl() {
  const value = process.env.SITE_URL?.replace(/\/$/, "");
  if (!value) throw new Error("SITE_URL is not configured.");
  return value;
}

module.exports = { siteUrl, stripe };
