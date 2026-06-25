import { NextRequest, NextResponse } from "next/server";
import { randomUUID }                from "crypto";
import { validateSubmission, castToFormState } from "@/features/cost-scan/utils/server-validation";
import { runScoring, getCTAUrl }              from "@/services/scoring.service";
import { generateInsights }                   from "@/services/insight.service";
import { syncToBrevo }                        from "@/services/brevo.service";

// ── In-memory submission cache (Fallback for GET /api/cost-scan/result) ──────
export const submissionCache = new Map<string, any>();

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
  const input = castToFormState(body as Record<string, unknown>);

  // ── Scoring (pure, deterministic, never fails) ────────────────────────────
  const scores = runScoring(input);

  // ── Insight generation (rule-based, never fails) ──────────────────────────
  const insights = generateInsights(input, scores, scores.tier);

  // ── Submission ID ──────────────────────────────────────────────────────────
  const submissionId = randomUUID();

  // ── CTA URL ────────────────────────────────────────────────────────────────
  const ctaUrl = getCTAUrl(scores.tier);

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
  };

  // Cache for GET fallback
  submissionCache.set(submissionId, responseBody);

  return NextResponse.json(responseBody, { status: 200 });
}

// ── Only POST is allowed ───────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
