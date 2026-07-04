import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { submissionCache as costCache } from "../../cost-scan/submit/route";
import { StoredScanResult, Rag } from "@/modules/cost-audit/types";

import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { submissionCache as costCache } from "../../cost-scan/submit/route";
import { StoredScanResult, Rag } from "@/modules/cost-audit/types";

const mockSubmission: StoredScanResult = {
  submissionId: "mock-id-123",
  scorecard: {
    spend: "amber",
    architecture: "red",
    pain: "green",
  },
  tier: 2,
  insights: [
    "Mock Insight 1: Optimize your cloud spend by reviewing idle resources.",
    "Mock Insight 2: Refactor high-cost architectural components.",
    "Mock Insight 3: Leverage serverless functions for bursty workloads.",
  ],
  ctaUrl: "https://pixelpunch.org/contact",
  auditReport: "## Mock Audit Report\n\nThis is a **mock audit report** generated to display content. The actual report would contain detailed findings and recommendations based on your AI cost audit.\n\n### Key Areas of Focus\n\n*   **Cloud Spend Optimization:** Identify and eliminate unnecessary cloud expenditures.\n*   **Architectural Efficiency:** Streamline your AI infrastructure for better cost-performance.\n*   **Operational Cost Reduction:** Implement strategies to reduce the overall operational burden.\n\n---\n\n**Disclaimer:** This report contains mock data and should not be used for real-world decisions.",
  findings: [
    "Mock Finding 1: High egress costs identified in data transfer patterns.",
    "Mock Finding 2: Underutilized GPU instances running 24/7.",
  ],
  recommendations: [
    "Mock Recommendation 1: Implement data compression for cross-region transfers.",
    "Mock Recommendation 2: Schedule GPU instances to scale down during off-peak hours.",
  ],
  confidenceScore: "75%",
  architectureAnalysis: {
    summary: "Mock architecture analysis summary.",
    findings: ["Mock arch finding 1"],
    risks: ["Mock arch risk 1"],
  },
  costAnalysis: {
    summary: "Mock cost analysis summary.",
    normalizedData: {
      monthlySpend: "$15,000",
      provider: "AWS",
    },
  },
  contact: {
    firstname: "Mock",
    lastname: "User",
    email: "mock.user@example.com",
    company: "Mock Solutions",
  },
};

export async function GET(req: NextRequest) {
  try {
    const submissionId = req.nextUrl.searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submission ID." },
        { status: 400 }
      );
    }

    let submission = await getSubmission(submissionId);
    if (!submission) {
      // Check cache if not found in DB
      submission = costCache.get(submissionId) ?? null;
    }

    if (!submission) {
      console.warn(`[api/cost-audit/results] Submission ID ${submissionId} not found in DB or cache. Returning mock data.`);
      return NextResponse.json(mockSubmission, { status: 200 });
    }

    // Ensure the returned data is of type StoredScanResult if needed by the frontend
    // For now, return the raw submission which should match StoredScanResult structure
    return NextResponse.json(submission, { status: 200 });

  } catch (error: any) {
    console.error("[api/cost-audit/results] Unexpected error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
