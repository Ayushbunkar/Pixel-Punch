"use client";

import { UnitEconomic, UNIT_ECONOMICS_VALUES } from "@/features/cost-scan/types";
import { OptionCard, FieldError, MultiSelectHint } from "./WizardUI";
import { Zap, CheckCircle, Users, Ban } from "lucide-react";

const OPTIONS: { value: UnitEconomic; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "cost_per_request",
    label:    "Cost per request / inference",
    sublabel: "Average token or API cost for a single model call.",
    icon:     <Zap className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "cost_per_task",
    label:    "Cost per successful task / ticket / user action",
    sublabel: "End-to-end cost including retries and orchestration for a business outcome.",
    icon:     <CheckCircle className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "cost_per_customer",
    label:    "Cost per customer or per feature",
    sublabel: "AI spend allocated to a customer segment or specific product feature.",
    icon:     <Users className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "none",
    label:    "We don't measure unit economics",
    sublabel: "No per-unit cost tracking in place today.",
    icon:     <Ban className="w-5 h-5 text-indigo-400" />,
  },
];

interface UnitEconomicsStepProps {
  values:   UnitEconomic[];
  onToggle: (v: UnitEconomic) => void;
  error?:   string;
}

export function UnitEconomicsStep({ values, onToggle, error }: UnitEconomicsStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Which AI cost metrics do you currently track?
      </h2>
      <p className="text-sm text-slate-600 mb-2">
        For your main AI workloads.
      </p>
      <MultiSelectHint />

      <div className="grid gap-3">
        {OPTIONS.map((opt) => {
          // "none" is disabled if another metric is already selected (and vice-versa)
          const otherSelected   = values.some((v) => v !== "none");
          const noneSelected    = values.includes("none");
          const isNoneOption    = opt.value === "none";
          const isMetricOption  = opt.value !== "none";

          const disabled =
            (isNoneOption && otherSelected) ||
            (isMetricOption && noneSelected);

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
