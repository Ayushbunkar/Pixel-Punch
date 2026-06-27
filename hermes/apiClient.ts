import { FormState } from "@/modules/cost-audit/types";

export interface ApiSubmissionResult {
  success: boolean;
  tier?: number;
  scorecard?: {
    spend: "green" | "yellow" | "red";
    architecture: "green" | "yellow" | "red";
    pain: "green" | "yellow" | "red";
  };
  insights?: string[];
  ctaUrl?: string;
  error?: string;
}

export async function submitHermesScan(
  data: Partial<FormState>,
  signatureSecret?: string,
): Promise<ApiSubmissionResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Note: In a real environment, HMAC signature generation for Hermes server-to-server 
    // communication would happen here if signatureSecret is provided and if this 
    // code runs on the server (e.g. Node.js environment).
    // For client-side, we would not have the secret. We'll leave the header logic
    // flexible depending on how Hermes is deployed (server vs client).

    const response = await fetch("/api/cost-scan/submit", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.error || "Submission failed",
      };
    }

    const result = await response.json();
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
