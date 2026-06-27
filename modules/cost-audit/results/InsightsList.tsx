"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";

interface InsightsListProps {
  insights: string[];
}

export function InsightsList({ insights }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="glass-card p-6 mb-8 step-enter" aria-label="Insights">
      <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-blue-500" />
        Key Insights
      </h2>
      <div className="space-y-4">
        {insights.slice(0, 3).map((insight, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0 mt-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
