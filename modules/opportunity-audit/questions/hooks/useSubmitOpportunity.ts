"use client";

import { useState, useCallback } from "react";
import type { FormState, ScorecardResult, ValidationErrors } from "../../types";

interface SubmitResult {
  success: boolean;
  data?: ScorecardResult;
  errors?: ValidationErrors;
  message?: string;
}

interface UseSubmitOpportunityReturn {
  submit: (
    state: FormState,
    validateAll: () => ValidationErrors
  ) => Promise<SubmitResult>;
  loading: boolean;
  error: string | null;
}

export function useSubmitOpportunity(): UseSubmitOpportunityReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      state: FormState,
      validateAll: () => ValidationErrors
    ): Promise<SubmitResult> => {
      setLoading(true);
      setError(null);

      // 1. Client side validation check
      const clientErrors = validateAll();
      if (Object.keys(clientErrors).length > 0) {
        setLoading(false);
        return { success: false, errors: clientErrors };
      }

      // 2. Network POST request
      try {
        const response = await fetch("/api/opportunity-scan/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state),
        });

        const data = await response.json();

        if (!response.ok) {
          // If server validation failed
          if (data.errors && Array.isArray(data.errors)) {
            const mappedErrors: ValidationErrors = {};
            data.errors.forEach((err: { field: string; message: string }) => {
              mappedErrors[err.field as keyof FormState] = err.message;
            });
            setLoading(false);
            return { success: false, errors: mappedErrors };
          }
          throw new Error(data.error || "Submission failed. Please try again.");
        }

        setLoading(false);
        return { success: true, data: data as ScorecardResult };
      } catch (err: any) {
        const msg = err.message || "An unexpected error occurred.";
        setError(msg);
        setLoading(false);
        return { success: false, message: msg };
      }
    },
    []
  );

  return {
    submit,
    loading,
    error,
  };
}
