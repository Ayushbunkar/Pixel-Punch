"use client";

import { CheckCircle2, Lightbulb, Lock } from "lucide-react";
import * as motion from "framer-motion/client";

interface InsightsListProps {
  insights: string[];
  onUnlock?: () => void;
  isUnlocked?: boolean;
}

export function InsightsList({ insights, onUnlock, isUnlocked }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="mb-6" aria-label="Insights">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          Key Insights
        </h2>
      </div>
      
      <div className="relative">
        {/* Insights list blurred container */}
        <div className={`space-y-3 p-1 transition-all duration-500 ${!isUnlocked ? "blur-md select-none pointer-events-none opacity-30" : ""}`}>
          {insights.map((insight, i) => (
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
        </div>

        {/* Lock Overlay */}
        {!isUnlocked && (
          <div 
            onClick={() => onUnlock?.()}
            className="absolute inset-0 bg-white/85 backdrop-blur-[2.5px] rounded-xl flex items-center justify-center z-10 cursor-pointer hover:bg-white/90 border border-slate-200/50 shadow-sm transition-all duration-300 min-h-[140px]"
          >
            <div className="text-center p-4">
              <Lock className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                Key Insights Locked
              </h3>
              <p className="text-[9px] text-slate-500 mb-2.5">
                Enter your email to unlock all key cost insights.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock?.();
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
              >
                Unlock Insights
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}