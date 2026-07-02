"use client";

import { LeakagePattern } from "@/modules/cost-audit/types";
import { OptionCard, FieldError } from "./WizardUI";
import { FileText, Gem, RefreshCw, Moon, Search, HelpCircle } from "lucide-react";

const OPTIONS: { value: LeakagePattern; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "large_prompts",
    label:    "Large prompts / context windows",
    sublabel: "Context windows are bigger than needed token waste is likely significant.",
    icon:     <FileText className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "premium_models",
    label:    "Using premium models for simple tasks",
    sublabel: "GPT-4 / Claude Opus being used where GPT-3.5 / Haiku would suffice.",
    icon:     <Gem className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "weak_routing",
    label:    "Weak routing / caching",
    sublabel: "Too many redundant calls, low cache hit rates, or no intelligent model routing.",
    icon:     <RefreshCw className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "idle_gpu",
    label:    "Idle / overprovisioned GPU or infra",
    sublabel: "Reserved compute sitting idle outside peak hours.",
    icon:     <Moon className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "unattributed",
    label:    "Unattributed usage across teams / features",
    sublabel: "No tagging or attribution impossible to see which team or feature drives cost.",
    icon:     <Search className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "not_sure",
    label:    "Not sure",
    sublabel: "Leakage is suspected but root cause is unknown.",
    icon:     <HelpCircle className="w-5 h-5 text-indigo-400" />,
  },
];

interface LeakageStepProps {
  value:    LeakagePattern | "";
  onChange: (v: LeakagePattern) => void;
  error?:   string;
}

export function LeakageStep({ value, onChange, error }: LeakageStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Where do you believe most AI cost leakage is happening?
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Best guess is fine — we will surface the evidence in the audit.
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
