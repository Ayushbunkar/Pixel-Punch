"use client";

import { ArrowRight } from "lucide-react";

interface TierCTAProps {
  url: string;
  label: string;
  tier: 1 | 2 | 3 | 4;
}

export function TierCTA({ url, label, tier }: TierCTAProps) {
  // Use primary button style for tiers 1 and 2, ghost for others
  const styleClass = tier <= 2 ? "pp-btn-primary" : "pp-btn-ghost border border-slate-400 hover:border-slate-300 text-slate-100";

  return (
    <a
      id="cost-scan-results-cta"
      href={url}
      className={`${styleClass} inline-flex`}
      onClick={() => {
        // Mock analytics tracking
        console.log("Analytics: Tracked audit_booking_click", { tier, url });
      }}
    >
      {label}
      <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />
    </a>
  );
}
