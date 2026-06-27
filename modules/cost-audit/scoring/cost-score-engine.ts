// =============================================================================
// Pixel Punch — AI Cost Scan · Scoring Engine
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Rag = "red" | "amber" | "green";

export type AiDependence   = "core_revenue" | "key_workflows" | "limited_pilots" | "no_production";
export type SpendBand      = "lt_5k" | "5k_25k" | "25k_100k" | "100k_plus";
export type SpendVisibility = "very_clear" | "somewhat_clear" | "rough_guess" | "no_view";
export type UnitEconomic   = "cost_per_request" | "cost_per_task" | "cost_per_customer" | "none";
export type MainPain       = "bills_growing" | "margin_pressure" | "budget_scrutiny" | "lack_visibility";
export type LeakagePattern = "large_prompts" | "premium_models" | "weak_routing" | "idle_gpu" | "unattributed" | "not_sure";
export type OptimizationDone = "formal_audit" | "prompt_tuning" | "model_tiering" | "infra_rightsizing" | "none_adhoc";
export type SavingsThreshold = "gte_10" | "gte_25" | "gte_40" | "need_visibility_first";

/** Raw questionnaire answers — mirrors cost-scan-schema.json exactly. */
export interface FormInput {
  ai_dependence:     AiDependence;
  monthly_spend_band: SpendBand;
  spend_visibility:  SpendVisibility;
  unit_economics:    UnitEconomic[];   // minItems: 1; "none" must be exclusive
  main_pain:         MainPain;
  leakage_pattern:   LeakagePattern;
  optimization_done: OptimizationDone[]; // minItems: 1; "none_adhoc" must be exclusive
  savings_threshold: SavingsThreshold;
}

/** Engine output — the only public surface area of this module. */
export interface ScorecardResult {
  spend:        Rag;
  architecture: Rag;
  pain:         Rag;
  tier:         1 | 2 | 3 | 4;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * worstOf — returns the most severe RAG rating in the list.
 * Priority: red > amber > green.
 * An empty array is treated as green (no signals ⇒ best case).
 */
export function worstOf(ratings: Rag[]): Rag {
  if (ratings.includes("red"))   return "red";
  if (ratings.includes("amber")) return "amber";
  return "green";
}

// ---------------------------------------------------------------------------
// Dimension 1 — Spend & Visibility
// ---------------------------------------------------------------------------

/**
 * scoreSpend — evaluates three sub-signals then returns the worst.
 *
 * Sub-signals:
 *   spendBand    : how large the monthly AI bill is
 *   visibility   : how well the team understands that bill
 *   unitEconomics: whether cost-per-unit metrics are tracked
 */
export function scoreSpend(input: FormInput): Rag {
  // --- spend band ---
  const spendBandRag: Rag =
    input.monthly_spend_band === "25k_100k" || input.monthly_spend_band === "100k_plus"
      ? "red"
      : input.monthly_spend_band === "5k_25k"
        ? "amber"
        : "green"; // lt_5k

  // --- visibility ---
  const visibilityRag: Rag =
    input.spend_visibility === "rough_guess" || input.spend_visibility === "no_view"
      ? "red"
      : input.spend_visibility === "somewhat_clear"
        ? "amber"
        : "green"; // very_clear

  // --- unit economics ---
  // Red  : "none" selected, or the array is somehow empty (should be prevented by schema)
  // Green : 2+ distinct tracking metrics (excluding "none")
  // Amber : exactly 1 metric tracked (partial visibility)
  const hasNone       = input.unit_economics.includes("none");
  const isEmpty       = input.unit_economics.length === 0;
  const trackingCount = input.unit_economics.filter((v) => v !== "none").length;

  const unitEconRag: Rag =
    hasNone || isEmpty
      ? "red"
      : trackingCount >= 2
        ? "green"
        : "amber"; // exactly 1 metric

  return worstOf([spendBandRag, visibilityRag, unitEconRag]);
}

// ---------------------------------------------------------------------------
// Dimension 2 — Architecture & Leakage Risk
// ---------------------------------------------------------------------------

/**
 * scoreArchitecture — evaluates three sub-signals then returns the worst.
 *
 * Sub-signals:
 *   aiDependence    : how mission-critical AI is to the business
 *   leakagePattern  : where cost waste is suspected
 *   optimizationGap : how structured past optimization efforts have been
 */
export function scoreArchitecture(input: FormInput): Rag {
  // --- AI dependence ---
  const aiDependenceRag: Rag =
    input.ai_dependence === "core_revenue" || input.ai_dependence === "key_workflows"
      ? "red"
      : input.ai_dependence === "limited_pilots"
        ? "amber"
        : "green"; // no_production

  // --- leakage pattern ---
  const HIGH_RISK_LEAKAGE: LeakagePattern[] = [
    "large_prompts",
    "premium_models",
    "weak_routing",
    "idle_gpu",
    "unattributed",
  ];
  const leakageRag: Rag =
    HIGH_RISK_LEAKAGE.includes(input.leakage_pattern)
      ? "red"
      : input.leakage_pattern === "not_sure"
        ? "amber"
        : "green"; // unreachable given current enum, but safe fallback

  // --- optimization gap ---
  // Red   : only "none_adhoc" selected (no structured work done at all)
  // Green : "formal_audit" included OR 3+ structured steps completed
  // Amber : 1–2 structured steps (partial progress)
  const onlyNoneAdhoc =
    input.optimization_done.length === 1 &&
    input.optimization_done[0] === "none_adhoc";

  const structuredSteps = input.optimization_done.filter(
    (v) => v !== "none_adhoc",
  );
  const hasFormalAudit  = structuredSteps.includes("formal_audit");
  const stepCount       = structuredSteps.length;

  const optimizationRag: Rag =
    onlyNoneAdhoc
      ? "red"
      : hasFormalAudit || stepCount >= 3
        ? "green"
        : "amber"; // 1–2 structured steps

  return worstOf([aiDependenceRag, leakageRag, optimizationRag]);
}

// ---------------------------------------------------------------------------
// Dimension 3 — Business Pain & Urgency
// ---------------------------------------------------------------------------

/**
 * scorePain — blends business pain severity with savings-threshold urgency.
 *
 * Sub-signals:
 *   mainPain         : the primary business problem driving AI cost concern
 *   savingsThreshold : the ROI bar the prospect needs to commit to a full audit
 */
export function scorePain(input: FormInput): Rag {
  // --- main pain ---
  const painRag: Rag =
    input.main_pain === "margin_pressure" || input.main_pain === "budget_scrutiny"
      ? "red"
      : input.main_pain === "bills_growing"
        ? "amber"
        : "green"; // lack_visibility → low urgency

  // --- savings threshold ---
  const thresholdRag: Rag =
    input.savings_threshold === "gte_25" || input.savings_threshold === "gte_40"
      ? "red"
      : input.savings_threshold === "gte_10"
        ? "amber"
        : "green"; // need_visibility_first → not yet ready to commit

  return worstOf([painRag, thresholdRag]);
}

// ---------------------------------------------------------------------------
// Tier routing
// ---------------------------------------------------------------------------

/**
 * computeTier — routes a prospect into one of four engagement tiers.
 *
 * Evaluated in strict priority order so the first matching rule wins:
 *
 *   Tier 4 (Exclude)      — too early stage to benefit from an audit
 *   Tier 1 (Strong fit)   — clear audit candidate; immediate sales action
 *   Tier 2 (Good fit)     — probable audit candidate; scoped offer
 *   Tier 3 (Future nurture) — default; nurture until ready
 *
 * @param spend        — result of scoreSpend()
 * @param architecture — result of scoreArchitecture()
 * @param pain         — result of scorePain()
 * @param input        — raw form answers (needed for raw-field checks)
 */
export function computeTier(
  spend:        Rag,
  architecture: Rag,
  pain:         Rag,
  input:        FormInput,
): 1 | 2 | 3 | 4 {
  // --- Tier 4: hard exclusion (checked first — always wins) ---
  if (
    input.ai_dependence === "no_production" &&
    input.monthly_spend_band === "lt_5k"
  ) {
    return 4;
  }

  const redCount = [spend, architecture, pain].filter((s) => s === "red").length;

  // --- Tier 1: strong fit ---
  if (
    redCount >= 2 ||
    (spend === "red" && architecture === "red" && input.ai_dependence !== "no_production")
  ) {
    return 1;
  }

  // --- Tier 2: good fit ---
  const isAiImportant: AiDependence[] = ["core_revenue", "key_workflows", "limited_pilots"];
  const isSpendMeaningful: SpendBand[] = ["5k_25k", "25k_100k", "100k_plus"];

  if (
    isAiImportant.includes(input.ai_dependence) &&
    isSpendMeaningful.includes(input.monthly_spend_band) &&
    redCount >= 1
  ) {
    return 2;
  }

  // --- Tier 3: everything else ---
  return 3;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * runScoringEngine — orchestrates all scoring steps.
 *
 * This is the single function the API layer should call.
 * It is a pure function: same input always produces the same output.
 *
 * @param input — validated FormInput (schema validation is the caller's responsibility)
 * @returns     ScorecardResult containing three RAG ratings and a tier
 */
export function runScoringEngine(input: FormInput): ScorecardResult {
  const spend        = scoreSpend(input);
  const architecture = scoreArchitecture(input);
  const pain         = scorePain(input);
  const tier         = computeTier(spend, architecture, pain, input);

  return { spend, architecture, pain, tier };
}

// =============================================================================
// Unit tests — console.assert only, no test framework required
// Run with: npx ts-node scoring-engine.ts
// =============================================================================

function assertEqual<T>(
  label:    string,
  actual:   T,
  expected: T,
): void {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.assert(pass, `FAIL [${label}]\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  if (pass) console.log(`  PASS [${label}]`);
}

// ---------------------------------------------------------------------------
// Test fixtures (sourced directly from Section 9 test cases in the handover)
// ---------------------------------------------------------------------------

/** TC-1: Strong fit — all red, Tier 1 */
const TC1_STRONG_FIT: FormInput = {
  ai_dependence:     "core_revenue",
  monthly_spend_band: "100k_plus",
  spend_visibility:  "no_view",
  unit_economics:    ["none"],
  main_pain:         "margin_pressure",
  leakage_pattern:   "premium_models",
  optimization_done: ["none_adhoc"],
  savings_threshold: "gte_25",
};

/** TC-2: Good fit — mixed amber/red, Tier 2 */
const TC2_GOOD_FIT: FormInput = {
  ai_dependence:     "key_workflows",
  monthly_spend_band: "5k_25k",
  spend_visibility:  "somewhat_clear",
  unit_economics:    ["cost_per_request"],
  main_pain:         "bills_growing",
  leakage_pattern:   "weak_routing",
  optimization_done: ["prompt_tuning"],
  savings_threshold: "gte_10",
};

/** TC-3: Nurture — mostly green, Tier 3 */
const TC3_NURTURE: FormInput = {
  ai_dependence:     "limited_pilots",
  monthly_spend_band: "lt_5k",
  spend_visibility:  "very_clear",
  unit_economics:    ["cost_per_request", "cost_per_task"],
  main_pain:         "lack_visibility",
  leakage_pattern:   "not_sure",
  optimization_done: ["formal_audit"],
  savings_threshold: "need_visibility_first",
};

/** TC-4: Exclude — no production + tiny spend, Tier 4 */
const TC4_EXCLUDE: FormInput = {
  ai_dependence:     "no_production",
  monthly_spend_band: "lt_5k",
  spend_visibility:  "very_clear",
  unit_economics:    ["none"],
  main_pain:         "lack_visibility",
  leakage_pattern:   "not_sure",
  optimization_done: ["none_adhoc"],
  savings_threshold: "need_visibility_first",
};

/** TC-5: Tier 1 via spend+arch both red (not 2 red dimensions, but the AND rule) */
const TC5_TIER1_VIA_AND_RULE: FormInput = {
  ai_dependence:     "core_revenue",
  monthly_spend_band: "25k_100k",
  spend_visibility:  "rough_guess",
  unit_economics:    ["none"],
  main_pain:         "bills_growing",   // amber pain — only 1 explicit "red" dimension
  leakage_pattern:   "large_prompts",
  optimization_done: ["none_adhoc"],
  savings_threshold: "gte_10",           // amber threshold
};

/** TC-6: Tier 2 — limited pilots at meaningful spend with one red */
const TC6_TIER2_LIMITED_PILOTS: FormInput = {
  ai_dependence:     "limited_pilots",
  monthly_spend_band: "25k_100k",
  spend_visibility:  "rough_guess",
  unit_economics:    ["none"],           // spend = red
  main_pain:         "bills_growing",
  leakage_pattern:   "not_sure",
  optimization_done: ["prompt_tuning", "model_tiering"],
  savings_threshold: "need_visibility_first",
};

/** TC-7: worstOf edge cases */

console.log("\n=== Pixel Punch AI Cost Scan — Scoring Engine Unit Tests ===\n");

// --- worstOf ---
console.log("--- worstOf ---");
assertEqual("worstOf: all green",          worstOf(["green", "green", "green"]), "green");
assertEqual("worstOf: red wins",           worstOf(["green", "red", "amber"]),   "red");
assertEqual("worstOf: amber over green",   worstOf(["green", "amber"]),          "amber");
assertEqual("worstOf: empty → green",      worstOf([]),                           "green");

// --- scoreSpend ---
console.log("\n--- scoreSpend ---");
// TC2: 5k_25k(amber) + somewhat_clear(amber) + 1 metric(amber) → worstOf = amber
assertEqual("TC1 spend=red",   scoreSpend(TC1_STRONG_FIT), "red");
assertEqual("TC2 spend=amber", scoreSpend(TC2_GOOD_FIT),   "amber");
assertEqual("TC3 spend=green", scoreSpend(TC3_NURTURE),    "green");
assertEqual("TC4 spend=red",   scoreSpend(TC4_EXCLUDE),    "red");

// --- scoreArchitecture ---
console.log("\n--- scoreArchitecture ---");
assertEqual("TC1 arch=red",   scoreArchitecture(TC1_STRONG_FIT), "red");
assertEqual("TC2 arch=red",   scoreArchitecture(TC2_GOOD_FIT),   "red");
// TC3: limited_pilots(amber) + not_sure(amber) + formal_audit(green) → worstOf = amber
assertEqual("TC3 arch=amber", scoreArchitecture(TC3_NURTURE),    "amber");
assertEqual("TC4 arch=red",   scoreArchitecture(TC4_EXCLUDE),    "red"); // none_adhoc only → red

// --- scorePain ---
console.log("\n--- scorePain ---");
assertEqual("TC1 pain=red",   scorePain(TC1_STRONG_FIT), "red");
assertEqual("TC2 pain=amber", scorePain(TC2_GOOD_FIT),   "amber");
assertEqual("TC3 pain=green", scorePain(TC3_NURTURE),    "green");
assertEqual("TC4 pain=green", scorePain(TC4_EXCLUDE),    "green");

// --- Full engine runs ---
console.log("\n--- runScoringEngine (full) ---");

const r1 = runScoringEngine(TC1_STRONG_FIT);
assertEqual("TC1 spend",        r1.spend,        "red");
assertEqual("TC1 architecture", r1.architecture, "red");
assertEqual("TC1 pain",         r1.pain,         "red");
assertEqual("TC1 tier",         r1.tier,         1);

const r2 = runScoringEngine(TC2_GOOD_FIT);
// TC2: spend=amber (5k_25k+somewhat_clear+1 metric), arch=red (key_workflows+weak_routing+only prompt_tuning)
assertEqual("TC2 spend",        r2.spend,        "amber");
assertEqual("TC2 architecture", r2.architecture, "red");
assertEqual("TC2 pain",         r2.pain,         "amber");
// Tier 2: isAiImportant(key_workflows) + isSpendMeaningful(5k_25k) + redCount=1(arch)
assertEqual("TC2 tier",         r2.tier,         2);

const r3 = runScoringEngine(TC3_NURTURE);
assertEqual("TC3 spend",        r3.spend,        "green");
// TC3 arch = amber: limited_pilots + not_sure + formal_audit → worstOf([amber,amber,green]) = amber
assertEqual("TC3 architecture", r3.architecture, "amber");
assertEqual("TC3 pain",         r3.pain,         "green");
// Tier 3: redCount=0, lt_5k not in isSpendMeaningful → Tier 2 condition fails → Tier 3
assertEqual("TC3 tier",         r3.tier,         3);

const r4 = runScoringEngine(TC4_EXCLUDE);
assertEqual("TC4 tier=4 (hard exclude wins regardless of RAG)", r4.tier, 4);

const r5 = runScoringEngine(TC5_TIER1_VIA_AND_RULE);
assertEqual("TC5 spend=red",    r5.spend,        "red");
assertEqual("TC5 arch=red",     r5.architecture, "red");
assertEqual("TC5 tier=1 (spend+arch red AND rule)", r5.tier, 1);

const r6 = runScoringEngine(TC6_TIER2_LIMITED_PILOTS);
assertEqual("TC6 tier=2",       r6.tier,         2);

console.log("\n=== All assertions complete ===\n");
