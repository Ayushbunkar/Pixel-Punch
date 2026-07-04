"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { RAG_META } from "@/shared/utils/rag-styles";

type Rag = "red" | "amber" | "green";

interface StatCardProps {
  title: string;
  description: string;
  ragStatus: Rag;
  // Any other props that might be common, e.g., an icon to display in the card header
  // icon?: React.ReactNode; 
}

export function StatCard({ title, description, ragStatus }: StatCardProps) {
  const meta = RAG_META[ragStatus];

  // Determine the appropriate icon based on ragStatus
  let IconComponent = Lightbulb; // Default icon
  if (ragStatus === "red") {
    IconComponent = AlertTriangle;
  } else if (ragStatus === "green") {
    IconComponent = CheckCircle2;
  }

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow: "0 8px 12px -4px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)",
        borderColor: "#cbd5e1",
      }}
      className={`rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${meta.bgClass}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={meta.iconClass}><IconComponent className="w-4 h-4" /></span>
          <span className={`text-[11px] font-bold ${meta.textColor}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-900 leading-tight mb-3">
          {title}
        </p>

      </div>
      <p className="text-[10px] text-slate-600 leading-relaxed mt-4">{description}</p>
    </motion.div>
  );
}
