// =============================================================================
// Pixel Punch — AI Opportunity Audit · Scoring Engine
// Pure functions and dynamic JSON config evaluation.
// =============================================================================

import { readFileSync } from "fs";
import { join }         from "path";
import type { FormState, Rag, ScorecardResult } from "../types";

export type Classification = "low" | "medium" | "high";

export interface CategoryResult {
  name: string;
  score: number;
  maxScore: number;
  classification: Classification;
  description: string;
}

export type ConfigScoringResult = Record<string, CategoryResult>;

/**
 * worstOf — returns the most severe RAG rating in the list.
 */
export function worstOf(ratings: Rag[]): Rag {
  if (ratings.includes("red"))   return "red";
  if (ratings.includes("amber")) return "amber";
  return "green";
}

/**
 * Loads the JSON scoring configuration safely.
 */
function loadScoringConfig(): any {
  try {
    const configPath = join(process.cwd(), "modules", "opportunity-audit", "scoring", "opportunity-scoring-config.json");
    const raw = readFileSync(configPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[opportunity-score-engine] Failed to load opportunity-scoring-config.json:", err);
    return null;
  }
}

/**
 * Evaluates a single rule condition against the form inputs.
 */
function evaluateRule(rule: any, input: FormState): boolean {
  const inputValue = input[rule.field as keyof FormState];

  if (inputValue === undefined || inputValue === null) {
    return false;
  }

  if (rule.condition === "equals") {
    return String(inputValue) === String(rule.value);
  }

  if (rule.condition === "contains") {
    if (Array.isArray(inputValue)) {
      return (inputValue as string[]).includes(String(rule.value));
    }
    return String(inputValue).includes(String(rule.value));
  }

  return false;
}

/**
 * runConfigScoring — dynamically evaluates the 6 categories from the JSON config.
 */
export function runConfigScoring(input: FormState): ConfigScoringResult {
  const config = loadScoringConfig();
  const results: ConfigScoringResult = {};

  if (!config || !config.categories) {
    return results;
  }

  for (const [key, category] of Object.entries(config.categories) as [string, any][]) {
    let score = 0;
    
    // Accumulate points from matching rules
    for (const rule of category.rules) {
      if (evaluateRule(rule, input)) {
        score += rule.weight;
      }
    }

    // Clamp score between 0 and max_score
    const maxScore = category.max_score || 100;
    score = Math.max(0, Math.min(score, maxScore));

    // Determine classification (low, medium, high) based on threshold ranges
    let classification: Classification = "medium";
    for (const [cls, range] of Object.entries(category.thresholds) as [Classification, [number, number]][]) {
      if (score >= range[0] && score <= range[1]) {
        classification = cls;
        break;
      }
    }

    results[key] = {
      name: category.name,
      score,
      maxScore,
      classification,
      description: category.description,
    };
  }

  return results;
}

// ── Original RAG & Tier Logics (kept for compatibility) ──────────────────────

export function scoreReadiness(input: FormState): Rag {
  const standardRag: Rag =
    input.workflow_standardization === "very_standardized"
      ? "green"
      : input.workflow_standardization === "somewhat_standardized"
        ? "amber"
        : "red";

  const connectionRag: Rag =
    input.systems_connection === "fully_integrated"
      ? "green"
      : input.systems_connection === "partially_integrated"
        ? "amber"
        : "red";

  const qualityRag: Rag =
    input.data_quality === "clean_reliable"
      ? "green"
      : input.data_quality === "some_gaps" || input.data_quality === "inconsistent"
        ? "amber"
        : "red";

  return worstOf([standardRag, connectionRag, qualityRag]);
}

export function scoreBusinessValue(input: FormState): Rag {
  if (input.main_outcome === "lower_manual_work" || input.biggest_challenge === "too_much_manual") {
    return "red";
  }

  if (
    input.main_outcome === "more_leads" ||
    input.main_outcome === "higher_conversion" ||
    input.main_outcome === "faster_followup"
  ) {
    return "amber";
  }

  return "green";
}

export function scoreOpportunityDensity(input: FormState): Rag {
  const manualCount = input.manual_processes.length;
  const isHumanInquiries = input.inquiry_handling === "humans_mostly";

  if (manualCount >= 3 || isHumanInquiries) {
    return "red";
  }

  if (manualCount <= 1 && input.inquiry_handling === "partly_automated") {
    return "green";
  }

  return "amber";
}

export function computeTier(
  readiness: Rag,
  value: Rag,
  opportunity: Rag,
  input: FormState
): 1 | 2 | 3 | 4 {
  if (input.adoption_blocker === "budget_concerns" && input.company_size === "1_10" && opportunity === "green") {
    return 4;
  }

  if (opportunity === "red" && value === "red" && (readiness === "green" || readiness === "amber")) {
    return 1;
  }

  if ((opportunity === "red" || value === "red") && readiness === "red") {
    return 2;
  }

  return 3;
}

export function generateRecommendationsAndRoadmap(input: FormState) {
  const recommendations: string[] = [];
  const phase1: string[] = [];
  const phase2: string[] = [];
  const phase3: string[] = [];

  if (input.manual_processes.includes("customer_support") && input.request_types === "basic_faqs") {
    recommendations.push("Deploy a custom RAG-based Customer Support AI agent to handle basic FAQs instantly, reducing human triage load.");
    phase1.push("Launch standard Customer Support chatbot powered by company FAQ documents.");
  }

  if (input.manual_processes.includes("data_entry") && (input.data_quality === "some_gaps" || input.data_quality === "inconsistent")) {
    recommendations.push("Implement a Document Intelligence pipeline to extract, clean, and normalize customer records before uploading them to CRM/ERP.");
    phase2.push("Integrate Document AI parser to automate invoice and client onboarding data entry.");
  }

  if (input.desired_use_case === "sales_followup" || input.biggest_challenge === "sales_gaps") {
    recommendations.push("Establish automated AI email agents for sales lead qualification, scheduling, and instant follow-ups.");
    phase1.push("Set up automated lead routing rules and simple AI-assisted follow-up email drafts.");
    phase2.push("Connect autonomous Sales Qualification agents to CRM for automatic pipeline updates.");
  }

  if (input.info_retrieval === "ask_colleague" || input.info_retrieval === "shared_drives") {
    recommendations.push("Deploy an internal Ask-AI Enterprise Search engine connected to your shared drives and internal documents (RAG).");
    phase1.push("Centralize critical documents into a single knowledge base.");
    phase2.push("Deploy a secure internal RAG search engine (e.g. connected to Google Drive/Slack).");
  }

  if (input.systems_connection === "mostly_disconnected" && input.automation_barriers === "tools_dont_integrate") {
    recommendations.push("Integrate automation middleware (e.g. Zapier, Make) with AI integrations to connect isolated tools before coding custom AI.");
    phase1.push("Set up automated data syncs between CRM and ERP using middleware.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Map core workflows to identify step-by-step logic for standardizing before applying AI agents.");
    phase1.push("Standardize and document the highest-frequency process.");
    phase2.push("Implement a rule-based automation script for the standardized process.");
  }

  phase3.push("Evaluate agentic workflows where multi-agent systems negotiate and complete complex multi-step jobs (e.g. fully autonomous reporting).");

  return {
    recommendations: recommendations.slice(0, 3),
    roadmap: {
      phase1: phase1.length > 0 ? phase1 : ["Standardize core data input fields."],
      phase2: phase2.length > 0 ? phase2 : ["Deploy first domain-specific AI copilot."],
      phase3,
    }
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────────────
export function runScoringEngine(
  input: FormState,
  submissionId: string
): ScorecardResult & { categories: ConfigScoringResult } {
  const readiness = scoreReadiness(input);
  const value = scoreBusinessValue(input);
  const opportunity = scoreOpportunityDensity(input);
  const tier = computeTier(readiness, value, opportunity, input);

  const { recommendations, roadmap } = generateRecommendationsAndRoadmap(input);
  
  // Dynamic 6-category evaluation
  const categories = runConfigScoring(input);

  return {
    submissionId,
    scorecard: {
      readiness,
      value,
      opportunity,
    },
    tier,
    recommendations,
    roadmap,
    createdDate: new Date().toISOString(),
    auditStatus: "completed",
    categories,
    insights: [],
    ctaUrl: "",
    confidenceScore: "N/A",
    architectureAnalysis: { summary: "", findings: [], risks: [] },
    costAnalysis: { summary: "", normalizedData: {} },
  };
}
