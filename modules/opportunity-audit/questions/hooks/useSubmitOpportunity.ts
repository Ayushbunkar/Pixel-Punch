"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        // Strip empty optional lead fields to avoid server validation issues
        const payload = { ...state };
        if (!payload.lastname?.trim())     delete (payload as any).lastname;
        if (!payload.company?.trim())      delete (payload as any).company;
        if (!payload.company_size)         delete (payload as any).company_size;
        if (!payload.job_title?.trim())    delete (payload as any).job_title;

        const response = await fetch("/api/opportunity-scan/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        let data: any = null;
        
        // Handle empty response body
        if (response.status === 204) {
          throw new Error("Empty response from server");
        }
        
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          throw new Error("Invalid response from server. Please try again.");
        }

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
        router.push(data.redirectUrl);
        return { success: true, data: data as ScorecardResult };
      } catch (err: any) {
        const msg = err.message || "An unexpected error occurred.";
        setError(msg);
        console.error("Submit error:", err);
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
