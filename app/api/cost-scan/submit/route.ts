import { NextRequest, NextResponse } from "next/server";
import { randomUUID }                from "crypto";
import { validateSubmission, castToFormState } from "@/modules/cost-audit/utils/server-validation";
import { runScoring, getCTAUrl }              from "@/modules/cost-audit/scoring/cost-score-service";
import { generateInsights }                   from "@/modules/cost-audit/utils/insight.service";
import { syncToBrevo }                        from "@/shared/utils/brevo.service";
import { extractTextFromDoc }                 from "@/shared/utils/extractor.service";
import { generateAuditReport }                from "@/shared/utils/audit.service";
import { saveSubmission }                     from "@/shared/database/db.service";
import { calculateConfidenceScore, analyzeArchitecture, analyzeCostEvidence, analyzeUsageMetrics } from "@/shared/utils/medium-analysis.service";

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


// ── Rate-limit state (in-memory, resets on cold start) ────────────────────────
// For production, use Redis / Upstash rate-limiting.
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT    = { maxRequests: 5, windowMs: 60_000 }; // 5 per minute per IP

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

// ── HMAC verification (optional — for Hermes server-to-server calls) ──────────
async function verifyHmacIfPresent(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret    = process.env.COST_SCAN_WEBHOOK_SECRET;
  const signature = req.headers.get("x-cost-scan-signature");

  if (!secret || !signature) return true; // no secret configured → skip

  try {
    const { createHmac } = await import("crypto");
    const expected        = createHmac("sha256", secret).update(rawBody).digest("hex");
    return signature === `sha256=${expected}`;
  } catch {
    return false;
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    console.log("[Cost Submit API] Received request");
    // ── Rate limiting ──────────────────────────────────────────────────────────
    const ip        = getClientIP(req);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status:  429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        },
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let rawBody: string;
    let body:    unknown;

    try {
      rawBody = await req.text();
      body    = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { errors: [{ field: "_root", message: "Request body must be valid JSON." }] },
        { status: 400 },
      );
    }

    // ── HMAC verification (Hermes integration) ────────────────────────────────
    const hmacValid = await verifyHmacIfPresent(req, rawBody);
    if (!hmacValid) {
      return NextResponse.json(
        { errors: [{ field: "_root", message: "Invalid request signature." }] },
        { status: 401 },
      );
    }

    // ── Validation (HARD FAIL) ─────────────────────────────────────────────────
    const validationErrors = validateSubmission(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // ── Cast to typed FormState ────────────────────────────────────────────────
    const bodyRecord = body as Record<string, any>;
    const input = castToFormState(bodyRecord);

    // ── Technical audit parameters ─────────────────────────────────────────────
    const websiteUrl     = input.website_url;
    const aiStack        = {
      providers:      input.ai_providers,
      models:         input.ai_models,
      infrastructure: input.ai_infrastructure,
      other:          input.ai_other,
    };
    const technicalNotes = input.technical_notes;
    const documents      = input.documents;
    const architectureFiles = input.architecture_files;
    const costEvidenceFiles = input.cost_files;
    const usageMetricsInput = bodyRecord.usageMetrics || {};

    // ── Extract file texts (parallel, non-blocking errors) ─────────────────────
    let filesContent: Array<{ name: string; content: string }> = [];
    try {
      filesContent = await Promise.all(
        documents.map(async (doc) => {
          try {
            const content = await extractTextFromDoc(doc);
            return { name: doc.name, content };
          } catch (err) {
            console.error(`[submit] Error extracting text from ${doc.name}:`, err);
            return { name: doc.name, content: `Error: failed to extract text from document.` };
          }
        })
      );
    } catch (err) {
      console.error("[submit] Failed processing documents:", err);
    }

    // ── Medium upgrades analysis ───────────────────────────────────────────────
    let archAnalysis = { summary: "No architecture diagrams were provided.", findings: [] as string[], risks: [] as string[] };
    let costAnalysis = { summary: "No invoice or usage evidence was supplied.", normalizedData: {} as any };
    let usageAnalysis: {
      costPerRequest?: string;
      costPerUser?: string;
      modelEfficiency: string;
      optimizationAreas: string[];
    } = { modelEfficiency: "Medium", optimizationAreas: [] };
    let confidenceScore = "20%";

    try {
      const hasWebsite = !!websiteUrl;
      const hasAiStack = aiStack.providers.length > 0 || !!aiStack.models;
      const hasDocuments = documents.length > 0;
      const hasArchitecture = architectureFiles.length > 0;
      const hasCostEvidence = costEvidenceFiles.length > 0;

      const conf = calculateConfidenceScore({
        hasWebsite,
        hasAiStack,
        hasDocuments,
        hasArchitecture,
        hasCostEvidence,
      });
      confidenceScore = `${conf.score}%`;

      archAnalysis = await analyzeArchitecture(architectureFiles, input, websiteUrl, aiStack);
      costAnalysis = await analyzeCostEvidence(costEvidenceFiles, input);
      usageAnalysis = analyzeUsageMetrics(usageMetricsInput, costAnalysis.normalizedData);
    } catch (err) {
      console.error("[submit] Error running medium upgrades analysis:", err);
    }

    // ── Scoring (pure, deterministic, never fails) ────────────────────────────
    const scores = runScoring(input);

    // ── Insight generation (rule-based, never fails) ──────────────────────────
    const insights = generateInsights(input, scores, scores.tier);

    // ── Submission ID ──────────────────────────────────────────────────────────
    const submissionId = randomUUID();
    console.log(`[Cost Submit API] Generated ID: ${submissionId}`);

    // ── CTA URL ────────────────────────────────────────────────────────────────
    const ctaUrl = getCTAUrl(scores.tier);

    // ── Generate AI Audit Report ───────────────────────────────────────────────
    let auditResult = { auditReport: "", findings: [] as string[], recommendations: [] as string[] };
    try {
      auditResult = await generateAuditReport({
        answers: input,
        scores: {
          spend: scores.spend,
          architecture: scores.architecture,
          pain: scores.pain,
          tier: scores.tier,
        },
        websiteUrl: websiteUrl || "",
        aiStack,
        technicalNotes: technicalNotes || "",
        files: filesContent,
        architectureAnalysis: archAnalysis,
        costAnalysis: costAnalysis,
        usageMetrics: usageAnalysis,
        confidenceScore: confidenceScore,
      });
      console.log("[Cost Submit API] Generated report");
    } catch (err) {
      console.error("[submit] Error generating audit report:", err);
    }

    // ── Brevo sync (NON-BLOCKING — failure must not affect response) ───────────
    // Fire-and-forget: we intentionally do not await the sync.
    // The response is built and returned immediately.
    Promise.resolve().then(() =>
      syncToBrevo({
        input,
        scores: {
          spend:        scores.spend,
          architecture: scores.architecture,
          pain:         scores.pain,
        },
        tier:         scores.tier,
        insights,
        submissionId,
      }).catch((err) => {
        // Last-resort catch — syncToBrevo should never throw, but just in case
        console.error("[submit] Unexpected Brevo sync error:", err);
      }),
    );

    // ── Build response ─────────────────────────────────────────────────────────
    const responseBody = {
      submissionId,
      scorecard: {
        spend:        scores.spend,
        architecture: scores.architecture,
        pain:         scores.pain,
      },
      tier:     scores.tier,
      insights,
      ctaUrl,
      auditReport:     auditResult.auditReport,
      findings:        deduplicateRecommendations(auditResult.findings),
      recommendations: deduplicateRecommendations(auditResult.recommendations),
      confidenceScore,
      architectureAnalysis: archAnalysis,
      costAnalysis: costAnalysis,
      contact: {
        firstname: input.firstname,
        lastname:  input.lastname,
        email:     input.email,
        company:   input.company,
      },
    };

    // ── Save to File Database & Cache for GET fallback ─────────────────────────
    try {
      const dbPayload = {
        ...responseBody,
        website_url:             websiteUrl || "",
        ai_stack_details:        aiStack || {},
        technical_notes:         technicalNotes || "",
        uploaded_documents:      documents.map((doc: any) => ({ name: doc.name, size: doc.size, type: doc.type })),
        extracted_document_text: filesContent.map((f) => f.content).join("\n\n"),
        ai_audit_context:        `Website: ${websiteUrl || "none"}\nAI Stack: ${JSON.stringify(aiStack)}\nNotes: ${technicalNotes || "none"}\nFiles: ${filesContent.map((f) => f.name).join(", ")}`,
        generated_report:        auditResult.auditReport,
        architecture_files:      architectureFiles.map((f: any) => ({ name: f.name, size: f.size, type: f.type })),
        architecture_analysis:   archAnalysis,
        cost_files:              costEvidenceFiles.map((f: any) => ({ name: f.name, size: f.size, type: f.type })),
        cost_analysis:           costAnalysis,
        usage_metrics:           usageMetricsInput,
        confidence_score:        confidenceScore,
        audit_findings:          auditResult.findings,
      };
      await saveSubmission(submissionId, dbPayload);
      console.log(`[Cost Submit API] Saved to Supabase: ${submissionId}`);
    } catch (err) {
      console.error("[submit] Failed to save submission to database:", err);
    }

    return NextResponse.json(
      { success: true, submissionId, redirectUrl: `/ai/cost-scan/results?id=${submissionId}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cost Submit API] Unhandled error during processing:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}