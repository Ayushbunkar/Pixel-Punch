import { ApiSubmissionResult } from "./apiClient";

export interface HermesResponse {
  message: string;
  cta?: {
    text: string;
    url: string;
  };
}

export function handleHermesResponse(result: ApiSubmissionResult): HermesResponse {
  if (!result.success || !result.tier) {
    return {
      message: "I could not complete the scan right now. Please try again.",
    };
  }

  const { tier, ctaUrl } = result;

  switch (tier) {
    case 1:
      return {
        message: "Your AI Cost Scan shows high optimization potential.\n\nBased on your profile, a full AI Cost Audit is recommended.",
        cta: ctaUrl ? {
          text: "Book AI Cost Audit",
          url: ctaUrl,
        } : undefined,
      };
    case 2:
      return {
        message: "Your AI setup shows measurable optimization opportunities.\n\nA focused audit can identify savings areas.",
        cta: ctaUrl ? {
          text: "View Your Scorecard",
          url: ctaUrl,
        } : undefined,
      };
    case 3:
      return {
        message: "Your AI usage is still developing.\n\nImproving visibility and measurement will help as usage grows.",
        cta: ctaUrl ? {
          text: "View Your Scorecard",
          url: ctaUrl,
        } : undefined,
      };
    case 4:
      return {
        message: "You are still early in AI adoption.\n\nWe recommend building foundations before optimization.",
        cta: ctaUrl ? {
          text: "View Your Scorecard",
          url: ctaUrl,
        } : undefined,
      };
    default:
      return {
        message: "Thank you for completing the AI Cost Scan.",
        cta: ctaUrl ? {
          text: "View Your Scorecard",
          url: ctaUrl,
        } : undefined,
      };
  }
}
