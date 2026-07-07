// =============================================================================
// Brevo Service — isolated side-effect layer for CRM sync
// All Brevo I/O is contained here. Failures are non-fatal to the API response.
// =============================================================================

import type { FormState } from "@/modules/cost-audit/types";
import type { Rag }       from "@/modules/cost-audit/types";

// ── Config ─────────────────────────────────────────────────────────────────────

const BREVO_API_BASE = "https://api.brevo.com/v3";

function getApiKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY is not set in environment variables.");
  return key;
}

function brevoHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "api-key":       getApiKey(),
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrevoSyncPayload {
  input:         FormState;
  scores: {
    spend:        Rag;
    architecture: Rag;
    pain:         Rag;
  };
  tier:          1 | 2 | 3 | 4;
  insights:      string[];
  submissionId:  string;
}

interface BrevoResult {
  success:  boolean;
  error?:   string;
}

// ── Step 1: Get current contact (to read CO_ENGAGEMENT_SCORE) ─────────────────

async function getCurrentEngagementScore(email: string): Promise<number> {
  try {
    const res = await fetch(
      `${BREVO_API_BASE}/contacts/${encodeURIComponent(email)}`,
      { headers: brevoHeaders() },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const score = data?.attributes?.CO_ENGAGEMENT_SCORE;
    return typeof score === "number" ? score : 0;
  } catch {
    return 0;
  }
}

// ── Step 2: Upsert contact with all CO_* attributes ───────────────────────────

async function upsertContact(payload: BrevoSyncPayload): Promise<void> {
  const { input, scores, tier, insights, submissionId } = payload;

  const currentScore = await getCurrentEngagementScore(input.email);

  const attributes: Record<string, unknown> = {
    // Form fields
    CO_AI_DEPENDENCE:     input.ai_dependence,
    CO_SPEND_BAND:        input.monthly_spend_band,
    CO_SPEND_VISIBILITY:  input.spend_visibility,
    CO_UNIT_ECONOMICS:    input.unit_economics.join(","),
    CO_MAIN_PAIN:         input.main_pain,
    CO_LEAKAGE_PATTERN:   input.leakage_pattern,
    CO_OPTIMIZATION_DONE: input.optimization_done.join(","),
    CO_SAVINGS_THRESHOLD: input.savings_threshold,
    CO_EXTRA_CONTEXT:     input.extra_context ?? "",
    CO_REF_SOURCE:        input.ref ?? "co-landing",

    // Scorecard outputs
    CO_SCORE_SPEND:       scores.spend,
    CO_SCORE_ARCH:        scores.architecture,
    CO_SCORE_PAIN:        scores.pain,
    CO_SCAN_TIER:         tier,
    CO_SCAN_COMPLETE:     true,
    CO_INSIGHT_1:         insights[0] ?? "",
    CO_INSIGHT_2:         insights[1] ?? "",
    CO_INSIGHT_3:         insights[2] ?? "",

    // Engagement (increment by 50)
    CO_ENGAGEMENT_SCORE:  currentScore + 50,

    // Segment marker
    AI_SEGMENT:           "cost",

    // Standard contact fields
    FIRSTNAME:            input.firstname,
    LASTNAME:             input.lastname,
    COMPANY:              input.company,
    JOB_TITLE:            input.job_title,
  };

  const listIds = buildListIds(tier);

  const body: Record<string, unknown> = {
    email:         input.email,
    updateEnabled: true,              // upsert — creates if not exists, updates if does
    attributes,
  };

  if (listIds.length > 0) {
    body.listIds = listIds;
  }

  const res = await fetch(`${BREVO_API_BASE}/contacts`, {
    method:  "POST",
    headers: brevoHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    throw new Error(`Brevo upsert failed: ${res.status} — ${text}`);
  }
}

// ── Step 3: Apply tags ─────────────────────────────────────────────────────────

function buildTags(tier: 1 | 2 | 3 | 4): string[] {
  const tags = [
    "seg_cost",
    "co_active",
    "co_state_new",
    "co_scan_complete",
    `co_tier_${tier}`,
  ];

  if (tier === 1) {
    tags.push("co_tier1_qualified", "co_state_hot");
  }
  if (tier === 4) {
    tags.push("co_state_excluded");
  }

  return tags;
}

function buildListIds(tier: 1 | 2 | 3 | 4): number[] {
  const listIds: number[] = [];
  
  const activeListId = process.env.BREVO_LIST_ACTIVE;
  if (activeListId && !isNaN(Number(activeListId))) {
    listIds.push(Number(activeListId));
  }

  if (tier === 1) {
    const t1 = process.env.BREVO_LIST_TIER_1;
    const hot = process.env.BREVO_LIST_HOT;
    if (t1 && !isNaN(Number(t1))) listIds.push(Number(t1));
    if (hot && !isNaN(Number(hot))) listIds.push(Number(hot));
  } else if (tier === 2) {
    const t2 = process.env.BREVO_LIST_TIER_2;
    if (t2 && !isNaN(Number(t2))) listIds.push(Number(t2));
  } else {
    const nurture = process.env.BREVO_LIST_NURTURE;
    if (nurture && !isNaN(Number(nurture))) listIds.push(Number(nurture));
  }

  return listIds;
}

async function applyTags(email: string, tags: string[]): Promise<void> {
  // Brevo v3 - Update a contact with new tags by updating a custom attribute.
  // This assumes 'TAGS' is a custom attribute of type 'text' that can store a comma-separated string of tags.
  // If Brevo has a dedicated API for managing tags as distinct entities, this approach might need adjustment.

  const updateBody = {
    attributes: {
      TAGS: tags.join(','), // Join tags into a comma-separated string for a text attribute
    },
  };

  const putRes = await fetch(`${BREVO_API_BASE}/contacts/${encodeURIComponent(email)}`, {
    method:  "PUT",
    headers: brevoHeaders(),
    body:    JSON.stringify(updateBody),
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "unknown");
    throw new Error(`Brevo tag application failed: ${putRes.status} — ${text}`);
  }
}

// ── Retry queue (best-effort, fire-and-forget) ─────────────────────────────────

/**
 * scheduleRetry — fires one retry attempt after a delay.
 * In production, replace with a proper job queue (BullMQ, Inngest, Upstash, etc.)
 * For now: logs the payload so it can be replayed manually.
 */
function scheduleRetry(operation: string, payload: BrevoSyncPayload, error: unknown): void {
  const retryDelay = 5000; // ms
  const retryPayload = {
    operation,
    submissionId: payload.submissionId,
    email:        payload.input.email,
    error:        error instanceof Error ? error.message : String(error),
    retryAt:      new Date(Date.now() + retryDelay).toISOString(),
  };

  // Log for observability (replace with queue write in production)
  console.error("[brevo.service] Scheduling retry:", JSON.stringify(retryPayload));

  // Fire-and-forget retry after delay
  setTimeout(async () => {
    try {
      if (operation === "upsert") {
        await upsertContact(payload);
      } else if (operation === "tags") {
        const tags = buildTags(payload.tier);
        await applyTags(payload.input.email, tags);
      }
    } catch (retryErr) {
      // Log final failure — needs manual intervention or persistent queue
      console.error(
        `[brevo.service] Retry failed for ${operation}:`,
        payload.submissionId,
        retryErr,
      );
    }
  }, retryDelay);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * syncToBrevo — orchestrates the full Brevo sync:
 *   1. Upsert contact with all CO_* attributes
 *   2. Apply tier-based tags
 *
 * IMPORTANT: This function NEVER throws. Brevo failures are logged and retried
 * in the background. The API route always returns a scorecard regardless.
 */
export async function syncToBrevo(payload: BrevoSyncPayload): Promise<BrevoResult> {
  // Validate API key presence before attempting anything
  try {
    getApiKey();
  } catch {
    console.warn("[brevo.service] BREVO_API_KEY not set — skipping sync (dev mode).");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  let upsertOk = false;
  let tagsOk   = false;

  // ── 1. Upsert contact ───────────────────────────────────────────────────
  try {
    await upsertContact(payload);
    upsertOk = true;
  } catch (err) {
    console.error("[brevo.service] Upsert failed:", err);
    scheduleRetry("upsert", payload, err);
  }

  // ── 2. Apply tags ────────────────────────────────────────────────────────
  try {
    const tags = buildTags(payload.tier);
    await applyTags(payload.input.email, tags);
    tagsOk = true;
  } catch (err) {
    console.error("[brevo.service] Tag application failed:", err);
    scheduleRetry("tags", payload, err);
  }

  const success = upsertOk && tagsOk;
  if (!success) {
    console.warn(
      `[brevo.service] Partial sync for ${payload.submissionId}:`,
      { upsertOk, tagsOk },
    );
  }

  return {
    success,
    error: !success ? "Brevo partial sync failure — retry scheduled" : undefined,
  };
}
