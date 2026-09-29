"use strict";

const { accessFor, config, json, requireUser, selectSubscriptions } = require("./_lib/supabase");

async function loadPack(packId) {
  const { url, serviceRole } = config();
  const query = new URLSearchParams({
    select: "position,daily_puzzles!inner(puzzle_date,puzzle,difficulty)",
    pack_id: `eq.${packId}`,
    order: "position.asc"
  });
  const result = await fetch(`${url}/rest/v1/puzzle_pack_items?${query}`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` }
  });
  if (!result.ok) throw new Error("Unable to load puzzle pack.");
  return await result.json();
}

module.exports = async (request, response) => {
  if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
  const packId = Array.isArray(request.query.packId) ? "" : request.query.packId;
  if (typeof packId !== "string" || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(packId)) return json(response, 400, { error: "invalid_pack_id" });
  try {
    const user = await requireUser(request);
    if (!user) return json(response, 401, { error: "unauthenticated" });
    if (!accessFor(await selectSubscriptions(user.id)).active) return json(response, 403, { gated: true, reason: "pro_required" });
    const puzzles = await loadPack(packId);
    if (!puzzles.length) return json(response, 404, { error: "pack_not_found" });
    response.setHeader("Cache-Control", "private, no-store");
    return json(response, 200, { packId, puzzles: puzzles.map(item => ({ position: item.position, ...item.daily_puzzles })) });
  } catch (error) {
    console.error("puzzle-pack", error);
    return json(response, 500, { error: "pack_unavailable" });
  }
};
