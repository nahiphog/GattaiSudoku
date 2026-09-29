"use strict";

const { accessFor, config, json, requireUser, selectSubscriptions } = require("./_lib/supabase");
const { deriveSteps } = require("../lib/gattai-solver");

function dateFromRequest(request) {
  const value = request.body?.puzzleDate;
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function publishedPuzzle(puzzleDate) {
  const { url, serviceRole } = config();
  const query = new URLSearchParams({ select: "puzzle,difficulty", puzzle_date: `eq.${puzzleDate}`, limit: "1" });
  const result = await fetch(`${url}/rest/v1/daily_puzzles?${query}`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` }
  });
  if (!result.ok) throw new Error("Unable to load puzzle.");
  return (await result.json())[0] || null;
}

module.exports = async (request, response) => {
  if (request.method !== "POST") return json(response, 405, { error: "method_not_allowed" });
  const puzzleDate = dateFromRequest(request);
  if (!puzzleDate) return json(response, 400, { error: "invalid_puzzle_date" });
  try {
    const user = await requireUser(request);
    if (!user) return json(response, 401, { error: "unauthenticated" });
    if (!accessFor(await selectSubscriptions(user.id)).active) return json(response, 403, { gated: true, reason: "pro_required" });
    const record = await publishedPuzzle(puzzleDate);
    if (!record) return json(response, 404, { error: "puzzle_not_found" });
    const walkthrough = deriveSteps(record.puzzle);
    return json(response, 200, { puzzleDate, difficulty: record.difficulty, ...walkthrough });
  } catch (error) {
    console.error("derive-steps", error);
    return json(response, 500, { error: "walkthrough_unavailable" });
  }
};
