"use client";

import { CheckCircle2, Lightbulb, Lock, Unlock } from "lucide-react";
import * as motion from "framer-motion/client";
import { fadeIn } from "@/shared/components/animations";

interface InsightsListProps {
  insights: string[];
  onUnlock?: () => void;
}

export function InsightsList({ insights, onUnlock }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  // Show first 2 insights fully visible, blur the rest
  const visibleInsights = insights.slice(0, 2);
  const gatedInsights = insights.slice(2);

  return (
    <section className="glass-card p-6 mb-8 step-enter" aria-label="Insights">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-500" />
          Key Insights
        </h2>
        {gatedInsights.length > 0 && onUnlock && (
          <button
            onClick={onUnlock}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Unlock className="w-3 h-3" />
            Unlock All Insights
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Visible Insights */}
        {visibleInsights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <span className="flex-shrink-0 mt-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
          </motion.div>
        ))}

        {/* Gated Insights - Blurred */}
        {gatedInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[4px] rounded-xl flex items-center justify-center z-10 cursor-pointer hover:bg-slate-200/40 transition-colors"
              onClick={() => onUnlock?.()}
            >
              <div className="text-center p-6">
                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Premium Insights Locked
                </p>
                <p className="text-[10px] text-slate-600 mb-3">
                  Unlock to see all {insights.length} insights
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlock?.();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors"
                >
                  Unlock Now
                </button>
              </div>
            </div>
            <div className="opacity-50">
              {gatedInsights.map((insight, i) => (
                <div key={`gated-${i}`} className="flex gap-3 opacity-50">
                  <span className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </span>
                  <p className="text-sm text-slate-500 leading-relaxed blur-[1px]">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}