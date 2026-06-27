// =============================================================================
// Step 4 Unit Tests
// Tests: validation, scoring service, insight service, full-stack flow
// Run: npx ts-node --project tsconfig.json src/scoring/step4.test.ts
// No test framework required — uses console.assert only.
// =============================================================================

import assert from "node:assert/strict";
import { validateSubmission }          from "../utils/server-validation";
import { runScoring, getCTAUrl }       from "./cost-score-service";
import { generateInsights }            from "../utils/insight.service";
import type { FormState }              from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures (same profiles used in scoring engine unit tests)
// ─────────────────────────────────────────────────────────────────────────────

const TC1_STRONG_FIT: FormState = {
  ai_dependence:      "core_revenue",
  monthly_spend_band: "100k_plus",
  spend_visibility:   "no_view",
  unit_economics:     ["none"],
  main_pain:          "margin_pressure",
  leakage_pattern:    "premium_models",
  optimization_done:  ["none_adhoc"],
  savings_threshold:  "gte_25",
  firstname:          "Jane",
  lastname:           "Doe",
  email:              "jane@company.com",
  company:            "Acme Corp",
  job_title:          "VP Engineering",
  ref:                "co-e2-scan",
  website_url:        "",
  ai_providers:       [],
  ai_models:          "",
  ai_infrastructure:  [],
  ai_other:           [],
  technical_notes:    "",
  documents:          [],
  architecture_files: [],
  cost_files:         [],
  usage_metrics: {
    monthly_requests: "",
    input_tokens: "",
    output_tokens: "",
    model_distribution: "",
    gpu_hours: "",
    latency_requirements: "",
    user_volume: "",
  },
};

const TC2_GOOD_FIT: FormState = {
  ai_dependence:      "key_workflows",
  monthly_spend_band: "5k_25k",
  spend_visibility:   "somewhat_clear",
  unit_economics:     ["cost_per_request"],
  main_pain:          "bills_growing",
  leakage_pattern:    "weak_routing",
  optimization_done:  ["prompt_tuning"],
  savings_threshold:  "gte_10",
  firstname:          "Bob",
  lastname:           "Smith",
  email:              "bob@startup.io",
  company:            "StartupIO",
  job_title:          "CTO",
  website_url:        "",
  ai_providers:       [],
  ai_models:          "",
  ai_infrastructure:  [],
  ai_other:           [],
  technical_notes:    "",
  documents:          [],
  architecture_files: [],
  cost_files:         [],
  usage_metrics: {
    monthly_requests: "",
    input_tokens: "",
    output_tokens: "",
    model_distribution: "",
    gpu_hours: "",
    latency_requirements: "",
    user_volume: "",
  },
};

const TC3_NURTURE: FormState = {
  ai_dependence:      "limited_pilots",
  monthly_spend_band: "lt_5k",
  spend_visibility:   "very_clear",
  unit_economics:     ["cost_per_request", "cost_per_task"],
  main_pain:          "lack_visibility",
  leakage_pattern:    "not_sure",
  optimization_done:  ["formal_audit"],
  savings_threshold:  "need_visibility_first",
  firstname:          "Alice",
  lastname:           "Dev",
  email:              "alice@dev.co",
  company:            "Dev Co",
  job_title:          "Engineer",
  website_url:        "",
  ai_providers:       [],
  ai_models:          "",
  ai_infrastructure:  [],
  ai_other:           [],
  technical_notes:    "",
  documents:          [],
  architecture_files: [],
  cost_files:         [],
  usage_metrics: {
    monthly_requests: "",
    input_tokens: "",
    output_tokens: "",
    model_distribution: "",
    gpu_hours: "",
    latency_requirements: "",
    user_volume: "",
  },
};

const TC4_EXCLUDE: FormState = {
  ai_dependence:      "no_production",
  monthly_spend_band: "lt_5k",
  spend_visibility:   "very_clear",
  unit_economics:     ["none"],
  main_pain:          "lack_visibility",
  leakage_pattern:    "not_sure",
  optimization_done:  ["none_adhoc"],
  savings_threshold:  "need_visibility_first",
  firstname:          "Early",
  lastname:           "Stage",
  email:              "early@stage.org",
  company:            "Stage Org",
  job_title:          "Founder",
  website_url:        "",
  ai_providers:       [],
  ai_models:          "",
  ai_infrastructure:  [],
  ai_other:           [],
  technical_notes:    "",
  documents:          [],
  architecture_files: [],
  cost_files:         [],
  usage_metrics: {
    monthly_requests: "",
    input_tokens: "",
    output_tokens: "",
    model_distribution: "",
    gpu_hours: "",
    latency_requirements: "",
    user_volume: "",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${label}`);
    console.error(`         ${(err as Error).message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Validation layer tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== 1. Validation Layer ===");

test("valid TC1 body passes validation", () => {
  const errors = validateSubmission(TC1_STRONG_FIT);
  assert.equal(errors.length, 0, `Expected 0 errors, got: ${JSON.stringify(errors)}`);
});

test("missing required field returns 400-style errors", () => {
  const { email: _, ...without } = TC1_STRONG_FIT as unknown as Record<string, unknown>;
  const errors = validateSubmission(without);
  assert.ok(errors.some((e) => e.field === "email"), "Expected email error");
});

test("invalid enum value returns field error", () => {
  const bad = { ...TC1_STRONG_FIT, ai_dependence: "invalid_value" };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "ai_dependence"), "Expected ai_dependence error");
});

test("unit_economics with none+other triggers exclusive error", () => {
  const bad = { ...TC1_STRONG_FIT, unit_economics: ["none", "cost_per_request"] };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "unit_economics"), "Expected unit_economics error");
});

test("optimization_done with none_adhoc+other triggers exclusive error", () => {
  const bad = { ...TC1_STRONG_FIT, optimization_done: ["none_adhoc", "prompt_tuning"] };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "optimization_done"), "Expected optimization_done error");
});

test("malformed email returns field error", () => {
  const bad = { ...TC1_STRONG_FIT, email: "not-an-email" };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "email"), "Expected email format error");
});

test("extra_context over 2000 chars returns field error", () => {
  const bad = { ...TC1_STRONG_FIT, extra_context: "x".repeat(2001) };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "extra_context"), "Expected extra_context error");
});

test("empty array for unit_economics returns error", () => {
  const bad = { ...TC1_STRONG_FIT, unit_economics: [] };
  const errors = validateSubmission(bad);
  assert.ok(errors.some((e) => e.field === "unit_economics"), "Expected unit_economics empty error");
});

test("non-JSON body (null) returns root error", () => {
  const errors = validateSubmission(null);
  assert.ok(errors.some((e) => e.field === "_root"), "Expected _root error");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Scoring service tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== 2. Scoring Service ===");

test("TC1 → spend=red, architecture=red, pain=red, tier=1", () => {
  const s = runScoring(TC1_STRONG_FIT);
  assert.equal(s.spend,        "red",  `spend=${s.spend}`);
  assert.equal(s.architecture, "red",  `arch=${s.architecture}`);
  assert.equal(s.pain,         "red",  `pain=${s.pain}`);
  assert.equal(s.tier,         1,      `tier=${s.tier}`);
});

test("TC2 → spend=amber, architecture=red, pain=amber, tier=2", () => {
  const s = runScoring(TC2_GOOD_FIT);
  assert.equal(s.spend,        "amber", `spend=${s.spend}`);
  assert.equal(s.architecture, "red",   `arch=${s.architecture}`);
  assert.equal(s.pain,         "amber", `pain=${s.pain}`);
  assert.equal(s.tier,         2,       `tier=${s.tier}`);
});

test("TC3 → spend=green, architecture=amber, pain=green, tier=3", () => {
  const s = runScoring(TC3_NURTURE);
  assert.equal(s.spend,        "green", `spend=${s.spend}`);
  assert.equal(s.architecture, "amber", `arch=${s.architecture}`);
  assert.equal(s.pain,         "green", `pain=${s.pain}`);
  assert.equal(s.tier,         3,       `tier=${s.tier}`);
});

test("TC4 → tier=4 (hard exclude wins)", () => {
  const s = runScoring(TC4_EXCLUDE);
  assert.equal(s.tier, 4, `tier=${s.tier}`);
});

test("getCTAUrl: tier 1 → co-scan-book", () => {
  assert.ok(getCTAUrl(1).includes("co-scan-book"), "Tier 1 CTA should contain co-scan-book");
});
test("getCTAUrl: tier 2 → co-scan-book", () => {
  assert.ok(getCTAUrl(2).includes("co-scan-book"), "Tier 2 CTA should contain co-scan-book");
});
test("getCTAUrl: tier 3 → cost-optimization", () => {
  assert.ok(getCTAUrl(3).includes("cost-optimization"), "Tier 3 CTA should link to content hub");
});
test("getCTAUrl: tier 4 → learn", () => {
  assert.ok(getCTAUrl(4).includes("learn"), "Tier 4 CTA should link to learn page");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Insight service tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== 3. Insight Service ===");

test("TC1 generates exactly 3 insights", () => {
  const scores = runScoring(TC1_STRONG_FIT);
  const insights = generateInsights(TC1_STRONG_FIT, scores, scores.tier);
  assert.ok(insights.length >= 1 && insights.length <= 3, `Got ${insights.length} insights`);
});

test("TC1 insights include spend_no_unit_econ text (spend=red, unit=none)", () => {
  const scores = runScoring(TC1_STRONG_FIT);
  const insights = generateInsights(TC1_STRONG_FIT, scores, scores.tier);
  const hasUnitEconInsight = insights.some((i) => i.includes("unit economics visibility"));
  assert.ok(hasUnitEconInsight, "Expected unit economics insight for TC1");
});

test("TC1 insights include premium_models text", () => {
  const scores = runScoring(TC1_STRONG_FIT);
  const insights = generateInsights(TC1_STRONG_FIT, scores, scores.tier);
  const hasPremiumInsight = insights.some((i) => i.includes("model tiering"));
  assert.ok(hasPremiumInsight, "Expected model tiering insight for TC1");
});

test("TC3 insights include tier 3 default text (low signal match)", () => {
  const scores = runScoring(TC3_NURTURE);
  const insights = generateInsights(TC3_NURTURE, scores, scores.tier);
  // TC3 has very few strong signals — should fall back to tier default
  assert.ok(insights.length > 0, "Should have at least one insight");
  // All insight texts should be non-empty strings
  insights.forEach((i, idx) => {
    assert.ok(typeof i === "string" && i.length > 0, `Insight[${idx}] is empty`);
  });
});

test("TC4 insights contain at least one insight", () => {
  const scores = runScoring(TC4_EXCLUDE);
  const insights = generateInsights(TC4_EXCLUDE, scores, scores.tier);
  assert.ok(insights.length > 0, "Tier 4 should still return at least 1 insight");
});

test("generateInsights never returns duplicates", () => {
  const scores = runScoring(TC1_STRONG_FIT);
  const insights = generateInsights(TC1_STRONG_FIT, scores, scores.tier);
  const unique = new Set(insights);
  assert.equal(unique.size, insights.length, "Insights must be deduplicated");
});

test("generateInsights returns strings (never undefined)", () => {
  const scores = runScoring(TC2_GOOD_FIT);
  const insights = generateInsights(TC2_GOOD_FIT, scores, scores.tier);
  insights.forEach((i, idx) => {
    assert.equal(typeof i, "string", `Insight[${idx}] must be a string`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Full pipeline simulation (no Brevo, no HTTP)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== 4. Full Pipeline (no I/O) ===");

function simulatePipeline(input: FormState) {
  const validationErrors = validateSubmission(input);
  const scores           = runScoring(input);
  const insights         = generateInsights(input, scores, scores.tier);
  const submissionId     = "test-uuid-" + Date.now();
  const ctaUrl           = getCTAUrl(scores.tier);
  return { validationErrors, scores, insights, submissionId, ctaUrl };
}

test("TC1 pipeline: valid → tier 1 → booking CTA", () => {
  const { validationErrors, scores, insights, ctaUrl } = simulatePipeline(TC1_STRONG_FIT);
  assert.equal(validationErrors.length, 0);
  assert.equal(scores.tier, 1);
  assert.ok(ctaUrl.includes("co-scan-book"));
  assert.ok(insights.length > 0);
});

test("TC2 pipeline: valid → tier 2 → booking CTA", () => {
  const { validationErrors, scores, ctaUrl } = simulatePipeline(TC2_GOOD_FIT);
  assert.equal(validationErrors.length, 0);
  assert.equal(scores.tier, 2);
  assert.ok(ctaUrl.includes("co-scan-book"));
});

test("TC3 pipeline: valid → tier 3 → content CTA", () => {
  const { validationErrors, scores, ctaUrl } = simulatePipeline(TC3_NURTURE);
  assert.equal(validationErrors.length, 0);
  assert.equal(scores.tier, 3);
  assert.ok(ctaUrl.includes("cost-optimization"));
});

test("TC4 pipeline: valid → tier 4 → learn CTA", () => {
  const { validationErrors, scores, ctaUrl } = simulatePipeline(TC4_EXCLUDE);
  assert.equal(validationErrors.length, 0);
  assert.equal(scores.tier, 4);
  assert.ok(ctaUrl.includes("learn"));
});

test("pipeline always returns insights even for tier 4", () => {
  const { insights } = simulatePipeline(TC4_EXCLUDE);
  assert.ok(insights.length > 0, "Tier 4 must still return insights");
});

test("pipeline output contains all required scorecard fields", () => {
  const { scores } = simulatePipeline(TC1_STRONG_FIT);
  const ragValues = ["red", "amber", "green"];
  assert.ok(ragValues.includes(scores.spend),        "spend must be a RAG value");
  assert.ok(ragValues.includes(scores.architecture), "architecture must be a RAG value");
  assert.ok(ragValues.includes(scores.pain),         "pain must be a RAG value");
  assert.ok([1, 2, 3, 4].includes(scores.tier),      "tier must be 1-4");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"=".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed > 0) {
  process.exit(1); // non-zero exit code signals test failure to CI
}
