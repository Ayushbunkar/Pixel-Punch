// =============================================================================
// Lead Qualifier Unit Tests
// Run with: npx ts-node -r tsconfig-paths/register --project tsconfig.json modules/opportunity-audit/scoring/opportunity-lead-qualifier.test.ts
// =============================================================================

import assert from "node:assert/strict";
import { qualifyLead, calculateLeadScore } from "./opportunity-lead-qualifier";
import type { FormState } from "../types";

const TC_TIER1_SQL: FormState = {
  business_type: "saas",
  main_outcome: "lower_manual_work",
  biggest_challenge: "too_much_manual",
  data_systems: ["crm", "erp"],
  automation_barriers: "team_manual_steps",
  workflow_standardization: "very_standardized",
  manual_processes: ["customer_support", "data_entry", "reporting"],
  info_retrieval: "slack_teams",
  systems_connection: "fully_integrated",
  data_quality: "clean_reliable",
  inquiry_handling: "humans_mostly",
  request_types: "basic_faqs",
  lead_qualification: "crm_scoring",
  desired_use_case: "automating_tasks",
  adoption_blocker: "technical_complexity",
  firstname: "Bob",
  lastname: "SDR",
  email: "bob@saas.com",
  company: "SQL Enterprise",
  company_size: "201_500",
  job_title: "VP Ops",
  ref: "op-landing",
};

const TC_TIER4_DISQ: FormState = {
  business_type: "other",
  main_outcome: "more_leads",
  biggest_challenge: "slow_processes",
  data_systems: ["spreadsheets"],
  automation_barriers: "no_clear_design",
  workflow_standardization: "mostly_adhoc",
  manual_processes: ["data_entry"],
  info_retrieval: "ask_colleague",
  systems_connection: "mostly_disconnected",
  data_quality: "poor_unclear",
  inquiry_handling: "humans_mostly",
  request_types: "other",
  lead_qualification: "not_qualified",
  desired_use_case: "other",
  adoption_blocker: "budget_concerns",
  firstname: "Tiny",
  lastname: "Biz",
  email: "tiny@biz.com",
  company: "Tiny Shop",
  company_size: "1_10",
  job_title: "Owner",
  ref: "op-landing",
};

console.log("\n=== Pixel Punch AI Opportunity Audit — Lead Qualifier Unit Tests ===\n");

// Tier 1 Qualification Test
const score1 = calculateLeadScore(TC_TIER1_SQL);
const lead1 = qualifyLead(TC_TIER1_SQL, "id-1");
assert.ok(score1 >= 75, "Tier 1 score should be >= 75");
assert.equal(lead1.qualificationTier, "Tier 1: High AI Opportunity");
assert.equal(lead1.leadStatus, "SQL");
assert.equal(lead1.routingDestination, "sales_priority_inbox");
assert.ok(lead1.crmTags.includes("HIGH_PRIORITY"), "Should tag high priority");
console.log("  PASS [Qualify SQL Tier 1 targets successfully]");

// Tier 4 Qualification Test
const score4 = calculateLeadScore(TC_TIER4_DISQ);
const lead4 = qualifyLead(TC_TIER4_DISQ, "id-4");
assert.ok(score4 < 30, "Tier 4 score should be low");
assert.equal(lead4.qualificationTier, "Tier 4: Not Ready");
assert.equal(lead4.leadStatus, "DISQUALIFIED");
assert.equal(lead4.routingDestination, "cold_disqualified");
assert.ok(lead4.crmTags.includes("BUDGET_RISK"), "Should tag budget risk");
console.log("  PASS [Disqualify Tier 4 targets successfully]");

console.log("\n=== All assertions complete successfully ===\n");
