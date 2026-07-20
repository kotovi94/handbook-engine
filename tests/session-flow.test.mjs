import test from "node:test";
import assert from "node:assert/strict";
import {
  createSessionPreparation,
  getLatestSessionSummary,
  listSessionPreparations,
  upsertSessionPreparation,
} from "../campaigns/sessionFlow.js";

test("crea la preparación con el siguiente número y reutiliza el resumen anterior", () => {
  const campaign = { sessions: [{ number: 3, name: "El puente", notes: { roleplay: "El grupo cruzó el río." } }] };
  const preparation = createSessionPreparation(campaign, {
    previousSummary: getLatestSessionSummary(campaign),
    participantIds: ["a", "b"],
  }, () => "prep-4");
  assert.equal(preparation.id, "prep-4");
  assert.equal(preparation.data.number, 4);
  assert.equal(preparation.data.previousSummary, "El grupo cruzó el río.");
  assert.deepEqual(preparation.data.participantIds, ["a", "b"]);
});

test("actualiza una preparación sin duplicarla", () => {
  const preparation = createSessionPreparation({}, { number: 1 }, () => "prep-1");
  const tools = upsertSessionPreparation([], preparation);
  const updated = upsertSessionPreparation(tools, { ...preparation, status: "ready" });
  assert.equal(updated.length, 1);
  assert.equal(listSessionPreparations(updated)[0].status, "ready");
});
