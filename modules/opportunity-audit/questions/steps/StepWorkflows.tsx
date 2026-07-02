"use client";

import type { FormState, ValidationErrors, ManualProcess } from "../../types";
import { OptionCard, FieldError, MultiSelectHint } from "@/shared/components/WizardUI";
import { ListTodo, HelpCircle, Network, DatabaseBackup } from "lucide-react";

interface StepWorkflowsProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
  onToggleArray: (field: "data_systems" | "manual_processes", val: any) => void;
}

export function StepWorkflows({ state, errors, onChange, onToggleArray }: StepWorkflowsProps) {
  return (
    <div className="space-y-8 step-enter">
      {/* Q7 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-blue-500" />
          Which processes still require significant manual effort?
        </h3>
        <MultiSelectHint note="Select all tasks where employees spend the most time copying, writing, or sorting." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "data_entry", label: "Data entry & copy paste" },
            { value: "email_followup", label: "Email writing & follow up" },
            { value: "reporting", label: "Reporting & compiling metrics" },
            { value: "customer_support", label: "Customer support replies" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              multi={true}
              selected={state.manual_processes.includes(opt.value as ManualProcess)}
              onClick={() => onToggleArray("manual_processes", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.manual_processes} />
      </div>

      {/* Q8 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          How do employees find information needed to do their jobs?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Shows how centralized your operational knowledge is.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "shared_drives", label: "Shared drives (Google Drive, Dropbox)" },
            { value: "internal_docs", label: "Internal docs (Confluence, Notion)" },
            { value: "slack_teams", label: "Slack / Teams search" },
            { value: "ask_colleague", label: "Ask a colleague directly" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.info_retrieval === opt.value}
              onClick={() => onChange("info_retrieval", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.info_retrieval} />
      </div>

      {/* Q9 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-500" />
          How connected are your systems today?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Determines if we need integration middleware before deploying AI agents.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "fully_integrated", label: "Fully integrated (API syncs)" },
            { value: "partially_integrated", label: "Partially integrated" },
            { value: "mostly_disconnected", label: "Mostly disconnected (isolated tools)" },
            { value: "not_sure", label: "Not sure" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.systems_connection === opt.value}
              onClick={() => onChange("systems_connection", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.systems_connection} />
      </div>

      {/* Q10 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <DatabaseBackup className="w-5 h-5 text-blue-500" />
          How would you describe the quality of your data?
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          AI performance depends directly on the structure and quality of incoming data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: "clean_reliable", label: "Clean and reliable" },
            { value: "some_gaps", label: "Some gaps or duplicates" },
            { value: "inconsistent", label: "Inconsistent across systems" },
            { value: "poor_unclear", label: "Poor or unclear" },
            { value: "other", label: "Other" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={state.data_quality === opt.value}
              onClick={() => onChange("data_quality", opt.value)}
            />
          ))}
        </div>
        <FieldError message={errors.data_quality} />
      </div>
    </div>
  );
}
