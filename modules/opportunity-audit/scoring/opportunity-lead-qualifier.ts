// =============================================================================
// Pixel Punch — AI Opportunity Audit · Sales Intelligence Lead Qualifier
// Scoring formulas, rulesets, and CRM-ready payloads.
// =============================================================================

import type { FormState } from "../types";

export type QualificationTier = "Tier 1: High AI Opportunity" | "Tier 2: Good Fit" | "Tier 3: Needs Education" | "Tier 4: Not Ready";
export type LeadStatus = "SQL" | "MQL" | "NURTURE" | "DISQUALIFIED";
export type RoutingDestination = "sales_priority_inbox" | "sales_standard_inbox" | "marketing_nurture_campaign" | "cold_disqualified";

export interface CRMLeadPayload {
  submissionId: string;
  leadScore: number;
  qualificationTier: QualificationTier;
  leadStatus: LeadStatus;
  routingDestination: RoutingDestination;
  crmTags: string[];
  salesContextNotes: string;
  mappedFields: {
    companyName: string;
    contactEmail: string;
    contactPhone?: string;
    contactName: string;
    companySize: string;
    businessType: string;
    jobTitle: string;
  };
}

/**
 * Calculates a lead score between 0 and 100.
 */
export function calculateLeadScore(input: FormState): number {
  let score = 0;

  // 1. Business Size (Max 30 pts)
  if (input.company_size === "501_plus")  score += 30;
  else if (input.company_size === "201_500") score += 30;
  else if (input.company_size === "51_200")  score += 25;
  else if (input.company_size === "11_50")   score += 15;
  else if (input.company_size === "1_10")    score += 5;

  // 2. Pain Level (Max 20 pts)
  if (input.biggest_challenge === "too_much_manual") score += 10;
  else if (input.biggest_challenge === "slow_processes") score += 7;
  else if (input.biggest_challenge === "data_scattered") score += 5;

  if (input.main_outcome === "lower_manual_work") score += 10;
  else if (input.main_outcome === "faster_followup") score += 8;
  else if (input.main_outcome === "higher_conversion") score += 8;

  // 3. Manual Work Density (Max 20 pts)
  const manualCount = input.manual_processes.length;
  score += manualCount * 5;

  // 4. Data Maturity (Max 15 pts)
  if (input.data_quality === "clean_reliable") score += 10;
  else if (input.data_quality === "some_gaps") score += 7;
  
  if (input.data_systems.includes("crm")) score += 5;
  if (input.data_systems.includes("erp")) score += 5;

  // 5. AI Interest (Max 15 pts)
  if (input.desired_use_case === "automating_tasks") score += 15;
  else if (input.desired_use_case === "customer_support") score += 10;
  else if (input.desired_use_case === "sales_followup") score += 10;

  // 6. Budget Readiness / Blocker Adjustments
  if (input.adoption_blocker === "budget_concerns") {
    score -= 15; // Deduct for budget friction
  } else if (input.adoption_blocker === "technical_complexity") {
    score += 5;  // Tech complexity is a consultative sales opportunity
  }

  return Math.max(0, Math.min(score, 100));
}

/**
 * Classifies lead based on rules and calculated score.
 */
export function qualifyLead(input: FormState, submissionId: string): CRMLeadPayload {
  const leadScore = calculateLeadScore(input);
  const tags: string[] = [];

  // Identify tag indicators
  tags.push(`SIZE_${(input.company_size ?? "unknown").toUpperCase()}`);
  tags.push(`TYPE_${(input.business_type ?? "unknown").toUpperCase()}`);

  if (input.data_quality === "clean_reliable") {
    tags.push("DATA_MATURE");
  }
  if (input.adoption_blocker === "budget_concerns") {
    tags.push("BUDGET_RISK");
  }

  // Rules classification
  let qualificationTier: QualificationTier = "Tier 3: Needs Education";
  let leadStatus: LeadStatus = "NURTURE";
  let routingDestination: RoutingDestination = "marketing_nurture_campaign";
  let notes = "";

  const isSmallBiz = input.company_size === "1_10";
  const hasBudgetBlocker = input.adoption_blocker === "budget_concerns";

  if (leadScore >= 75 && !hasBudgetBlocker && !isSmallBiz) {
    qualificationTier = "Tier 1: High AI Opportunity";
    leadStatus = "SQL";
    routingDestination = "sales_priority_inbox";
    tags.push("LEAD_SQL", "HIGH_PRIORITY");
    notes = `High-value SQL target. ${input.company} has a mature process fit and high automation potential. Main goal is ${input.main_outcome.replace("_", " ")}.`;
  } else if (leadScore >= 50 && !isSmallBiz) {
    qualificationTier = "Tier 2: Good Fit";
    leadStatus = "MQL";
    routingDestination = "sales_standard_inbox";
    tags.push("LEAD_MQL");
    notes = `Qualified MQL. Good process fit but has minor constraints (e.g. Blocker: ${input.adoption_blocker.replace("_", " ")}). Recommended for direct sales reachout.`;
  } else if (isSmallBiz && hasBudgetBlocker) {
    qualificationTier = "Tier 4: Not Ready";
    leadStatus = "DISQUALIFIED";
    routingDestination = "cold_disqualified";
    tags.push("LEAD_COLD");
    notes = `Disqualified lead due to budget concerns and small company size. Mapped to cold archive.`;
  } else {
    qualificationTier = "Tier 3: Needs Education";
    leadStatus = "NURTURE";
    routingDestination = "marketing_nurture_campaign";
    tags.push("LEAD_NURTURE");
    notes = `Lead needs nurturing. Operational processes or data structure not yet ready for instant AI deployments.`;
  }

  return {
    submissionId,
    leadScore,
    qualificationTier,
    leadStatus,
    routingDestination,
    crmTags: tags,
    salesContextNotes: notes,
    mappedFields: {
      companyName: input.company,
      contactEmail: input.email,
      contactName: `${input.firstname} ${input.lastname}`,
      companySize: input.company_size,
      businessType: input.business_type,
      jobTitle: input.job_title,
    },
  };
}
