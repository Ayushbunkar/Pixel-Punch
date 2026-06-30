"use client";

import { Rag } from "@/modules/cost-audit/types";
import scoreDescriptions from "@/config/score-descriptions.json";
import * as motion from "framer-motion/client";

const RAG_META: Record<
  Rag,
  { label: string; badgeClass: string; bgClass: string; icon: React.ReactNode }
> = {
  red: {
    label:       "Action needed",
    badgeClass:  "rag-red",
    bgClass:     "border-rag-red/20 bg-rag-red-bg",
    icon: (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90 shadow-[0_0_8px_#f43f5e]"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
      </span>
    ),
  },
  amber: {
    label:       "Room to improve",
    badgeClass:  "rag-amber",
    bgClass:     "border-rag-amber/20 bg-rag-amber-bg",
    icon: (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90 shadow-[0_0_8px_#f59e0b]"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
      </span>
    ),
  },
  green: {
    label:       "Looking good",
    badgeClass:  "rag-green",
    bgClass:     "border-rag-green/20 bg-rag-green-bg",
    icon: (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_8px_#10b981]"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
      </span>
    ),
  },
};

type DimensionType = "spend" | "architecture" | "pain";

interface ScoreCardProps {
  title:     string;
  dimension: DimensionType;
  score:     Rag;
}

export function ScoreCard({ title, dimension, score }: ScoreCardProps) {
  const meta = RAG_META[score];
  // Type assertion since we know it matches the json structure
  const descriptions = (scoreDescriptions as Record<string, Record<Rag, string>>)[dimension];
  const description = descriptions?.[score] ?? "Analysis complete.";

  return (
    <motion.div 
      whileHover={{ 
        y: -2, 
        boxShadow: "0 8px 12px -4px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)",
        borderColor: "#cbd5e1"
      }}
      className={`rounded-lg border p-3 transition-all duration-300 ${meta.bgClass}`}
    >
      <div className="flex flex-col gap-1.5 mb-2">
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeClass}`}>
            {meta.icon} <span>{meta.label}</span>
          </span>
        </div>
        <p className="text-xs font-bold text-slate-900 leading-tight">
          {title}
        </p>
      </div>
      <p className="text-[10px] text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

