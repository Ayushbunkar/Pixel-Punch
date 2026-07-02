"use client";

import { AiDependence, AI_DEPENDENCE_VALUES } from "@/modules/cost-audit/types";
import { OptionCard, FieldError } from "./WizardUI";
import { Rocket, Settings, Beaker, Sprout } from "lucide-react";

const OPTIONS: { value: AiDependence; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "core_revenue",
    label:    "Core revenue features",
    sublabel: "AI directly powers or enables your product's primary value proposition.",
    icon:     <Rocket className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "key_workflows",
    label:    "Key internal workflows (support/ops)",
    sublabel: "AI handles significant internal operations support triage, ops automation, etc.",
    icon:     <Settings className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "limited_pilots",
    label:    "Limited pilots / experiments",
    sublabel: "AI is in trial stages not yet in critical production paths.",
    icon:     <Beaker className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "no_production",
    label:    "No production AI yet",
    sublabel: "Evaluating or pre production only.",
    icon:     <Sprout className="w-5 h-5 text-indigo-400" />,
  },
];

interface AiDependenceStepProps {
  value:    AiDependence | "";
  onChange: (v: AiDependence) => void;
  error?:   string;
}

export function AiDependenceStep({ value, onChange, error }: AiDependenceStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        How dependent is your product on AI today?
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        This helps us weight the urgency of your cost architecture.
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
