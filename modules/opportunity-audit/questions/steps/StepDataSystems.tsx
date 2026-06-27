"use client";

import type { FormState, ValidationErrors, DataSystem } from "../../types";
import { OptionCard, FieldError, MultiSelectHint } from "@/shared/components/WizardUI";
import { Database, ShieldAlert, GitBranch } from "lucide-react";

interface StepDataSystemsProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
  onToggleArray: (field: "data_systems" | "manual_processes", val: any) => void;
}

export function StepDataSystems({ state, errors, onChange, onToggleArray }: StepDataSystemsProps) {
  return (
    <div className="space-y-8 step-enter">
      {/* Q4 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          Where does your core customer or operational data live?
        </h3>
        <MultiSelectHint note="Select all systems currently holding critical data." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "crm", label: "CRM (HubSpot, Salesforce, etc.)" },
            { value: "erp", label: "ERP / Billing system" },
            { value: "helpdesk", label: "Helpdesk (Zendesk, Intercom, etc.)" },
            { value: "spreadsheets", label: "Spreadsheets (Excel, Google Sheets)" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              multi={true}
              selected={state.data_systems.includes(opt.value as DataSystem)}
              onClick={() => onToggleArray("data_systems", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.data_systems} />
      </div>

      {/* Q5 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          What is currently preventing workflows from becoming more automated?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          This isolates the root technical or process design bottleneck.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "data_not_centralized", label: "Data is not centralized" },
            { value: "tools_dont_integrate", label: "Tools do not integrate well" },
            { value: "team_manual_steps", label: "Team relies on manual copy-paste steps" },
            { value: "no_clear_design", label: "Lack of clear process map or design" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.automation_barriers === opt.value}
              onClick={() => onChange("automation_barriers", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.automation_barriers} />
      </div>

      {/* Q6 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-500" />
          How standardized are your core workflows?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Highly standardized steps are significantly easier for AI agents to execute.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "very_standardized", label: "Very standardized (clear SOPs)" },
            { value: "somewhat_standardized", label: "Somewhat standardized" },
            { value: "mostly_adhoc", label: "Mostly ad hoc (varies case-by-case)" },
            { value: "not_sure", label: "Not sure" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.workflow_standardization === opt.value}
              onClick={() => onChange("workflow_standardization", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.workflow_standardization} />
      </div>
    </div>
  );
}
