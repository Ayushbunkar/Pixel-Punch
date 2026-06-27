// =============================================================================
// Opportunity Report Generator Unit Tests
// Run with: npx ts-node -r tsconfig-paths/register --project tsconfig.json modules/opportunity-audit/scoring/opportunity-report-generator.test.ts
// =============================================================================

import assert from "node:assert/strict";
import { buildReportPrompt, generateFallbackReport } from "./opportunity-report-generator";
import { runConfigScoring } from "./opportunity-score-engine";
import { generateFallbackRecommendations } from "./opportunity-recommendation-engine";
import type { FormState } from "../types";

const TEST_INPUT: FormState = {
  business_type: "saas",
  main_outcome: "lower_manual_work",
  biggest_challenge: "too_much_manual",
  data_systems: ["crm"],
  automation_barriers: "team_manual_steps",
  workflow_standardization: "very_standardized",
  manual_processes: ["customer_support"],
  info_retrieval: "slack_teams",
  systems_connection: "fully_integrated",
  data_quality: "clean_reliable",
  inquiry_handling: "humans_mostly",
  request_types: "basic_faqs",
  lead_qualification: "crm_scoring",
  desired_use_case: "customer_support",
  adoption_blocker: "technical_complexity",
  firstname: "John",
  lastname: "Doe",
  email: "john@saas.com",
  company: "SaaS Corp",
  company_size: "51_200",
  job_title: "Operations Director",
  ref: "op-landing",
};

console.log("\n=== Pixel Punch AI Opportunity Audit — Report Generator Unit Tests ===\n");

const scores = runConfigScoring(TEST_INPUT);
const recommendations = generateFallbackRecommendations(TEST_INPUT);

// Test Prompt Template
const prompt = buildReportPrompt(TEST_INPUT, scores, recommendations);
assert.ok(prompt.includes("AI Opportunity Audit & Roadmap Report"), "Prompt should mention target report headers");
assert.ok(prompt.includes("SaaS Corp"), "Prompt should contain company context");
console.log("  PASS [Report Prompt template built correctly]");

// Test Fallback Report Generator
const reportOutput = generateFallbackReport(TEST_INPUT, scores, recommendations);
assert.ok(reportOutput.reportText.includes("# AI Opportunity Audit & Roadmap Report"), "Report text should contain markdown title");
assert.ok(reportOutput.findings.length > 0, "Report findings should be populated");
assert.ok(reportOutput.nextSteps.length > 0, "Report next steps should be populated");
console.log("  PASS [Fallback report text, findings, and next steps populated correctly]");

console.log("\n=== All assertions complete successfully ===\n");
