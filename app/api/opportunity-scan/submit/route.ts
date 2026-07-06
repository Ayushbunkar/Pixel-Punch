import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateSubmission, castToFormState } from "@/modules/opportunity-audit/utils/server-validation";
import { runScoringEngine } from "@/modules/opportunity-audit/scoring/opportunity-score-engine";
import { qualifyLead } from "@/modules/opportunity-audit/scoring/opportunity-lead-qualifier";
import { generateAIRecommendations } from "@/modules/opportunity-audit/scoring/opportunity-recommendation-engine";
import { generateOpportunityReport } from "@/modules/opportunity-audit/scoring/opportunity-report-generator";
import { saveSubmission } from "@/shared/database/db.service";

// ── Helper: Remove duplicate recommendations ───────────────────────────────────
function deduplicateRecommendations(recommendations: string[]): string[] {
  const seen = new Set<string>();
  return recommendations.filter((rec) => {
    const normalized = rec.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// In-memory submission cache

// In-memory rate limiting (5 requests per minute per IP)
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT    = { maxRequests: 5, windowMs: 60_000 };

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now    = Date.now();
  const record = ipSubmissions.get(ip);

  if (!record || now > record.resetAt) {
    ipSubmissions.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  record.count++;
  return { allowed: true };
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  console.log("[Opportunity Submit API] Received request");
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    console.log("[Opportunity Submit API] Rate limited.");
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status:  429,
        headers: { "Retry-After": String(rateCheck.retryAfter) },
      },
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
    console.log("[Opportunity Submit API] Body parsed.");
  } catch {
    console.error("[Opportunity Submit API] Failed to parse JSON body.");
    return NextResponse.json(
      { errors: [{ field: "_root", message: "Request body must be valid JSON." }] },
      { status: 400 },
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const validationErrors = validateSubmission(body);
  if (validationErrors.length > 0) {
    console.log("[Opportunity Submit API] Validation failed.", validationErrors);
    return NextResponse.json({ errors: validationErrors }, { status: 400 });
  }
  console.log("[Opportunity Submit API] Validation passed.");

  // ── Cast inputs ────────────────────────────────────────────────────────────
  const input = castToFormState(body as Record<string, any>);
  const submissionId = randomUUID();
  console.log(`[Opportunity Submit API] Generated ID: ${submissionId}`);

  // ── Run scoring ────────────────────────────────────────────────────────────
  try {
    const results = runScoringEngine(input, submissionId);
    console.log("[Opportunity Submit API] Generated report");

    // ── AI Recommendations and Report Generation ──────────────────────────────
    const aiRecommendations = await generateAIRecommendations(input, results.categories);
    const reportResult = await generateOpportunityReport(input, results.categories, aiRecommendations);
    console.log("[Opportunity Submit API] AI Recommendations and Report Generated.");

    // ── Lead Qualification Logic ───────────────────────────────────────────────
    const leadResult = qualifyLead(input, submissionId);
    console.log("[Opportunity Submit API] Lead Qualified.");

    // ── Model mapping (Database Schema representation) ─────────────────────────
    const dbPayload = {
      submissionId,
      createdDate: results.createdDate,
      auditStatus: results.auditStatus,
      company: {
        name: input.company,
        industry: input.business_type, // primary industry categorization
        size: input.company_size,
        businessType: input.business_type,
      },
      contact: {
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        job_title: input.job_title,
      },
      // Audit information
      questions: {
        business_type: "What best describes your business?",
        main_outcome: "What is the main outcome you want to improve right now?",
        biggest_challenge: "What is the biggest operational challenge you are facing today?",
        data_systems: "Where does your core customer or operational data live?",
        automation_barriers: "What is currently preventing workflows from becoming more automated?",
        workflow_standardization: "How standardized are your core workflows?",
        manual_processes: "Which processes still require significant manual effort?",
        info_retrieval: "How do employees currently find information they need to do their jobs?",
        systems_connection: "How connected are your systems today?",
        data_quality: "How would you describe the quality of your data?",
        inquiry_handling: "How do you currently handle customer or internal inquiries?",
        request_types: "What is the most common support or communication request?",
        lead_qualification: "How are leads currently qualified?",
        desired_use_case: "Which AI use case would create the most value for you right now?",
        adoption_blocker: "What has prevented you from adopting AI faster?",
      },
      answers: {
        business_type: input.business_type,
        main_outcome: input.main_outcome,
        biggest_challenge: input.biggest_challenge,
        data_systems: input.data_systems,
        automation_barriers: input.automation_barriers,
        workflow_standardization: input.workflow_standardization,
        manual_processes: input.manual_processes,
        info_retrieval: input.info_retrieval,
        systems_connection: input.systems_connection,
        data_quality: input.data_quality,
        inquiry_handling: input.inquiry_handling,
        request_types: input.request_types,
        lead_qualification: input.lead_qualification,
        desired_use_case: input.desired_use_case,
        adoption_blocker: input.adoption_blocker,
        extra_context: input.extra_context,
        ref: input.ref,
      },
      score: {
        readiness: results.scorecard.readiness,
        value: results.scorecard.value,
        opportunity: results.scorecard.opportunity,
        tier: results.tier,
        categories: results.categories,
      },
      // Alias for component compatibility (component reads data.scorecard)
      scorecard: {
        readiness: results.scorecard.readiness,
        value: results.scorecard.value,
        opportunity: results.scorecard.opportunity,
      },
      tier: results.tier,
      insights: [], // Added placeholder
      ctaUrl: "", // Added placeholder
      confidenceScore: "", // Added placeholder
      architectureAnalysis: { summary: "", findings: [], risks: [] }, // Added placeholder
      costAnalysis: { summary: "", normalizedData: {} }, // Added placeholder
      recommendations: deduplicateRecommendations(aiRecommendations.map(r => r.opportunity)), // Deduplicated recommendations
      roadmap: results.roadmap,
      auditReport: reportResult.reportText,
      findings: deduplicateRecommendations(reportResult.findings || []),
      nextSteps: deduplicateRecommendations(reportResult.nextSteps || []),
      leadQualification: leadResult,
    };

    // ── Database persistence ───────────────────────────────────────────────────
    try {
      await saveSubmission(submissionId, dbPayload);
      console.log(`[Opportunity Submit API] Saved to Supabase: ${submissionId}`);
    } catch (err) {
      console.error("[submit] Failed to save submission to JSON database:", err);
    }

    return NextResponse.json(
      { success: true, submissionId, redirectUrl: `/result?id=${submissionId}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Opportunity Submit API] Unhandled error during processing:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
