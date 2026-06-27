// =============================================================================
// Server-side validation for POST /api/opportunity-scan/submit
// Runs on the server to validate raw request bodies.
// =============================================================================

import {
  BUSINESS_TYPE_VALUES,
  MAIN_OUTCOME_VALUES,
  BIGGEST_CHALLENGE_VALUES,
  DATA_SYSTEMS_VALUES,
  AUTOMATION_BARRIERS_VALUES,
  WORKFLOW_STANDARDIZATION_VALUES,
  MANUAL_PROCESSES_VALUES,
  INFO_RETRIEVAL_VALUES,
  SYSTEMS_CONNECTION_VALUES,
  DATA_QUALITY_VALUES,
  INQUIRY_HANDLING_VALUES,
  REQUEST_TYPES_VALUES,
  LEAD_QUALIFICATION_VALUES,
  DESIRED_USE_CASE_VALUES,
  ADOPTION_BLOCKER_VALUES,
  COMPANY_SIZE_VALUES,
} from "@/modules/opportunity-audit/types";
import type { FormState } from "@/modules/opportunity-audit/types";

export interface FieldError {
  field:   string;
  message: string;
}

/** Validates every field of the raw request body. Returns [] if valid. */
export function validateSubmission(body: unknown): FieldError[] {
  const errors: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [{ field: "_root", message: "Request body must be a JSON object." }];
  }
  const data = body as Record<string, unknown>;

  const required = (field: string, label: string) => {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push({ field, message: `${label} is required.` });
      return false;
    }
    return true;
  };

  const enumField = <T extends readonly string[]>(
    field: string,
    allowed: T,
    label: string,
  ): boolean => {
    if (!required(field, label)) return false;
    if (typeof data[field] !== "string" || !(allowed as readonly string[]).includes(data[field] as string)) {
      errors.push({ field, message: `${label} must be one of: ${allowed.join(", ")}.` });
      return false;
    }
    return true;
  };

  const arrayField = <T extends readonly string[]>(
    field:   string,
    allowed: T,
    label:   string,
  ): boolean => {
    if (!required(field, label)) return false;
    const val = data[field];
    if (!Array.isArray(val) || val.length === 0) {
      errors.push({ field, message: `${label} must be a non-empty array.` });
      return false;
    }
    const invalid = (val as unknown[]).filter(
      (v) => typeof v !== "string" || !(allowed as readonly string[]).includes(v as string),
    );
    if (invalid.length > 0) {
      errors.push({ field, message: `${label} contains invalid values: ${JSON.stringify(invalid)}.` });
      return false;
    }
    return true;
  };

  const stringField = (field: string, label: string, opts?: { maxLength?: number; format?: "email" }) => {
    if (!required(field, label)) return false;
    if (typeof data[field] !== "string") {
      errors.push({ field, message: `${label} must be a string.` });
      return false;
    }
    const val = (data[field] as string).trim();
    if (opts?.maxLength && val.length > opts.maxLength) {
      errors.push({ field, message: `${label} must be at most ${opts.maxLength} characters.` });
      return false;
    }
    if (opts?.format === "email") {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRe.test(val)) {
        errors.push({ field, message: `${label} must be a valid email address.` });
        return false;
      }
    }
    return true;
  };

  // ── Validate Questions ────────────────────────────────────────────────────
  enumField("business_type", BUSINESS_TYPE_VALUES, "Business type (Q1)");
  enumField("main_outcome", MAIN_OUTCOME_VALUES, "Main outcome (Q2)");
  enumField("biggest_challenge", BIGGEST_CHALLENGE_VALUES, "Biggest challenge (Q3)");
  arrayField("data_systems", DATA_SYSTEMS_VALUES, "Data systems (Q4)");
  enumField("automation_barriers", AUTOMATION_BARRIERS_VALUES, "Automation barriers (Q5)");
  enumField("workflow_standardization", WORKFLOW_STANDARDIZATION_VALUES, "Workflow standardization (Q6)");
  arrayField("manual_processes", MANUAL_PROCESSES_VALUES, "Manual processes (Q7)");
  enumField("info_retrieval", INFO_RETRIEVAL_VALUES, "Info retrieval (Q8)");
  enumField("systems_connection", SYSTEMS_CONNECTION_VALUES, "Systems connection (Q9)");
  enumField("data_quality", DATA_QUALITY_VALUES, "Data quality (Q10)");
  enumField("inquiry_handling", INQUIRY_HANDLING_VALUES, "Inquiry handling (Q11)");
  enumField("request_types", REQUEST_TYPES_VALUES, "Request types (Q12)");
  enumField("lead_qualification", LEAD_QUALIFICATION_VALUES, "Lead qualification (Q13)");
  enumField("desired_use_case", DESIRED_USE_CASE_VALUES, "Desired use case (Q14)");
  enumField("adoption_blocker", ADOPTION_BLOCKER_VALUES, "Adoption blocker (Q15)");

  // ── Lead context ──────────────────────────────────────────────────────────
  stringField("firstname", "First name", { maxLength: 100 });
  stringField("lastname",  "Last name",  { maxLength: 100 });
  stringField("email",     "Email",      { maxLength: 254, format: "email" });
  stringField("company",   "Company",    { maxLength: 200 });
  enumField("company_size", COMPANY_SIZE_VALUES, "Company size");
  stringField("job_title", "Job title",  { maxLength: 150 });

  // Optional
  if (data["extra_context"] !== undefined && data["extra_context"] !== null && data["extra_context"] !== "") {
    if (typeof data["extra_context"] !== "string") {
      errors.push({ field: "extra_context", message: "Extra context must be a string." });
    } else if ((data["extra_context"] as string).length > 2000) {
      errors.push({ field: "extra_context", message: "Extra context must be at most 2000 characters." });
    }
  }

  return errors;
}

/** Casts raw object to structured FormState */
export function castToFormState(data: Record<string, unknown>): FormState {
  return {
    business_type:            data.business_type            as FormState["business_type"],
    main_outcome:             data.main_outcome             as FormState["main_outcome"],
    biggest_challenge:        data.biggest_challenge        as FormState["biggest_challenge"],
    data_systems:             data.data_systems             as FormState["data_systems"],
    automation_barriers:      data.automation_barriers      as FormState["automation_barriers"],
    workflow_standardization: data.workflow_standardization as FormState["workflow_standardization"],
    manual_processes:         data.manual_processes         as FormState["manual_processes"],
    info_retrieval:           data.info_retrieval           as FormState["info_retrieval"],
    systems_connection:       data.systems_connection       as FormState["systems_connection"],
    data_quality:             data.data_quality             as FormState["data_quality"],
    inquiry_handling:         data.inquiry_handling         as FormState["inquiry_handling"],
    request_types:            data.request_types            as FormState["request_types"],
    lead_qualification:       data.lead_qualification       as FormState["lead_qualification"],
    desired_use_case:         data.desired_use_case         as FormState["desired_use_case"],
    adoption_blocker:         data.adoption_blocker         as FormState["adoption_blocker"],
    extra_context:            (data.extra_context as string | undefined) ?? "",
    firstname:                (data.firstname as string).trim(),
    lastname:                 (data.lastname as string).trim(),
    email:                    (data.email as string).trim().toLowerCase(),
    company:                  (data.company as string).trim(),
    company_size:             data.company_size             as FormState["company_size"],
    job_title:                (data.job_title as string).trim(),
    ref:                      (data.ref as string | undefined) ?? "op-landing",
  };
}
