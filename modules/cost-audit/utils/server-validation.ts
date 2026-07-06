// =============================================================================
// Server-side validation for POST /api/cost-scan/submit
// Separate from the client hook — runs on the server and must never trust input.
// =============================================================================

import {
  AI_DEPENDENCE_VALUES,
  SPEND_BAND_VALUES,
  SPEND_VISIBILITY_VALUES,
  UNIT_ECONOMICS_VALUES,
  MAIN_PAIN_VALUES,
  LEAKAGE_PATTERN_VALUES,
  OPTIMIZATION_DONE_VALUES,
  SAVINGS_THRESHOLD_VALUES,
} from "@/modules/cost-audit/types";
import type { FormState } from "@/modules/cost-audit/types";

export interface FieldError {
  field:   string;
  message: string;
}

/** Validates every field of the raw request body. Returns [] if valid. */
export function validateSubmission(body: unknown): FieldError[] {
  const errors: FieldError[] = [];

  // ── Type guard ────────────────────────────────────────────────────────────
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [{ field: "_root", message: "Request body must be a JSON object." }];
  }
  const bodyRecord = body as Record<string, unknown>;
  const hasAnswers = bodyRecord.answers && typeof bodyRecord.answers === "object" && !Array.isArray(bodyRecord.answers);
  const data = hasAnswers ? (bodyRecord.answers as Record<string, unknown>) : bodyRecord;

  // ── Helper functions ──────────────────────────────────────────────────────
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

  // ── Q1 ────────────────────────────────────────────────────────────────────
  enumField("ai_dependence", AI_DEPENDENCE_VALUES, "AI dependence (Q1)");

  // ── Q2a ──────────────────────────────────────────────────────────────────
  enumField("monthly_spend_band", SPEND_BAND_VALUES, "Monthly spend band (Q2a)");

  // ── Q2b ──────────────────────────────────────────────────────────────────
  enumField("spend_visibility", SPEND_VISIBILITY_VALUES, "Spend visibility (Q2b)");

  // ── Q3 — unit_economics (multi, "none" exclusive) ─────────────────────────
  if (arrayField("unit_economics", UNIT_ECONOMICS_VALUES, "Unit economics (Q3)")) {
    const ue = data["unit_economics"] as string[];
    if (ue.includes("none") && ue.length > 1) {
      errors.push({
        field:   "unit_economics",
        message: "\"none\" must be the only selection in unit economics.",
      });
    }
  }

  // ── Q4 ────────────────────────────────────────────────────────────────────
  enumField("main_pain", MAIN_PAIN_VALUES, "Main pain (Q4)");

  // ── Q5 ────────────────────────────────────────────────────────────────────
  enumField("leakage_pattern", LEAKAGE_PATTERN_VALUES, "Leakage pattern (Q5)");

  // ── Q6 — optimization_done (multi, "none_adhoc" exclusive) ────────────────
  if (arrayField("optimization_done", OPTIMIZATION_DONE_VALUES, "Optimization done (Q6)")) {
    const od = data["optimization_done"] as string[];
    if (od.includes("none_adhoc") && od.length > 1) {
      errors.push({
        field:   "optimization_done",
        message: "\"none_adhoc\" must be the only selection in optimization done.",
      });
    }
  }

  // ── Q7 ────────────────────────────────────────────────────────────────────
  enumField("savings_threshold", SAVINGS_THRESHOLD_VALUES, "Savings threshold (Q7)");

  // ── Optional: extra_context ───────────────────────────────────────────────
  if (data["extra_context"] !== undefined && data["extra_context"] !== null && data["extra_context"] !== "") {
    if (typeof data["extra_context"] !== "string") {
      errors.push({ field: "extra_context", message: "Extra context must be a string." });
    } else if ((data["extra_context"] as string).length > 2000) {
      errors.push({ field: "extra_context", message: "Extra context must be at most 2000 characters." });
    }
  }

  // ── Lead capture ──────────────────────────────────────────────────────────
  if (data["firstname"] !== undefined && data["firstname"] !== null && data["firstname"] !== "") {
    stringField("firstname", "First name", { maxLength: 100 });
  }
  if (data["email"] !== undefined && data["email"] !== null && data["email"] !== "") {
    stringField("email",     "Email",      { maxLength: 254, format: "email" });
  }

  if (data["lastname"] !== undefined && data["lastname"] !== null && data["lastname"] !== "") {
    stringField("lastname",  "Last name",  { maxLength: 100 });
  }
  if (data["company"] !== undefined && data["company"] !== null && data["company"] !== "") {
    stringField("company",   "Company",    { maxLength: 200 });
  }
  if (data["job_title"] !== undefined && data["job_title"] !== null && data["job_title"] !== "") {
    stringField("job_title", "Job title",  { maxLength: 150 });
  }

  // ── Technical audit fields validation (if nested payload) ─────────────────
  if (hasAnswers) {
    const techCtx = (bodyRecord.technicalContext || {}) as Record<string, any>;
    
    // Website URL (can be in technicalContext or at root)
    const url = techCtx.websiteUrl !== undefined ? techCtx.websiteUrl : bodyRecord.websiteUrl;
    if (url !== undefined && url !== null && url !== "") {
      if (typeof url !== "string") {
        errors.push({ field: "websiteUrl", message: "Website URL must be a string." });
      } else {
        const trimmed = url.trim();
        if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
          errors.push({ field: "websiteUrl", message: "Please enter a valid website URL." });
        }
      }
    }

    // AI Stack (can be in technicalContext or at root)
    const aiStack = techCtx.aiStack !== undefined ? techCtx.aiStack : bodyRecord.aiStack;
    if (aiStack !== undefined && aiStack !== null) {
      if (typeof aiStack !== "object" || Array.isArray(aiStack)) {
        errors.push({ field: "aiStack", message: "AI Stack details must be a JSON object." });
      }
    }

    // Technical Notes (can be in technicalContext or at root)
    const notes = techCtx.technicalNotes !== undefined ? techCtx.technicalNotes : bodyRecord.technicalNotes;
    if (notes !== undefined && notes !== null && notes !== "") {
      if (typeof notes !== "string") {
        errors.push({ field: "technicalNotes", message: "Technical notes must be a string." });
      }
    }

    // Documents (can be in technicalContext or at root)
    const docs = techCtx.documents !== undefined ? techCtx.documents : bodyRecord.documents;
    if (docs !== undefined && docs !== null) {
      if (!Array.isArray(docs)) {
        errors.push({ field: "documents", message: "Documents must be an array." });
      } else {
        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
            errors.push({ field: `documents[${i}]`, message: "Each document must be an object." });
          } else {
            const name = doc.name;
            const size = doc.size;
            const path = doc.path;
            if (typeof name !== "string" || !name) {
              errors.push({ field: `documents[${i}].name`, message: "Document name is required." });
            }
            if (typeof path !== "string" || !path) {
              errors.push({ field: `documents[${i}].path`, message: "Document path is required." });
            }
            if (typeof size === "number" && size > 10 * 1024 * 1024) {
              errors.push({ field: `documents[${i}].size`, message: "Document size must not exceed 10MB." });
            }
            const ext = name ? name.split('.').pop()?.toLowerCase() : '';
            const allowedExts = ["md", "pdf", "txt", "doc", "docx"];
            if (ext && !allowedExts.includes(ext)) {
              errors.push({ field: `documents[${i}].name`, message: `Unsupported file format: .${ext}. Only MD, PDF, TXT, DOC, DOCX are supported.` });
            }
          }
        }
      }
    }

    // Architecture Files
    const archFiles = data.architecture_files;
    if (archFiles !== undefined && archFiles !== null) {
      if (!Array.isArray(archFiles)) {
        errors.push({ field: "architecture_files", message: "Architecture files must be an array." });
      } else {
        for (let i = 0; i < archFiles.length; i++) {
          const file = archFiles[i];
          if (!file || typeof file !== "object" || Array.isArray(file)) {
            errors.push({ field: `architectureFiles[${i}]`, message: "Each architecture file must be an object." });
          } else {
            const name = file.name;
            const size = file.size;
            const path = file.path;
            if (typeof name !== "string" || !name) {
              errors.push({ field: `architectureFiles[${i}].name`, message: "Architecture file name is required." });
            }
            if (typeof path !== "string" || !path) {
              errors.push({ field: `architectureFiles[${i}].path`, message: "Architecture file path is required." });
            }
            if (typeof size === "number" && size > 10 * 1024 * 1024) {
              errors.push({ field: `architectureFiles[${i}].size`, message: "Architecture file size must not exceed 10MB." });
            }
            const ext = name ? name.split('.').pop()?.toLowerCase() : '';
            const allowedExts = ["png", "jpg", "jpeg", "pdf", "drawio", "xml", "doc", "docx"];
            if (ext && !allowedExts.includes(ext)) {
              errors.push({ field: `architectureFiles[${i}].name`, message: `Unsupported format: .${ext}. Allowed: PNG, JPG, JPEG, PDF, DRAWIO, XML, DOC, DOCX.` });
            }
          }
        }
      }
    }

    // Cost Evidence Files
    const costFiles = data.cost_files;
    if (costFiles !== undefined && costFiles !== null) {
      if (!Array.isArray(costFiles)) {
        errors.push({ field: "cost_files", message: "Cost evidence files must be an array." });
      } else {
        for (let i = 0; i < costFiles.length; i++) {
          const file = costFiles[i];
          if (!file || typeof file !== "object" || Array.isArray(file)) {
            errors.push({ field: `costEvidenceFiles[${i}]`, message: "Each cost evidence file must be an object." });
          } else {
            const name = file.name;
            const size = file.size;
            const path = file.path;
            if (typeof name !== "string" || !name) {
              errors.push({ field: `costEvidenceFiles[${i}].name`, message: "Cost evidence file name is required." });
            }
            if (typeof path !== "string" || !path) {
              errors.push({ field: `costEvidenceFiles[${i}].path`, message: "Cost evidence file path is required." });
            }
            if (typeof size === "number" && size > 10 * 1024 * 1024) {
              errors.push({ field: `costEvidenceFiles[${i}].size`, message: "Cost evidence file size must not exceed 10MB." });
            }
            const ext = name ? name.split('.').pop()?.toLowerCase() : '';
            const allowedExts = ["csv", "xlsx", "xls", "pdf", "png", "jpg", "jpeg"];
            if (ext && !allowedExts.includes(ext)) {
              errors.push({ field: `costEvidenceFiles[${i}].name`, message: `Unsupported format: .${ext}. Allowed: CSV, XLSX, XLS, PDF, PNG, JPG, JPEG.` });
            }
          }
        }
      }
    }

    // Usage Metrics
    const metrics = data.usage_metrics;
    if (metrics !== undefined && metrics !== null) {
      if (typeof metrics !== "object" || Array.isArray(metrics)) {
        errors.push({ field: "usage_metrics", message: "Usage metrics must be an object." });
      }
    }
  }

  return errors;
}

/** Casts a validated body to FormState (call only after validateSubmission returns []). */

export function castToFormState(data: Record<string, unknown>): FormState {
  const isNested = data.answers && typeof data.answers === "object" && !Array.isArray(data.answers);
  const answersData = (isNested ? (data.answers as Record<string, unknown>) : data) as any;

  const techCtx = ((isNested ? data.technicalContext : null) || {}) as Record<string, any>;
  const aiStack = (techCtx.aiStack || (isNested ? data.aiStack : null) || {}) as Record<string, any>;

  const metrics: Record<string, any> = (isNested ? (data.usageMetrics as Record<string, any> || {}) : {});

  // Merge with INITIAL_FORM_STATE to ensure all fields are present with default values
  const casted: FormState = {
    ...INITIAL_FORM_STATE,
    ai_dependence:      answersData.ai_dependence      as FormState["ai_dependence"],
    monthly_spend_band: answersData.monthly_spend_band as FormState["monthly_spend_band"],
    spend_visibility:   answersData.spend_visibility   as FormState["spend_visibility"],
    unit_economics:     answersData.unit_economics      as FormState["unit_economics"],
    main_pain:          answersData.main_pain           as FormState["main_pain"],
    leakage_pattern:    answersData.leakage_pattern     as FormState["leakage_pattern"],
    optimization_done:  answersData.optimization_done  as FormState["optimization_done"],
    savings_threshold:  answersData.savings_threshold  as FormState["savings_threshold"],
    extra_context:      (answersData.extra_context as string | undefined) ?? "",
    firstname:          (answersData.firstname as string || "").trim(),
    lastname:           (answersData.lastname  as string || "").trim(),
    email:              (answersData.email     as string || "").trim().toLowerCase(),
    company:            (answersData.company   as string || "").trim(),
    job_title:          (answersData.job_title as string || "").trim(),
    ref:                (answersData.ref       as string | undefined) ?? "co-landing",

    website_url:        (techCtx.websiteUrl || (isNested ? data.websiteUrl : null) || answersData.website_url || "") as string,
    ai_providers:       (aiStack.providers || answersData.ai_providers || []) as string[],
    ai_models:          (aiStack.models || answersData.ai_models || "") as string,
    ai_infrastructure:  (aiStack.infrastructure || answersData.ai_infrastructure || []) as string[],
    ai_other:           (aiStack.other || answersData.ai_other || []) as string[],
    technical_notes:    (techCtx.technicalNotes || (isNested ? data.technicalNotes : null) || answersData.technical_notes || "") as string,
    documents:          (techCtx.documents || (isNested ? data.documents : null) || answersData.documents || []) as any[],

    architecture_files: (isNested ? data.architectureFiles : answersData.architecture_files || []) as any[],
    cost_files:         (isNested ? data.costEvidenceFiles : answersData.cost_files || []) as any[],
    usage_metrics: {
      monthly_requests:     String(metrics.monthly_requests ?? answersData.usage_metrics?.monthly_requests ?? ""),
      input_tokens:         String(metrics.input_tokens ?? answersData.usage_metrics?.input_tokens ?? ""),
      output_tokens:        String(metrics.output_tokens ?? answersData.usage_metrics?.output_tokens ?? ""),
      model_distribution:   String(metrics.model_distribution ?? answersData.usage_metrics?.model_distribution ?? ""),
      gpu_hours:            String(metrics.gpu_hours ?? answersData.usage_metrics?.gpu_hours ?? ""),
      latency_requirements: String(metrics.latency_requirements ?? answersData.usage_metrics?.latency_requirements ?? ""),
      user_volume:          String(metrics.user_volume ?? answersData.usage_metrics?.user_volume ?? ""),
    },
  };

  return casted;
}
