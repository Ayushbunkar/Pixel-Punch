import { NextRequest, NextResponse } from "next/server";
import { randomUUID }                from "crypto";
import { validateSubmission, castToFormState } from "@/modules/cost-audit/utils/server-validation";
import { runScoring, getCTAUrl }              from "@/modules/cost-audit/scoring/cost-score-service";
import { generateInsights }                   from "@/modules/cost-audit/utils/insight.service";
import { syncToBrevo }                        from "@/shared/utils/brevo.service";
import { generateAuditReport }                from "@/shared/utils/audit.service";
import { getSubmission, saveSubmission }                     from "@/shared/database/db.service";
import { calculateConfidenceScore, analyzeArchitecture, analyzeCostEvidence, analyzeUsageMetrics } from "@/shared/utils/medium-analysis.service";
import { FormState, INITIAL_FORM_STATE } from "@/modules/cost-audit/types";
import {
  NotificationService,
  EmailNotificationProvider,
  TelegramNotificationProvider,
} from "@/shared/services/notification.service";

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
    const body = await req.json();

    let castedInput: FormState = INITIAL_FORM_STATE; // Initialize with default
    let submissionIdFromDb: string | undefined;

    // If submissionId and email are present, but not full form data, retrieve from DB
    if (body.submissionId && body.email && !body.ai_dependence) {
          console.log(`[Cost Submit API] Attempting to retrieve submission for ID: ${body.submissionId}`);
          const submission = await getSubmission(body.submissionId);

          if (!submission) {
            console.error(`[Cost Submit API] Submission with ID ${body.submissionId} not found or could not be retrieved.`);
            return NextResponse.json({ error: "Submission not found." }, { status: 404 });
          }
      castedInput = castToFormState(submission);
      castedInput.email = body.email; // Update email from modal
      submissionIdFromDb = body.submissionId;
    } else {
      const reconstructedInput: FormState = {
        ...INITIAL_FORM_STATE,
        ...body,
        documents: body.documents || [],
        architecture_files: body.architecture_files || [],
        cost_files: body.cost_files || [],
      };

      // ── Validation (HARD FAIL) ─────────────────────────────────────────────────
      const validationErrors = validateSubmission(reconstructedInput);
      if (validationErrors.length > 0) {
        return NextResponse.json({ errors: validationErrors }, { status: 400 });
      }

      // ── Cast to typed FormState ────────────────────────────────────────────────
      const bodyRecord = reconstructedInput as Record<string, any>;
      castedInput = castToFormState(bodyRecord);
    }

    // ── Technical audit parameters ─────────────────────────────────────────────
    const websiteUrl     = castedInput.website_url;
    const aiStack        = {
      providers:      castedInput.ai_providers,
      models:         castedInput.ai_models,
      infrastructure: castedInput.ai_infrastructure,
      other:          castedInput.ai_other,
    };
    const technicalNotes = castedInput.technical_notes;
    const usageMetricsInput = castedInput.usage_metrics || {};

    // ── Extract file texts (parallel, non-blocking errors) ─────────────────────

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
      const hasDocuments = castedInput.documents.length > 0;
      const hasArchitecture = castedInput.architecture_files.length > 0;
      const hasCostEvidence = castedInput.cost_files.length > 0;

      const conf = calculateConfidenceScore({
        hasWebsite,
        hasAiStack,
        hasDocuments,
        hasArchitecture,
        hasCostEvidence,
      });
      confidenceScore = `${conf.score}%`;

      archAnalysis = await analyzeArchitecture(castedInput.architecture_files, castedInput, websiteUrl, aiStack);
      costAnalysis = await analyzeCostEvidence(castedInput.cost_files, castedInput);
      usageAnalysis = analyzeUsageMetrics(usageMetricsInput, costAnalysis.normalizedData);
    } catch (err) {
      console.error("[submit] Error running medium upgrades analysis:", err);
    }

    // ── Scoring (pure, deterministic, never fails) ────────────────────────────
    const scores = runScoring(castedInput);

    // ── Insight generation (rule-based, never fails) ──────────────────────────
    const insights = generateInsights(castedInput, scores, scores.tier);

    // ── Submission ID ──────────────────────────────────────────────────────────
    const submissionId = submissionIdFromDb || randomUUID();
    console.log(`[Cost Submit API] Generated ID: ${submissionId}`);

    // ── CTA URL ────────────────────────────────────────────────────────────────
    const ctaUrl = getCTAUrl(scores.tier);

    // ── Generate AI Audit Report ───────────────────────────────────────────────
    let auditResult = { auditReport: "", findings: [] as string[], recommendations: [] as string[] };
    try {
      auditResult = await generateAuditReport({
        answers: castedInput,
        scores: {
          spend: scores.spend,
          architecture: scores.architecture,
          pain: scores.pain,
          tier: scores.tier,
        },
        websiteUrl: websiteUrl || "",
        aiStack,
        technicalNotes: technicalNotes || "",
        files: castedInput.documents,
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
        input: castedInput,
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
        firstname: castedInput.firstname,
        lastname:  castedInput.lastname,
        email:     castedInput.email,
        company:   castedInput.company,
      },
    };

    // ── Save to File Database & Cache for GET fallback ─────────────────────────
    try {
      const dbPayload = {
        ...responseBody,
        website_url:             websiteUrl || "",
        ai_stack_details:        aiStack || {},
        technical_notes:         technicalNotes || "",
        uploaded_documents:      castedInput.documents.map((doc: any) => ({ name: doc.name, size: doc.size, type: doc.type, path: doc.path })),
        generated_report:        auditResult.auditReport,
        architecture_files:      castedInput.architecture_files.map((f: any) => ({ name: f.name, size: f.size, type: f.type, path: f.path })),
        architecture_analysis:   archAnalysis,
        cost_files:              castedInput.cost_files.map((f: any) => ({ name: f.name, size: f.size, type: f.type, path: f.path })),
        cost_analysis:           costAnalysis,
        usage_metrics:           usageMetricsInput,
        confidence_score:        confidenceScore,
        audit_findings:          auditResult.findings,
        // The following fields are removed as per the new architecture
        // extracted_document_text: filesContent.map(f => ({ name: f.name, content: f.content })),
        // ai_audit_context:        auditResult.auditReport,
      };
      await saveSubmission(submissionId, dbPayload);
      console.log(`[Cost Submit API] Saved to Supabase: ${submissionId}`);
    } catch (err) {
      console.error("[submit] Failed to save submission to database:", err);
    }

    // ── Notifications (NON-BLOCKING) ───────────────────────────────────────────
    const notificationService = new NotificationService([
      new EmailNotificationProvider(),
      new TelegramNotificationProvider(),
    ]);

    const userEmail = castedInput.email;
    const teamEmail = process.env.TEAM_EMAIL_ADDRESS;
    const telegramChatIdTeam = process.env.TELEGRAM_CHAT_ID_TEAM;

    // Send user email
    console.log(`[Cost Submit API] User email: ${userEmail}`);
    if (userEmail) {
      notificationService.sendNotification("user_email", {
        submissionId,
        email: userEmail,
        scanType: "cost",
        recipientName: `${castedInput.firstname} ${castedInput.lastname}`,
      }).then(res => console.log("[Cost Submit API] User email notification result:", res))
        .catch(err => console.error("[Cost Submit API] Error sending user email notification:", err));
    }

    // Send team email
    console.log(`[Cost Submit API] Team email: ${teamEmail}`);
    if (teamEmail) {
      notificationService.sendNotification("team_email", {
        submissionId,
        email: teamEmail,
        scanType: "cost",
        recipientName: "Pixel Punch Team",
      }).then(res => console.log("[Cost Submit API] Team email notification result:", res))
        .catch(err => console.error("[Cost Submit API] Error sending team email notification:", err));
    }

    // Send Telegram notification to team
    if (telegramChatIdTeam) {
      const telegramMessage = `New Cost Scan Submission!

Submission ID: ${submissionId}
Company: ${castedInput.company}
Contact: ${castedInput.firstname} ${castedInput.lastname} (${castedInput.email})
Tier: ${scores.tier}

View Report: http://localhost:3000/ai/cost-scan/results?id=${submissionId}`;
      notificationService.sendNotification("telegram_team", {
        message: telegramMessage,
        chatId: telegramChatIdTeam,
      }).then(res => console.log("[Cost Submit API] Telegram notification result:", res))
        .catch(err => console.error("[Cost Submit API] Error sending Telegram notification:", err));
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