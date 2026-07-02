"use client";

import type { FormState, ValidationErrors } from "../../types";
import { OptionCard, FieldError } from "@/shared/components/WizardUI";
import { Sparkles, Ban } from "lucide-react";

interface StepStrategyProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
}

export function StepStrategy({ state, errors, onChange }: StepStrategyProps) {
  return (
    <div className="space-y-8 step-enter">
      {/* Q14 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Which AI use case would create the most value right now?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Indicates your primary operational goal for adopting AI.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "automating_tasks", label: "Automating repetitive tasks" },
            { value: "customer_support", label: "Improving customer support" },
            { value: "sales_followup", label: "Speeding up sales follow up" },
            { value: "internal_knowledge", label: "Creating internal knowledge access" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.desired_use_case === opt.value}
              onClick={() => onChange("desired_use_case", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.desired_use_case} />
      </div>

      {/* Q15 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Ban className="w-5 h-5 text-blue-500" />
          What has prevented you from adopting AI faster?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Helps us address friction points such as compliance, budget, or engineering limitations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "lack_of_usecases", label: "Lack of clear use cases" },
            { value: "data_quality_issues", label: "Data quality issues" },
            { value: "technical_complexity", label: "Technical complexity" },
            { value: "budget_concerns", label: "Budget concerns" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.adoption_blocker === opt.value}
              onClick={() => onChange("adoption_blocker", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.adoption_blocker} />
      </div>
    </div>
  );
}
