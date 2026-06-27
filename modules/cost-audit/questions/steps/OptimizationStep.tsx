"use client";

import { OptimizationDone, OPTIMIZATION_DONE_VALUES } from "@/modules/cost-audit/types";
import { OptionCard, FieldError, MultiSelectHint } from "./WizardUI";
import { ClipboardList, Pencil, Layers, Scale, Ban } from "lucide-react";

const OPTIONS: { value: OptimizationDone; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "formal_audit",
    label:    "Formal AI cost audit",
    sublabel: "Structured review of tokens, inference, infra, and routing — in the last 12 months.",
    icon:     <ClipboardList className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "prompt_tuning",
    label:    "Targeted prompt / context tuning",
    sublabel: "Deliberate effort to reduce tokens through prompt engineering or context pruning.",
    icon:     <Pencil className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "model_tiering",
    label:    "Systematic model tiering",
    sublabel: "Routing requests to cheaper models based on evals and cost/quality trade-offs.",
    icon:     <Layers className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "infra_rightsizing",
    label:    "GPU / infra right-sizing",
    sublabel: "Adjusting reserved compute to match actual utilization data.",
    icon:     <Scale className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "none_adhoc",
    label:    "None / only ad-hoc changes",
    sublabel: "No structured optimization program — changes have been reactive or informal.",
    icon:     <Ban className="w-5 h-5 text-indigo-400" />,
  },
];

interface OptimizationStepProps {
  values:   OptimizationDone[];
  onToggle: (v: OptimizationDone) => void;
  error?:   string;
}

export function OptimizationStep({ values, onToggle, error }: OptimizationStepProps) {
  const noneAdhocSelected = values.includes("none_adhoc");
  const structuredSelected = values.some((v) => v !== "none_adhoc");

  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Which structured cost-optimization steps have you already done?
      </h2>
      <p className="text-sm text-slate-600 mb-2">
        On your AI stack in any systematic or deliberate way.
      </p>
      <MultiSelectHint />

      <div className="grid gap-3">
        {OPTIONS.map((opt) => {
          const isNoneAdhoc  = opt.value === "none_adhoc";
          const isStructured = opt.value !== "none_adhoc";

          const disabled =
            (isNoneAdhoc && structuredSelected) ||
            (isStructured && noneAdhocSelected);

          return (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              icon={opt.icon}
              selected={values.includes(opt.value)}
              multi
              disabled={disabled}
              onClick={() => !disabled && onToggle(opt.value)}
            />
          );
        })}
      </div>

      <FieldError message={error} />
    </div>
  );
}
