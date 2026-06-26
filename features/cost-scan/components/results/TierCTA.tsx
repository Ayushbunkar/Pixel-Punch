"use client";

import { ArrowRight } from "lucide-react";

interface TierCTAProps {
  url: string;
  label: string;
  tier: 1 | 2 | 3 | 4;
}

export function TierCTA({ url, label, tier }: TierCTAProps) {
  // Always send to contact page — override any passed url for tiers 1 & 2
  const href = tier <= 2
    ? "https://pixelpunch.org/contact-us/"
    : url;

  const styleClass = tier <= 2 ? "pp-btn-primary" : "pp-btn-ghost border border-slate-400 hover:border-slate-300 text-slate-100";

  return (
    <a
      id="cost-scan-results-cta"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styleClass} inline-flex`}
      onClick={() => {
        console.log("Analytics: Tracked audit_booking_click", { tier, url: href });
      }}
    >
      {label}
      <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />
    </a>
  );
}
