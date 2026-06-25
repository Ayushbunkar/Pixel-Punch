// =============================================================================
// Scoring Service — thin orchestration layer over scoring-engine.ts
// Pure functions only. No I/O, no side effects, fully testable.
// =============================================================================

import {
  scoreSpend,
  scoreArchitecture,
  scorePain,
  computeTier,
  runScoringEngine,
} from "@/src/scoring/scoring-engine";
import type { FormState }       from "@/features/cost-scan/types";
import type { ScorecardResult } from "@/features/cost-scan/types";
import type { Rag }             from "@/features/cost-scan/types";

export type { Rag };

export interface ScoreOutput {
  spend:        Rag;
  architecture: Rag;
  pain:         Rag;
  tier:         1 | 2 | 3 | 4;
}

/**
 * runScoring — calls the pure scoring engine and returns all dimension scores
 * plus the tier. This is the only function the API route calls for scoring.
 */
export function runScoring(input: FormState): ScoreOutput {
  const result = runScoringEngine({
    ai_dependence:     input.ai_dependence     as Parameters<typeof scoreSpend>[0]["ai_dependence"],
    monthly_spend_band: input.monthly_spend_band as Parameters<typeof scoreSpend>[0]["monthly_spend_band"],
    spend_visibility:  input.spend_visibility  as Parameters<typeof scoreSpend>[0]["spend_visibility"],
    unit_economics:    input.unit_economics    as Parameters<typeof scoreSpend>[0]["unit_economics"],
    main_pain:         input.main_pain         as Parameters<typeof scorePain>[0]["main_pain"],
    leakage_pattern:   input.leakage_pattern   as Parameters<typeof scoreArchitecture>[0]["leakage_pattern"],
    optimization_done: input.optimization_done as Parameters<typeof scoreArchitecture>[0]["optimization_done"],
    savings_threshold: input.savings_threshold as Parameters<typeof scorePain>[0]["savings_threshold"],
  });

  return {
    spend:        result.spend,
    architecture: result.architecture,
    pain:         result.pain,
    tier:         result.tier,
  };
}

/** CTA URLs by tier */
export function getCTAUrl(tier: 1 | 2 | 3 | 4): string {
  if (tier === 1 || tier === 2) return "https://pixelpunch.org/ai?ref=co-scan-book";
  if (tier === 3)               return "https://pixelpunch.org/content/cost-optimization";
  return                               "https://pixelpunch.org/ai/cost-scan/learn";
}
