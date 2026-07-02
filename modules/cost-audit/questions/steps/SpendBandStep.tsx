"use client";

import { SpendBand, SpendVisibility } from "@/modules/cost-audit/types";
import { OptionCard, FieldError } from "./WizardUI";
import { Lightbulb, TrendingUp, BarChart3, Zap, Target, Search, HelpCircle, EyeOff } from "lucide-react";

const SPEND_OPTIONS: { value: SpendBand; label: string; icon: React.ReactNode }[] = [
  { value: "lt_5k",     label: "Less than $5k / month",  icon: <Lightbulb className="w-5 h-5 text-indigo-400" /> },
  { value: "5k_25k",    label: "$5k – $25k / month",     icon: <TrendingUp className="w-5 h-5 text-indigo-400" /> },
  { value: "25k_100k",  label: "$25k – $100k / month",   icon: <BarChart3 className="w-5 h-5 text-indigo-400" /> },
  { value: "100k_plus", label: "$100k+ / month",         icon: <Zap className="w-5 h-5 text-indigo-400" /> },
];

const VISIBILITY_OPTIONS: { value: SpendVisibility; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    value:    "very_clear",
    label:    "Very clear",
    sublabel: "Exact figures in a dashboard or monthly report.",
    icon:     <Target className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "somewhat_clear",
    label:    "Somewhat clear",
    sublabel: "Rough totals known but not broken down by service/team.",
    icon:     <Search className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "rough_guess",
    label:    "Rough guess",
    sublabel: "Approximation from invoices no consolidated view.",
    icon:     <HelpCircle className="w-5 h-5 text-indigo-400" />,
  },
  {
    value:    "no_view",
    label:    "No consolidated view",
    sublabel: "Costs are scattered we genuinely don't know the total.",
    icon:     <EyeOff className="w-5 h-5 text-indigo-400" />,
  },
];

interface SpendBandStepProps {
  spendValue:       SpendBand | "";
  visibilityValue:  SpendVisibility | "";
  onSpendChange:    (v: SpendBand) => void;
  onVisChange:      (v: SpendVisibility) => void;
  spendError?:      string;
  visError?:        string;
}

export function SpendBandStep({
  spendValue, visibilityValue, onSpendChange, onVisChange, spendError, visError,
}: SpendBandStepProps) {
  return (
    <div className="step-enter">
      {/* Q2a */}
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        What&apos;s your approximate monthly AI spend?
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        Include API costs (OpenAI, Anthropic, etc.), GPU inference, and any AI infrastructure.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {SPEND_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={spendValue === opt.value}
            onClick={() => onSpendChange(opt.value)}
          />
        ))}
      </div>
      <FieldError message={spendError} />

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-700/60" />
        <span className="text-xs text-slate-500 uppercase tracking-widest">and</span>
        <div className="flex-1 h-px bg-slate-700/60" />
      </div>

      {/* Q2b */}
      <h3 className="text-base font-medium text-slate-800 mb-1">
        How clear is that number?
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        How confident are you in the figure above?
      </p>

      <div className="grid gap-3">
        {VISIBILITY_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            selected={visibilityValue === opt.value}
            onClick={() => onVisChange(opt.value)}
          />
        ))}
      </div>
      <FieldError message={visError} />
    </div>
  );
}
