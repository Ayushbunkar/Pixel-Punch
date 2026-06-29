"use client";

import { CheckCircle2, Lightbulb, Lock, Unlock } from "lucide-react";
import * as motion from "framer-motion/client";

interface InsightsListProps {
  insights: string[];
  onUnlock?: () => void;
  isUnlocked?: boolean;
}

export function InsightsList({ insights, onUnlock, isUnlocked }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  const visibleInsights = isUnlocked ? insights : insights.slice(0, 2);
  const gatedInsights = isUnlocked ? [] : insights.slice(2);

  return (
    <section className="mb-6" aria-label="Insights">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          Key Insights
        </h2>
        {gatedInsights.length > 0 && onUnlock && (
          <button
            onClick={onUnlock}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Unlock className="w-3 h-3" />
            Unlock All
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Visible Insights */}
        {visibleInsights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <span className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{insight}</p>
          </motion.div>
        ))}

        {/* Gated Insights - Blurred */}
        {gatedInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-slate-200/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10 cursor-pointer hover:bg-slate-200/50 transition-colors"
              onClick={() => onUnlock?.()}
            >
              <div className="text-center p-4">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Premium Insights Locked
                </p>
                <p className="text-[9px] text-slate-600 mb-2">
                  Unlock to see all {insights.length} insights
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlock?.();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Unlock Now
                </button>
              </div>
            </div>
            <div className="opacity-40 blur-[1px]">
              {gatedInsights.map((insight, i) => (
                <div key={`gated-${i}`} className="flex gap-3 opacity-40">
                  <span className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}