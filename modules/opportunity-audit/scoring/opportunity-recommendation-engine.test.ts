// =============================================================================
// Opportunity Recommendation Engine Unit Tests
// Run with: npx ts-node -r tsconfig-paths/register --project tsconfig.json modules/opportunity-audit/scoring/opportunity-recommendation-engine.test.ts
// =============================================================================

import assert from "node:assert/strict";
import { buildRecommendationPrompt, generateFallbackRecommendations } from "./opportunity-recommendation-engine";
import { runConfigScoring } from "./opportunity-score-engine";
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

console.log("\n=== Pixel Punch AI Opportunity Audit — Recommendation Engine Unit Tests ===\n");

const scores = runConfigScoring(TEST_INPUT);

// Test Prompt Template
const prompt = buildRecommendationPrompt(TEST_INPUT, scores);
assert.ok(prompt.includes("SaaS Corp"), "Prompt should contain company name");
assert.ok(prompt.includes("humans_mostly"), "Prompt should contain inquiry handling answers");
assert.ok(prompt.includes("AI Readiness"), "Prompt should contain category score references");
console.log("  PASS [Prompt contains company details and scores]");

// Test Fallback Generator
const fallbacks = generateFallbackRecommendations(TEST_INPUT);
assert.ok(fallbacks.length > 0, "Should generate fallback recommendations");
assert.equal(fallbacks[0].opportunity, "AI Customer Support Agent", "Should recommend Support Agent for customer support pain");
assert.equal(fallbacks[0].priority, "High", "Should flag priority as High since main outcome is lower manual work");
console.log("  PASS [Fallback rules return custom recommendations and correct priority]");

console.log("\n=== All assertions complete successfully ===\n");
