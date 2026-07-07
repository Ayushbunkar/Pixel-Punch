// =============================================================================
// Brevo Service — isolated side-effect layer for CRM sync
// All Brevo I/O is contained here. Failures are non-fatal to the API response.
// =============================================================================

import type { FormState } from "@/modules/cost-audit/types";
import type { Rag }       from "@/modules/cost-audit/types";
import { Logger } from './logger';
import config from '../config';

// ── Config ─────────────────────────────────────────────────────────────────────

const BREVO_API_BASE = "https://api.brevo.com/v3";

function getApiKey(): string {
  const apiKey = config.brevo.apiKey;
  if (!apiKey || apiKey === "YOUR_BREVO_API_KEY") { // Check for empty or placeholder key
    throw new Error("Brevo API key is missing or invalid. Please set BREVO_API_KEY in your environment variables.");
  }
  return apiKey;
}

function brevoHeaders(): HeadersInit {
  const apiKey = getApiKey(); // Ensure API key is valid before creating headers
  return {
    "Content-Type": "application/json",
    "api-key":       apiKey,
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

  // Do not include listIds in the initial upsert. We will update lists separately.
  const res = await fetch(`${BREVO_API_BASE}/contacts`, {
    method:  "POST",
    headers: brevoHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    if (res.status === 401) {
      throw new Error(`Brevo upsert failed: ${res.status} Unauthorized. Please check your BREVO_API_KEY. — ${text}`);
    }
    throw new Error(`Brevo upsert failed: ${res.status} — ${text}`);
  }
}

// ── Step 3: Update contact lists (tags) ────────────────────────────────────────

async function updateContactLists(email: string, listIds: number[]): Promise<void> {
  if (listIds.length === 0) {
    return; // Nothing to update
  }

  const body = {
    listIds,
  };

  const res = await fetch(`${BREVO_API_BASE}/contacts/${encodeURIComponent(email)}/lists/add`, {
    method:  "PUT",
    headers: brevoHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    if (res.status === 401) {
      throw new Error(`Brevo list update failed: ${res.status} Unauthorized. Please check your BREVO_API_KEY. — ${text}`);
    }
    throw new Error(`Brevo list update failed: ${res.status} — ${text}`);
  }
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

// ── Retry queue (best-effor, fire-and-forget) ─────────────────────────────────

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
  Logger.error("[brevo.service] Scheduling retry:", JSON.stringify(retryPayload));

  // Fire-and-forget retry after delay
  setTimeout(async () => {
    try {
      if (operation === "upsert") {
        await upsertContact(payload);
      }
    } catch (retryErr) {
      // Log final failure — needs manual intervention or persistent queue
      Logger.error(
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
    Logger.warn("[brevo.service] BREVO_API_KEY not set — skipping sync (dev mode).");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  let upsertOk = false;
  let listUpdateOk = false;

  const email = payload.input.email;

  if (!email) {
    Logger.warn("[brevo.service] Email missing in payload — skipping Brevo sync.");
    return { success: false, error: "Email missing, Brevo sync skipped" };
  }

  // ── 1. Upsert contact ───────────────────────────────────────────────────
  try {
    await upsertContact(payload);
    upsertOk = true;
  } catch (err) {
    Logger.error("[brevo.service] Upsert failed:", err);
    scheduleRetry("upsert", payload, err);
  }

  // ── 2. Update contact lists (tags) ──────────────────────────────────────
  if (upsertOk) { // Only attempt list update if upsert was successful
    try {
      const listIds = buildListIds(payload.tier);
      await updateContactLists(email, listIds);
      listUpdateOk = true;
    } catch (err) {
      Logger.error("[brevo.service] List update failed:", err);
      scheduleRetry("list-update", payload, err); // Schedule retry for list update
    }
  }

  const success = upsertOk && listUpdateOk;
  if (!success) {
    Logger.warn(
      `[brevo.service] Partial sync for ${payload.submissionId}:`,
      { upsertOk, listUpdateOk },
    );
  }

  return {
    success,
    error: !success ? "Brevo partial sync failure — retry scheduled" : undefined,
  };
}
