"use client";

import type { FormState, ValidationErrors } from "../../types";
import { OptionCard, FieldError } from "@/shared/components/WizardUI";
import { Building2, Target, AlertTriangle } from "lucide-react";

interface StepContextProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
}

export function StepContext({ state, errors, onChange }: StepContextProps) {
  return (
    <div className="space-y-8 step-enter">
      {/* Q1 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          What best describes your business?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          This helps us frame your operating model and industry patterns.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "saas", label: "SaaS" },
            { value: "agency_services", label: "Agency / professional services" },
            { value: "retail_ecommerce", label: "Retail / eCommerce" },
            { value: "healthcare_finance", label: "Healthcare / finance" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.business_type === opt.value}
              onClick={() => onChange("business_type", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.business_type} />
      </div>

      {/* Q2 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          What is the main outcome you want to improve right now?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          This aligns the AI diagnostic with a measurable business outcome.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "more_leads", label: "More leads" },
            { value: "higher_conversion", label: "Higher conversion" },
            { value: "faster_followup", label: "Faster follow up" },
            { value: "lower_manual_work", label: "Lower manual work" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.main_outcome === opt.value}
              onClick={() => onChange("main_outcome", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.main_outcome} />
      </div>

      {/* Q3 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-indigo-500" />
          What is the biggest operational challenge you are facing today?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Reveals the primary bottleneck in your day to day workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "slow_processes", label: "Slow processes" },
            { value: "too_much_manual", label: "Too much manual work" },
            { value: "data_scattered", label: "Data scattered across tools" },
            { value: "sales_gaps", label: "Sales follow up gaps" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.biggest_challenge === opt.value}
              onClick={() => onChange("biggest_challenge", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.biggest_challenge} />
      </div>
    </div>
  );
}
