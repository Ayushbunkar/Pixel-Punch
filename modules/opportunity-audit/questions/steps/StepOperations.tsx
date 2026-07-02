"use client";

import type { FormState, ValidationErrors } from "../../types";
import { OptionCard, FieldError } from "@/shared/components/WizardUI";
import { UserCheck, MessageSquare, ClipboardCheck } from "lucide-react";

interface StepOperationsProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
}

export function StepOperations({ state, errors, onChange }: StepOperationsProps) {
  return (
    <div className="space-y-8 step-enter">
      {/* Q11 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-500" />
          How do you currently handle customer or internal inquiries?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Assesses the potential for support copilot and inbox routing systems.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "humans_mostly", label: "Humans handle most of it manually" },
            { value: "partly_automated", label: "Partly automated (simple auto replies)" },
            { value: "ticketing_system", label: "Structured ticketing system" },
            { value: "email_based", label: "Email based queue" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.inquiry_handling === opt.value}
              onClick={() => onChange("inquiry_handling", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.inquiry_handling} />
      </div>

      {/* Q12 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          What is the most common support or communication request?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Helps us evaluate standard response matching and automated agent feasibility.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "basic_faqs", label: "Basic FAQs & standard questions" },
            { value: "billing", label: "Billing & account inquiries" },
            { value: "technical_issues", label: "Technical support or bugs" },
            { value: "sales_inquiries", label: "Sales & pricing inquiries" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.request_types === opt.value}
              onClick={() => onChange("request_types", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.request_types} />
      </div>

      {/* Q13 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-500" />
          How are leads currently qualified?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Uncovers opportunities for AI lead scoring and qualification agents.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "manually_by_sales", label: "Manually qualified by sales team" },
            { value: "automated_rules", label: "Automated rules (form answers)" },
            { value: "crm_scoring", label: "CRM scoring logic" },
            { value: "not_qualified", label: "Not formally qualified" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.lead_qualification === opt.value}
              onClick={() => onChange("lead_qualification", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.lead_qualification} />
      </div>
    </div>
  );
}
