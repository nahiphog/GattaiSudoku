"use strict";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
};

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Supabase is not configured.");
  return { url, serviceRole };
}

function bearerToken(request) {
  const value = request.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function requireUser(request) {
  const token = bearerToken(request);
  if (!token) return null;
  const { url, serviceRole } = config();
  const result = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${token}` }
  });
  return result.ok ? result.json() : null;
}

async function selectSubscriptions(userId) {
  const { url, serviceRole } = config();
  const query = new URLSearchParams({
    select: "tier,status,current_period_end,stripe_customer_id,stripe_subscription_id",
    user_id: `eq.${userId}`,
    order: "updated_at.desc",
    limit: "1"
  });
  const result = await fetch(`${url}/rest/v1/subscriptions?${query}`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` }
  });
  if (!result.ok) throw new Error("Unable to read subscription status.");
  return (await result.json())[0] || null;
}

async function upsertSubscription(subscription) {
  const { url, serviceRole } = config();
  const result = await fetch(`${url}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({ ...subscription, updated_at: new Date().toISOString() })
  });
  if (!result.ok) throw new Error("Unable to update subscription status.");
  return (await result.json())[0];
}

function accessFor(subscription) {
  const currentPeriodEnd = subscription?.current_period_end || null;
  const isCurrent = !currentPeriodEnd || Date.parse(currentPeriodEnd) > Date.now();
  const active = subscription?.tier === "pro" && ["active", "trialing"].includes(subscription?.status) && isCurrent;
  return { tier: active ? "pro" : "free", active, currentPeriodEnd };
}

module.exports = { accessFor, config, json, requireUser, selectSubscriptions, upsertSubscription };
