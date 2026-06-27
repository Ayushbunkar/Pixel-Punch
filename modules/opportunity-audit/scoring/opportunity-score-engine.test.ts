// =============================================================================
// Opportunity Score Engine Unit Tests
// Run with: npx ts-node -r tsconfig-paths/register --project tsconfig.json modules/opportunity-audit/scoring/opportunity-score-engine.test.ts
// =============================================================================

import assert from "node:assert/strict";
import {
  runScoringEngine,
  scoreReadiness,
  scoreBusinessValue,
  scoreOpportunityDensity,
  computeTier,
} from "./opportunity-score-engine";
import type { FormState } from "../types";

const TC1_STRONG_FIT: FormState = {
  business_type: "saas",
  main_outcome: "lower_manual_work",
  biggest_challenge: "too_much_manual",
  data_systems: ["crm", "spreadsheets"],
  automation_barriers: "team_manual_steps",
  workflow_standardization: "very_standardized",
  manual_processes: ["data_entry", "reporting", "customer_support"],
  info_retrieval: "slack_teams",
  systems_connection: "fully_integrated",
  data_quality: "clean_reliable",
  inquiry_handling: "humans_mostly",
  request_types: "basic_faqs",
  lead_qualification: "crm_scoring",
  desired_use_case: "automating_tasks",
  adoption_blocker: "technical_complexity",
  firstname: "John",
  lastname: "Doe",
  email: "john@saas.com",
  company: "SaaS Corp",
  company_size: "51_200",
  job_title: "VP of Operations",
  ref: "op-landing",
};

const TC2_CONSULTING_CANDIDATE: FormState = {
  business_type: "agency_services",
  main_outcome: "lower_manual_work",
  biggest_challenge: "too_much_manual",
  data_systems: ["spreadsheets"],
  automation_barriers: "data_not_centralized",
  workflow_standardization: "mostly_adhoc",
  manual_processes: ["data_entry", "reporting"],
  info_retrieval: "ask_colleague",
  systems_connection: "mostly_disconnected",
  data_quality: "poor_unclear",
  inquiry_handling: "humans_mostly",
  request_types: "billing",
  lead_qualification: "not_qualified",
  desired_use_case: "customer_support",
  adoption_blocker: "data_quality_issues",
  firstname: "Jane",
  lastname: "Smith",
  email: "jane@agency.com",
  company: "Smith Agency",
  company_size: "11_50",
  job_title: "Founder",
  ref: "op-landing",
};

console.log("\n=== Pixel Punch AI Opportunity Audit — Scoring Engine Unit Tests ===\n");

// --- scoreReadiness ---
console.log("--- scoreReadiness ---");
const r1 = scoreReadiness(TC1_STRONG_FIT);
assert.equal(r1, "green", `TC1 Readiness should be green, got ${r1}`);
console.log("  PASS [TC1 Readiness = green]");

const r2 = scoreReadiness(TC2_CONSULTING_CANDIDATE);
assert.equal(r2, "red", `TC2 Readiness should be red (due to mostly_adhoc/disconnected/poor_data), got ${r2}`);
console.log("  PASS [TC2 Readiness = red]");

// --- scoreBusinessValue ---
console.log("--- scoreBusinessValue ---");
const v1 = scoreBusinessValue(TC1_STRONG_FIT);
assert.equal(v1, "red", `TC1 Value should be red (high urgency), got ${v1}`);
console.log("  PASS [TC1 Value = red]");

// --- scoreOpportunityDensity ---
console.log("--- scoreOpportunityDensity ---");
const o1 = scoreOpportunityDensity(TC1_STRONG_FIT);
assert.equal(o1, "red", `TC1 Opportunity should be red (high density), got ${o1}`);
console.log("  PASS [TC1 Opportunity = red]");

// --- computeTier ---
console.log("--- computeTier ---");
const t1 = computeTier(r1, v1, o1, TC1_STRONG_FIT);
assert.equal(t1, 1, `TC1 Tier should be 1 (Strong fit), got ${t1}`);
console.log("  PASS [TC1 Tier = 1]");

const v2 = scoreBusinessValue(TC2_CONSULTING_CANDIDATE);
const o2 = scoreOpportunityDensity(TC2_CONSULTING_CANDIDATE);
const t2 = computeTier(r2, v2, o2, TC2_CONSULTING_CANDIDATE);
assert.equal(t2, 2, `TC2 Tier should be 2 (Consulting candidate due to low readiness), got ${t2}`);
console.log("  PASS [TC2 Tier = 2]");

// --- Full engine runs ---
console.log("--- runScoringEngine (full) ---");
const result1 = runScoringEngine(TC1_STRONG_FIT, "test-submission-id");
assert.equal(result1.scorecard.readiness, "green");
assert.equal(result1.scorecard.value, "red");
assert.equal(result1.scorecard.opportunity, "red");
assert.equal(result1.tier, 1);
assert.ok(result1.recommendations.length > 0, "Should have recommendations");
assert.ok(result1.roadmap.phase1.length > 0, "Should have phase 1 roadmap");
console.log("  PASS [Full run TC1 matches scorecard and roadmap]");

console.log("\n=== All assertions complete successfully ===\n");
