import test from "node:test";
import assert from "node:assert/strict";
import { getQuickReferenceRule, quickReferenceRules } from "../src/data/rules/quickReference.js";

test("las consultas rápidas tienen identificadores únicos y contenido utilizable", () => {
  const ids = quickReferenceRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(quickReferenceRules.length >= 6);
  quickReferenceRules.forEach((rule) => {
    assert.ok(rule.category);
    assert.ok(rule.title);
    assert.ok(rule.quickAnswer);
    assert.ok(rule.details);
    assert.ok(rule.source);
    assert.ok(Array.isArray(rule.keywords));
    assert.equal(getQuickReferenceRule(rule.id), rule);
  });
});

test("una consulta desconocida no inventa una regla", () => {
  assert.equal(getQuickReferenceRule("regla-inexistente"), null);
});
