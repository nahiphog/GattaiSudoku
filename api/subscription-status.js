"use strict";

const { accessFor, json, requireUser, selectSubscriptions } = require("./_lib/supabase");

module.exports = async (request, response) => {
  if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
  try {
    const user = await requireUser(request);
    if (!user) return json(response, 401, { error: "unauthenticated" });
    return json(response, 200, accessFor(await selectSubscriptions(user.id)));
  } catch (error) {
    console.error("subscription-status", error);
    return json(response, 500, { error: "subscription_status_unavailable" });
  }
};
