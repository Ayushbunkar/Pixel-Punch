"use client";

import { MainPain } from "@/modules/cost-audit/types";
import { OptionCard, FieldError } from "./WizardUI";
import { TrendingUp, TrendingDown, Search, EyeOff } from "lucide-react";

const OPTIONS: { value: MainPain; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "bills_growing",
    label:    "Bills growing faster than usage",
    sublabel: "Spend is rising even though the volume of AI work hasn't changed proportionally.",
    icon:     <TrendingUp className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "margin_pressure",
    label:    "Margin pressure on AI features",
    sublabel: "AI costs are squeezing the unit economics of AI-powered features or products.",
    icon:     <TrendingDown className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "budget_scrutiny",
    label:    "Budget scrutiny / CFO questions",
    sublabel: "Finance or leadership is asking hard questions about AI ROI and cost justification.",
    icon:     <Search className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "lack_visibility",
    label:    "Lack of visibility",
    sublabel: "We can't see where the spend is going — attribution across teams or features is unclear.",
    icon:     <EyeOff className="w-5 h-5 text-indigo-400" />,
  },
];

interface PainStepProps {
  value:    MainPain | "";
  onChange: (v: MainPain) => void;
  error?:   string;
}

export function PainStep({ value, onChange, error }: PainStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        What feels like your biggest AI cost problem today?
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Pick the one that most accurately describes your situation.
      </p>

      <div className="grid gap-3">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>

      <FieldError message={error} />
    </div>
  );
}
