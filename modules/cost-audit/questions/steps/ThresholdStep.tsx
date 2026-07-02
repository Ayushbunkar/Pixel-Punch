"use client";

import { SavingsThreshold } from "@/modules/cost-audit/types";
import { OptionCard, FieldError } from "./WizardUI";
import { BarChart3, Target, Rocket, Search } from "lucide-react";

const OPTIONS: { value: SavingsThreshold; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "gte_10",
    label:    "≥ 10% reduction",
    sublabel: "Any meaningful reduction justifies the investment.",
    icon:     <BarChart3 className="w-5 h-5 text-blue-400" />,
  },
  {
    value:    "gte_25",
    label:    "≥ 25% reduction",
    sublabel: "A quarter reduction in AI spend would be a clear win.",
    icon:     <Target className="w-5 h-5 text-blue-400" />,
  },
  {
    value:    "gte_40",
    label:    "≥ 40%+ reduction",
    sublabel: "Only a major reduction makes a full audit obviously worthwhile.",
    icon:     <Rocket className="w-5 h-5 text-blue-400" />,
  },
  {
    value:    "need_visibility_first",
    label:    "Need visibility first before deciding",
    sublabel: "Without a clear picture of current spend, it's hard to commit to a number.",
    icon:     <Search className="w-5 h-5 text-blue-400" />,
  },
];

interface ThresholdStepProps {
  value:    SavingsThreshold | "";
  onChange: (v: SavingsThreshold) => void;
  error?:   string;
}

export function ThresholdStep({ value, onChange, error }: ThresholdStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        What level of savings makes a deeper audit an obvious &ldquo;yes&rdquo;?
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        If we can reduce AI spend without hurting performance what&apos;s the bar?
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
