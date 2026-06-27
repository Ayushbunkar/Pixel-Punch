// ─────────────────────────────────────────────────────────────────────────────
// Pixel Punch — AI Opportunity Scan · Types
// Mirrors opportunity-schema.json exactly.
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS_TYPE_VALUES = [
  "saas",
  "agency_services",
  "retail_ecommerce",
  "healthcare_finance",
  "other",
] as const;

export const MAIN_OUTCOME_VALUES = [
  "more_leads",
  "higher_conversion",
  "faster_followup",
  "lower_manual_work",
  "other",
] as const;

export const BIGGEST_CHALLENGE_VALUES = [
  "slow_processes",
  "too_much_manual",
  "data_scattered",
  "sales_gaps",
  "other",
] as const;

export const DATA_SYSTEMS_VALUES = [
  "crm",
  "erp",
  "helpdesk",
  "spreadsheets",
  "other",
] as const;

export const AUTOMATION_BARRIERS_VALUES = [
  "data_not_centralized",
  "tools_dont_integrate",
  "team_manual_steps",
  "no_clear_design",
  "other",
] as const;

export const WORKFLOW_STANDARDIZATION_VALUES = [
  "very_standardized",
  "somewhat_standardized",
  "mostly_adhoc",
  "not_sure",
  "other",
] as const;

export const MANUAL_PROCESSES_VALUES = [
  "data_entry",
  "email_followup",
  "reporting",
  "customer_support",
  "other",
] as const;

export const INFO_RETRIEVAL_VALUES = [
  "shared_drives",
  "internal_docs",
  "slack_teams",
  "ask_colleague",
  "other",
] as const;

export const SYSTEMS_CONNECTION_VALUES = [
  "fully_integrated",
  "partially_integrated",
  "mostly_disconnected",
  "not_sure",
  "other",
] as const;

export const DATA_QUALITY_VALUES = [
  "clean_reliable",
  "some_gaps",
  "inconsistent",
  "poor_unclear",
  "other",
] as const;

export const INQUIRY_HANDLING_VALUES = [
  "humans_mostly",
  "partly_automated",
  "ticketing_system",
  "email_based",
  "other",
] as const;

export const REQUEST_TYPES_VALUES = [
  "basic_faqs",
  "billing",
  "technical_issues",
  "sales_inquiries",
  "other",
] as const;

export const LEAD_QUALIFICATION_VALUES = [
  "manually_by_sales",
  "automated_rules",
  "crm_scoring",
  "not_qualified",
  "other",
] as const;

export const DESIRED_USE_CASE_VALUES = [
  "automating_tasks",
  "customer_support",
  "sales_followup",
  "internal_knowledge",
  "other",
] as const;

export const ADOPTION_BLOCKER_VALUES = [
  "lack_of_usecases",
  "data_quality_issues",
  "technical_complexity",
  "budget_concerns",
  "other",
] as const;

export const COMPANY_SIZE_VALUES = [
  "1_10",
  "11_50",
  "51_200",
  "201_500",
  "501_plus",
] as const;

// ── Derived types ──────────────────────────────────────────────────────────

export type BusinessType           = (typeof BUSINESS_TYPE_VALUES)[number];
export type MainOutcome            = (typeof MAIN_OUTCOME_VALUES)[number];
export type BiggestChallenge       = (typeof BIGGEST_CHALLENGE_VALUES)[number];
export type DataSystem             = (typeof DATA_SYSTEMS_VALUES)[number];
export type AutomationBarrier      = (typeof AUTOMATION_BARRIERS_VALUES)[number];
export type WorkflowStandardization = (typeof WORKFLOW_STANDARDIZATION_VALUES)[number];
export type ManualProcess          = (typeof MANUAL_PROCESSES_VALUES)[number];
export type InfoRetrieval          = (typeof INFO_RETRIEVAL_VALUES)[number];
export type SystemsConnection      = (typeof SYSTEMS_CONNECTION_VALUES)[number];
export type DataQuality            = (typeof DATA_QUALITY_VALUES)[number];
export type InquiryHandling        = (typeof INQUIRY_HANDLING_VALUES)[number];
export type RequestType            = (typeof REQUEST_TYPES_VALUES)[number];
export type LeadQualification      = (typeof LEAD_QUALIFICATION_VALUES)[number];
export type DesiredUseCase         = (typeof DESIRED_USE_CASE_VALUES)[number];
export type AdoptionBlocker        = (typeof ADOPTION_BLOCKER_VALUES)[number];
export type CompanySize            = (typeof COMPANY_SIZE_VALUES)[number];

// ── Form State ─────────────────────────────────────────────────────────────

export interface FormState {
  business_type: BusinessType | "";
  main_outcome: MainOutcome | "";
  biggest_challenge: BiggestChallenge | "";
  data_systems: DataSystem[];
  automation_barriers: AutomationBarrier | "";
  workflow_standardization: WorkflowStandardization | "";
  manual_processes: ManualProcess[];
  info_retrieval: InfoRetrieval | "";
  systems_connection: SystemsConnection | "";
  data_quality: DataQuality | "";
  inquiry_handling: InquiryHandling | "";
  request_types: RequestType | "";
  lead_qualification: LeadQualification | "";
  desired_use_case: DesiredUseCase | "";
  adoption_blocker: AdoptionBlocker | "";
  
  extra_context?: string;

  // Lead contact & company details
  firstname: string;
  lastname: string;
  email: string;
  company: string;
  company_size: CompanySize | "";
  job_title: string;
  ref?: string;
}

export const INITIAL_FORM_STATE: FormState = {
  business_type: "",
  main_outcome: "",
  biggest_challenge: "",
  data_systems: [],
  automation_barriers: "",
  workflow_standardization: "",
  manual_processes: [],
  info_retrieval: "",
  systems_connection: "",
  data_quality: "",
  inquiry_handling: "",
  request_types: "",
  lead_qualification: "",
  desired_use_case: "",
  adoption_blocker: "",
  extra_context: "",
  firstname: "",
  lastname: "",
  email: "",
  company: "",
  company_size: "",
  job_title: "",
  ref: "op-landing",
};

// ── Scorecard result types ──────────────────────────────────────────────────

export type Rag = "red" | "amber" | "green";

export interface ScorecardResult {
  submissionId: string;
  scorecard: {
    readiness: Rag;
    value:     Rag;
    opportunity: Rag;
  };
  tier: 1 | 2 | 3 | 4;
  recommendations: string[];
  roadmap: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
  createdDate: string;
  auditStatus: "pending" | "completed";
}

export interface StoredScanResult extends ScorecardResult {
  company: {
    name: string;
    industry: string;
    size: string;
    businessType: string;
  };
  contact: {
    firstname: string;
    lastname: string;
    email: string;
    job_title: string;
  };
}

export type ValidationErrors = Partial<Record<keyof FormState, string>>;

export function isValidEnum<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}
