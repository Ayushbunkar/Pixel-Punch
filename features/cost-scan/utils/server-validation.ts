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
} from "@/features/cost-scan/types";
import type { FormState } from "@/features/cost-scan/types";

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
  stringField("firstname", "First name", { maxLength: 100 });
  stringField("lastname",  "Last name",  { maxLength: 100 });
  stringField("email",     "Email",      { maxLength: 254, format: "email" });
  stringField("company",   "Company",    { maxLength: 200 });
  stringField("job_title", "Job title",  { maxLength: 150 });

  // ── Technical audit fields validation (if nested payload) ─────────────────
  if (hasAnswers) {
    const url = bodyRecord.websiteUrl;
    if (url !== undefined && url !== null && url !== "") {
      if (typeof url !== "string") {
        errors.push({ field: "websiteUrl", message: "Website URL must be a string." });
      } else {
        const trimmed = url.trim();
        // Regex supporting http/https and optional trailing slashes/paths
        if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
          errors.push({ field: "websiteUrl", message: "Please enter a valid website URL." });
        }
      }
    }

    const aiStack = bodyRecord.aiStack;
    if (aiStack !== undefined && aiStack !== null) {
      if (typeof aiStack !== "object" || Array.isArray(aiStack)) {
        errors.push({ field: "aiStack", message: "AI Stack details must be a JSON object." });
      }
    }

    const notes = bodyRecord.technicalNotes;
    if (notes !== undefined && notes !== null && notes !== "") {
      if (typeof notes !== "string") {
        errors.push({ field: "technicalNotes", message: "Technical notes must be a string." });
      }
    }

    const docs = bodyRecord.documents;
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
            const base64 = doc.base64;
            if (typeof name !== "string" || !name) {
              errors.push({ field: `documents[${i}].name`, message: "Document name is required." });
            }
            if (typeof base64 !== "string" || !base64) {
              errors.push({ field: `documents[${i}].base64`, message: "Document base64 content is required." });
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
  }

  return errors;
}

/** Casts a validated body to FormState (call only after validateSubmission returns []). */
export function castToFormState(data: Record<string, unknown>): FormState {
  return {
    ai_dependence:      data.ai_dependence      as FormState["ai_dependence"],
    monthly_spend_band: data.monthly_spend_band as FormState["monthly_spend_band"],
    spend_visibility:   data.spend_visibility   as FormState["spend_visibility"],
    unit_economics:     data.unit_economics      as FormState["unit_economics"],
    main_pain:          data.main_pain           as FormState["main_pain"],
    leakage_pattern:    data.leakage_pattern     as FormState["leakage_pattern"],
    optimization_done:  data.optimization_done  as FormState["optimization_done"],
    savings_threshold:  data.savings_threshold  as FormState["savings_threshold"],
    extra_context:      (data.extra_context as string | undefined) ?? "",
    firstname:          (data.firstname as string).trim(),
    lastname:           (data.lastname  as string).trim(),
    email:              (data.email     as string).trim().toLowerCase(),
    company:            (data.company   as string).trim(),
    job_title:          (data.job_title as string).trim(),
    ref:                (data.ref       as string | undefined) ?? "co-landing",

    website_url:        (data.website_url as string | undefined) ?? "",
    ai_providers:       (data.ai_providers as string[] | undefined) ?? [],
    ai_models:          (data.ai_models as string | undefined) ?? "",
    ai_infrastructure:  (data.ai_infrastructure as string[] | undefined) ?? [],
    ai_other:           (data.ai_other as string[] | undefined) ?? [],
    technical_notes:    (data.technical_notes as string | undefined) ?? "",
    documents:          (data.documents as FormState["documents"] | undefined) ?? [],
  };
}
