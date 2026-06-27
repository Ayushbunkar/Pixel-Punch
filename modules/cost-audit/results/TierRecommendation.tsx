"use client";

import { TierCTA } from "./TierCTA";

interface TierRecommendationProps {
  tier: 1 | 2 | 3 | 4;
  ctaUrl: string;
}

const TIER_CONTENT: Record<number, { text: string; subtext: string; ctaLabel: string }> = {
  1: {
    text: "Your AI cost profile indicates strong optimization potential.",
    subtext: "A full AI Cost Audit is recommended.",
    ctaLabel: "Book AI Cost Audit",
  },
  2: {
    text: "A focused optimization review could identify savings opportunities.",
    subtext: "Your profile indicates meaningful optimisation potential.",
    ctaLabel: "Explore AI Cost Audit",
  },
  3: {
    text: "Your AI usage is still developing.",
    subtext: "Build visibility before deeper optimization.",
    ctaLabel: "Get Cost Optimization Guides",
  },
  4: {
    text: "You are early in your AI journey.",
    subtext: "Learn cost-aware AI adoption practices.",
    ctaLabel: "Learn More",
  },
};

export function TierRecommendation({ tier, ctaUrl }: TierRecommendationProps) {
  const content = TIER_CONTENT[tier] ?? TIER_CONTENT[3];

  return (
    <section className="glass-card p-8 mb-8 text-center step-enter" aria-label="Recommendation">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">
        Recommendation
      </h2>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {content.text}
      </h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        {content.subtext}
      </p>
      <TierCTA url={ctaUrl} label={content.ctaLabel} tier={tier} />
    </section>
  );
}
