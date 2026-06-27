"use client";

import { useState, useCallback } from "react";
import { FormState, ScorecardResult, StoredScanResult, ValidationErrors } from "@/modules/cost-audit/types";

interface SubmitResult {
  success: boolean;
  data?: ScorecardResult;
  errors?: ValidationErrors;
  message?: string;
}

interface UseSubmitScanReturn {
  submit:    (state: FormState, validateAll: () => ValidationErrors) => Promise<SubmitResult>;
  loading:   boolean;
  error:     string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook — handles POST /api/cost-scan/submit
// Stores result in sessionStorage for results page fallback.
// Frontend never computes tier, scores, or insights.
// ─────────────────────────────────────────────────────────────────────────────
export function useSubmitScan(): UseSubmitScanReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const submit = useCallback(
    async (state: FormState, validateAll: () => ValidationErrors): Promise<SubmitResult> => {
      // ── Client-side pre-flight validation ──────────────────────────────
      const validationErrors = validateAll();
      if (Object.keys(validationErrors).length > 0) {
        return { success: false, errors: validationErrors };
      }

      setLoading(true);
      setError(null);

      try {
        const answers: Record<string, unknown> = {
          ai_dependence:      state.ai_dependence,
          monthly_spend_band: state.monthly_spend_band,
          spend_visibility:   state.spend_visibility,
          unit_economics:     state.unit_economics,
          main_pain:          state.main_pain,
          leakage_pattern:    state.leakage_pattern,
          optimization_done:  state.optimization_done,
          savings_threshold:  state.savings_threshold,
          firstname:          state.firstname.trim(),
          lastname:           state.lastname.trim(),
          email:              state.email.trim().toLowerCase(),
          company:            state.company.trim(),
          job_title:          state.job_title.trim(),
          ref:                state.ref ?? "co-landing",
        };

        // Include extra_context only if non-empty
        if (state.extra_context && state.extra_context.trim().length > 0) {
          answers.extra_context = state.extra_context.trim();
        }

        // Attach UTM params from window.location if available
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(
            (k) => { if (sp.has(k)) answers[k] = sp.get(k); },
          );
        }

        const payload = {
          answers,
          technicalContext: {
            websiteUrl:     state.website_url ? state.website_url.trim() : "",
            aiStack: {
              providers:      state.ai_providers || [],
              models:         state.ai_models ? state.ai_models.trim() : "",
              infrastructure: state.ai_infrastructure || [],
              other:          state.ai_other || [],
            },
            technicalNotes: state.technical_notes ? state.technical_notes.trim() : "",
            documents:      state.documents || [],
          },
          architectureFiles: state.architecture_files || [],
          costEvidenceFiles: state.cost_files || [],
          usageMetrics: {
            monthly_requests:     state.usage_metrics.monthly_requests ? Number(state.usage_metrics.monthly_requests) || 0 : undefined,
            input_tokens:         state.usage_metrics.input_tokens ? Number(state.usage_metrics.input_tokens) || 0 : undefined,
            output_tokens:        state.usage_metrics.output_tokens ? Number(state.usage_metrics.output_tokens) || 0 : undefined,
            model_distribution:   state.usage_metrics.model_distribution ? state.usage_metrics.model_distribution.trim() : "",
            gpu_hours:            state.usage_metrics.gpu_hours ? Number(state.usage_metrics.gpu_hours) || 0 : undefined,
            latency_requirements: state.usage_metrics.latency_requirements ? state.usage_metrics.latency_requirements.trim() : "",
            user_volume:          state.usage_metrics.user_volume ? Number(state.usage_metrics.user_volume) || 0 : undefined,
          },
        };

        // ── POST to backend ───────────────────────────────────────────────
        const res = await fetch("/api/cost-scan/submit", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });

        // ── Handle 4xx validation errors from server ──────────────────────
        if (res.status === 400) {
          const body = await res.json();
          return {
            success: false,
            errors:  body.errors ?? {},
            message: "Please check your answers and try again.",
          };
        }

        // ── Handle 429 rate limiting ──────────────────────────────────────
        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after") ?? "60";
          return {
            success: false,
            message: `Too many submissions. Please try again in ${retryAfter} seconds.`,
          };
        }

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        // ── Parse scorecard response ──────────────────────────────────────
        const data: ScorecardResult = await res.json();

        // ── Persist to sessionStorage for results page ─────────────────────
        // Results page reads this if direct navigation occurs after redirect.
        const stored: StoredScanResult = {
          ...data,
          contact: {
            firstname: state.firstname.trim(),
            lastname:  state.lastname.trim(),
            email:     state.email.trim().toLowerCase(),
            company:   state.company.trim(),
          },
        };
        try {
          sessionStorage.setItem("cost_scan_result", JSON.stringify(stored));
        } catch {
          // sessionStorage may be unavailable (incognito quota, etc.) — non-fatal
        }

        return { success: true, data };
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { submit, loading, error };
}
