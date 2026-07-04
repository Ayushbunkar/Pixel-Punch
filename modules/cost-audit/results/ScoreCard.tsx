"use client";

import { motion } from "framer-motion";
import { Rag } from "@/modules/cost-audit/types";
import scoreDescriptions from "@/config/score-descriptions.json";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

const RAG_META: Record<
  Rag,
  { label: string; badgeClass: string; bgClass: string; icon: React.ReactNode; iconClass: string; textColor: string; buttonClass: string }
> = {
  red: {
    label:       "HIGH RISK",
    badgeClass:  "rag-red",
    bgClass:     "bg-[#FFEAEA] border-[#FFC2C2]",
    icon:        <AlertTriangle className="w-4 h-4" />,
    iconClass:   "text-red-500",
    textColor:   "text-red-700",
    buttonClass: "bg-red-500 hover:bg-red-600",
  },
  amber: {
    label:       "NEEDS ATTENTION",
    badgeClass:  "rag-amber",
    bgClass:     "bg-[#FFFBEB] border-[#FFECB2]",
    icon:        <Lightbulb className="w-4 h-4" />,
    iconClass:   "text-amber-500",
    textColor:   "text-amber-700",
    buttonClass: "bg-amber-500 hover:bg-amber-600",
  },
  green: {
    label:       "LOW RISK",
    badgeClass:  "rag-green",
    bgClass:     "bg-[#EAFFE2] border-[#C2FFC2]",
    icon:        <CheckCircle2 className="w-4 h-4" />,
    iconClass:   "text-green-500",
    textColor:   "text-green-700",
    buttonClass: "bg-green-500 hover:bg-green-600",
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
      whileHover={{ y: -2, boxShadow: "0 8px 12px -4px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)", borderColor: "#cbd5e1" }}
      className={`rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${meta.bgClass}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={meta.iconClass}>{meta.icon}</span>
          <span className={`text-[11px] font-bold ${meta.textColor}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-900 leading-tight mb-3">
          {title}
        </p>
        <p className={`text-5xl font-black mb-4 ${meta.textColor}`}>
          {score.toUpperCase()}
        </p>
        <button className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold text-white ${meta.buttonClass}`}>
          {score.toUpperCase()}
        </button>
      </div>
      <p className="text-[10px] text-slate-600 leading-relaxed mt-4">{description}</p>
    </motion.div>
  );
}

