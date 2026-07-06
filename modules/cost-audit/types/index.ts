// ─────────────────────────────────────────────────────────────────────────────
// Pixel Punch — AI Cost Scan · Shared Types
// Mirrors cost-scan-schema.json exactly.
// Frontend NEVER computes tier or insights — all intelligence is backend-only.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enum value sets ────────────────────────────────────────────────────────

export const AI_DEPENDENCE_VALUES = [
  "core_revenue",
  "key_workflows",
  "limited_pilots",
  "no_production",
] as const;

export const SPEND_BAND_VALUES = [
  "lt_5k",
  "5k_25k",
  "25k_100k",
  "100k_plus",
] as const;

export const SPEND_VISIBILITY_VALUES = [
  "very_clear",
  "somewhat_clear",
  "rough_guess",
  "no_view",
] as const;

export const UNIT_ECONOMICS_VALUES = [
  "cost_per_request",
  "cost_per_task",
  "cost_per_customer",
  "none",
] as const;

export const MAIN_PAIN_VALUES = [
  "bills_growing",
  "margin_pressure",
  "budget_scrutiny",
  "lack_visibility",
] as const;

export const LEAKAGE_PATTERN_VALUES = [
  "large_prompts",
  "premium_models",
  "weak_routing",
  "idle_gpu",
  "unattributed",
  "not_sure",
] as const;

export const OPTIMIZATION_DONE_VALUES = [
  "formal_audit",
  "prompt_tuning",
  "model_tiering",
  "infra_rightsizing",
  "none_adhoc",
] as const;

export const SAVINGS_THRESHOLD_VALUES = [
  "gte_10",
  "gte_25",
  "gte_40",
  "need_visibility_first",
] as const;

export const REF_VALUES = [
  "co-e2-scan",
  "co-landing",
  "co-hermes",
  "co-scan-book",
] as const;

// ── Derived types ──────────────────────────────────────────────────────────

export type AiDependence     = (typeof AI_DEPENDENCE_VALUES)[number];
export type SpendBand        = (typeof SPEND_BAND_VALUES)[number];
export type SpendVisibility  = (typeof SPEND_VISIBILITY_VALUES)[number];
export type UnitEconomic     = (typeof UNIT_ECONOMICS_VALUES)[number];
export type MainPain         = (typeof MAIN_PAIN_VALUES)[number];
export type LeakagePattern   = (typeof LEAKAGE_PATTERN_VALUES)[number];
export type OptimizationDone = (typeof OPTIMIZATION_DONE_VALUES)[number];
export type SavingsThreshold = (typeof SAVINGS_THRESHOLD_VALUES)[number];
export type Ref              = (typeof REF_VALUES)[number];

// ── Form state ─────────────────────────────────────────────────────────────

/** Live wizard state — also the POST body sent to /api/cost-scan/submit */
export interface FormState {
  // Q1
  ai_dependence: AiDependence | "";
  // Q2a
  monthly_spend_band: SpendBand | "";
  // Q2b
  spend_visibility: SpendVisibility | "";
  // Q3 (multi-select; "none" must be exclusive)
  unit_economics: UnitEconomic[];
  // Q4
  main_pain: MainPain | "";
  // Q5
  leakage_pattern: LeakagePattern | "";
  // Q6 (multi-select; "none_adhoc" must be exclusive)
  optimization_done: OptimizationDone[];
  // Q7
  savings_threshold: SavingsThreshold | "";
  // Optional free-text
  extra_context?: string;
  // Lead capture
  firstname: string;
  lastname: string;
  email: string;
  company: string;
  job_title: string;
  // Tracking
  ref?: string;

  // Q8 Technical Resources (optional step 9)
  website_url: string;
  ai_providers: string[];
  ai_models: string;
  ai_infrastructure: string[];
  ai_other: string[];
  technical_notes: string;
  documents: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
  }>;

  // Medium feature upgrades
  architecture_files: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
  }>;
  cost_files: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
  }>;
  usage_metrics: {
    monthly_requests: string;
    input_tokens: string;
    output_tokens: string;
    model_distribution: string;
    gpu_hours: string;
    latency_requirements: string;
    user_volume: string;
  };
}

export const INITIAL_FORM_STATE: FormState = {
  ai_dependence:      "",
  monthly_spend_band: "",
  spend_visibility:   "",
  unit_economics:     [],
  main_pain:          "",
  leakage_pattern:    "",
  optimization_done:  [],
  savings_threshold:  "",
  extra_context:      "",
  firstname:          "",
  lastname:           "",
  email:              "",
  company:            "",
  job_title:          "",
  ref:                "",
  
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

// ── API response ───────────────────────────────────────────────────────────

export type Rag = "red" | "amber" | "green";

export interface ScorecardResult {
  submissionId: string;
  scorecard: {
    spend:        Rag;
    architecture: Rag;
    pain:         Rag;
  };
  tier:     1 | 2 | 3 | 4;
  insights: string[];
  ctaUrl:   string;
  auditReport?: string;
  findings?: string[];
  recommendations?: string[];
  
  // Medium feature responses
  confidenceScore: string;
  architectureAnalysis: {
    summary: string;
    findings: string[];
    risks: string[];
  };
  costAnalysis: {
    summary: string;
    normalizedData: {
      monthlySpend?: string;
      provider?: string;
      serviceUsage?: string;
      modelUsage?: string;
      tokenConsumption?: string;
      gpuCost?: string;
      unusedResources?: string;
    };
  };
}

/** Shape stored in sessionStorage for results page fallback */
export interface StoredScanResult extends ScorecardResult {
  contact: {
    firstname: string;
    lastname:  string;
    email:     string;
    company:   string;
  };
}

// ── Validation helpers ─────────────────────────────────────────────────────

export type ValidationErrors = Partial<Record<keyof FormState, string>>;

/** Returns true if the value is a member of the given readonly tuple */
export function isValidEnum<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}
