// =============================================================================
// Insight Service — rule-based insight generation from config/cost-scan-insights.json
// Pure function. No I/O at runtime (config loaded once at module initialisation).
// =============================================================================

import { readFileSync } from "fs";
import { join }         from "path";
import type { FormState } from "@/lib/cost-scan/types";
import type { Rag }       from "@/lib/cost-scan/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConditionType =
  | "score_equals"
  | "field_equals"
  | "field_in"
  | "array_includes"
  | "array_exclusive";

interface InsightCondition {
  type:   ConditionType;
  field:  string;
  value?: string;
  values?: string[];
}

interface InsightTemplate {
  id:         string;
  priority:   number;
  conditions: InsightCondition[];
  text:       string;
}

interface InsightConfig {
  templates:    InsightTemplate[];
  tierDefaults: Record<string, string>;
}

export interface ScoreMap {
  spend:        Rag;
  architecture: Rag;
  pain:         Rag;
}

// ── Config loader (singleton, loaded once per cold start) ─────────────────────

let _config: InsightConfig | null = null;

function loadConfig(): InsightConfig {
  if (_config) return _config;
  try {
    const configPath = join(process.cwd(), "config", "cost-scan-insights.json");
    const raw        = readFileSync(configPath, "utf-8");
    _config          = JSON.parse(raw) as InsightConfig;
    return _config;
  } catch (err) {
    console.error("[insight.service] Failed to load cost-scan-insights.json:", err);
    // Return minimal fallback so the system never crashes
    return {
      templates:    [],
      tierDefaults: {
        "1": "A full AI Cost Audit is highly recommended based on your profile.",
        "2": "A scoped audit would provide a clear savings roadmap for your stack.",
        "3": "Your AI cost profile is healthy — we will share optimisation guides as you scale.",
        "4": "You are early in your AI journey — we will share cost-aware adoption content.",
      },
    };
  }
}

// ── Condition evaluator ────────────────────────────────────────────────────────

function evaluateCondition(
  condition: InsightCondition,
  input:     FormState,
  scores:    ScoreMap,
): boolean {
  const { type, field, value, values } = condition;
  const formField = (input as unknown as Record<string, unknown>)[field];

  switch (type) {
    case "score_equals":
      // field is one of "spend" | "architecture" | "pain"
      return scores[field as keyof ScoreMap] === value;

    case "field_equals":
      return formField === value;

    case "field_in":
      return Array.isArray(values) && values.includes(formField as string);

    case "array_includes":
      return Array.isArray(formField) && formField.includes(value as string);

    case "array_exclusive":
      // Array has exactly one element equal to `value`
      return (
        Array.isArray(formField) &&
        formField.length === 1 &&
        formField[0] === value
      );

    default:
      return false;
  }
}

function matchesAll(
  template: InsightTemplate,
  input:    FormState,
  scores:   ScoreMap,
): boolean {
  return template.conditions.every((c) => evaluateCondition(c, input, scores));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * generateInsights — selects up to 3 insights from the template config.
 *
 * Algorithm:
 *  1. Filter templates where ALL conditions match.
 *  2. Sort by ascending priority (lower = higher priority).
 *  3. Take up to 3.
 *  4. If fewer than 2 match, pad with the tier default.
 *  5. Deduplicate by ID (safety net).
 */
export function generateInsights(
  input:  FormState,
  scores: ScoreMap,
  tier:   1 | 2 | 3 | 4,
): string[] {
  const config = loadConfig();

  // Step 1+2: match and sort
  const matched = config.templates
    .filter((t) => matchesAll(t, input, scores))
    .sort((a, b) => a.priority - b.priority);

  // Step 3: take top 3
  const selected = matched.slice(0, 3);

  // Step 4: pad with tier default if needed
  const tierDefault = config.tierDefaults[String(tier)] ?? config.tierDefaults["3"];

  if (selected.length < 2) {
    // Always include tier default when fewer than 2 templates matched
    const defaultAlreadyIncluded = selected.some((t) => t.text === tierDefault);
    if (!defaultAlreadyIncluded) {
      selected.push({
        id:         `tier_${tier}_default`,
        priority:   999,
        conditions: [],
        text:       tierDefault,
      });
    }
  }

  // Final: return text array (deduplicated by text content)
  const seen  = new Set<string>();
  const texts: string[] = [];
  for (const t of selected.slice(0, 3)) {
    if (!seen.has(t.text)) {
      seen.add(t.text);
      texts.push(t.text);
    }
  }

  return texts;
}
