"use client";

import { Rag } from "@/features/cost-scan/types";
import scoreDescriptions from "@/config/score-descriptions.json";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

const RAG_META: Record<
  Rag,
  { label: string; badgeClass: string; bgClass: string; icon: React.ReactNode }
> = {
  red: {
    label:       "Action needed",
    badgeClass:  "rag-red",
    bgClass:     "border-rag-red/20 bg-rag-red-bg",
    icon:        <AlertCircle className="w-3.5 h-3.5 inline" />,
  },
  amber: {
    label:       "Room to improve",
    badgeClass:  "rag-amber",
    bgClass:     "border-rag-amber/20 bg-rag-amber-bg",
    icon:        <AlertTriangle className="w-3.5 h-3.5 inline" />,
  },
  green: {
    label:       "Looking good",
    badgeClass:  "rag-green",
    bgClass:     "border-rag-green/20 bg-rag-green-bg",
    icon:        <CheckCircle2 className="w-3.5 h-3.5 inline" />,
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
    <div className={`rounded-xl border p-5 ${meta.bgClass}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badgeClass}`}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}
