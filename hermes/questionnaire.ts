import { FormState } from "@/modules/cost-audit/types";

export type QuestionId = keyof FormState | "contact_info";

export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: QuestionId;
  prompt: string;
  type: "single" | "multiple" | "text" | "contact";
  options?: Option[];
  exclusiveOptions?: string[]; // E.g., if 'none' is selected, others are removed
}

export const questionnaire: Question[] = [
  {
    id: "ai_dependence",
    prompt: "Which of your products or internal processes depend on AI today?",
    type: "single",
    options: [
      { label: "Core revenue features", value: "core_revenue" },
      { label: "Internal workflows", value: "key_workflows" },
      { label: "Experiments", value: "limited_pilots" },
      { label: "No production AI", value: "no_production" },
    ],
  },
  {
    id: "monthly_spend_band",
    prompt: "Approximately how much do you spend on AI every month?",
    type: "single",
    options: [
      { label: "< $5k", value: "lt_5k" },
      { label: "$5k - $25k", value: "5k_25k" },
      { label: "$25k - $100k", value: "25k_100k" },
      { label: "$100k+", value: "100k_plus" },
    ],
  },
  {
    id: "spend_visibility",
    prompt: "How clearly can you see where that AI spend is going?",
    type: "single",
    options: [
      { label: "Very clear", value: "very_clear" },
      { label: "Somewhat clear", value: "somewhat_clear" },
      { label: "Rough guess", value: "rough_guess" },
      { label: "No view", value: "no_view" },
    ],
  },
  {
    id: "unit_economics",
    prompt: "What AI cost metrics do you currently track?",
    type: "multiple",
    options: [
      { label: "Cost per request", value: "cost_per_request" },
      { label: "Cost per task", value: "cost_per_task" },
      { label: "Cost per customer", value: "cost_per_customer" },
      { label: "None", value: "none" },
    ],
    exclusiveOptions: ["none"],
  },
  {
    id: "main_pain",
    prompt: "What feels like your biggest AI cost challenge?",
    type: "single",
    options: [
      { label: "Bills growing too fast", value: "bills_growing" },
      { label: "Margin pressure", value: "margin_pressure" },
      { label: "Budget scrutiny", value: "budget_scrutiny" },
      { label: "Lack of visibility", value: "lack_visibility" },
    ],
  },
  {
    id: "leakage_pattern",
    prompt: "Where do you think AI cost leakage is happening?",
    type: "single",
    options: [
      { label: "Large prompts", value: "large_prompts" },
      { label: "Premium models", value: "premium_models" },
      { label: "Weak routing", value: "weak_routing" },
      { label: "Idle GPU", value: "idle_gpu" },
      { label: "Unattributed spend", value: "unattributed" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
  {
    id: "optimization_done",
    prompt: "Which AI optimization steps have you already tried?",
    type: "multiple",
    options: [
      { label: "Formal audit", value: "formal_audit" },
      { label: "Prompt tuning", value: "prompt_tuning" },
      { label: "Model tiering", value: "model_tiering" },
      { label: "Infra rightsizing", value: "infra_rightsizing" },
      { label: "None / Ad-hoc", value: "none_adhoc" },
    ],
    exclusiveOptions: ["none_adhoc"],
  },
  {
    id: "savings_threshold",
    prompt: "What savings level would make a deeper audit worthwhile?",
    type: "single",
    options: [
      { label: ">= 10%", value: "gte_10" },
      { label: ">= 25%", value: "gte_25" },
      { label: ">= 40%", value: "gte_40" },
      { label: "Need visibility first", value: "need_visibility_first" },
    ],
  },
  {
    id: "extra_context",
    prompt: "Anything else about your AI stack, security requirements, vendors, or cost concerns?",
    type: "text",
  },
  {
    id: "contact_info",
    prompt: "Finally, what's your contact info so we can send you your detailed scorecard?",
    type: "contact",
  },
];
