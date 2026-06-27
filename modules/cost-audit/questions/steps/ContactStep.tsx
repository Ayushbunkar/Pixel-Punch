"use client";

import { FormState, ValidationErrors } from "@/modules/cost-audit/types";
import { FieldError } from "./WizardUI";

interface ContactStepProps {
  state:     FormState;
  errors:    ValidationErrors;
  onChange:  <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  loading:   boolean;
  submitError?: string | null;
}

function InputField({
  id, label, type = "text", value, onChange, error, placeholder, required = true, autoComplete,
}: {
  id:           string;
  label:        string;
  type?:        string;
  value:        string;
  onChange:     (v: string) => void;
  error?:       string;
  placeholder?: string;
  required?:    boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900 mb-1.5">
        {label}{required && <span className="text-blue-600 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className={`pp-input ${error ? "border-red-500/60 focus:border-red-500" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactStep({ state, errors, onChange, loading, submitError }: ContactStepProps) {
  return (
    <div className="step-enter">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Where should we send your results?
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        You will see your scorecard immediately on the next screen. We will also email you a PDF copy for your team.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <InputField
          id="firstname"
          label="First name"
          value={state.firstname}
          onChange={(v) => onChange("firstname", v)}
          error={errors.firstname}
          placeholder="Jane"
          autoComplete="given-name"
        />
        <InputField
          id="lastname"
          label="Last name"
          value={state.lastname}
          onChange={(v) => onChange("lastname", v)}
          error={errors.lastname}
          placeholder="Doe"
          autoComplete="family-name"
        />
      </div>

      <div className="grid gap-4 mb-4">
        <InputField
          id="email"
          label="Work email"
          type="email"
          value={state.email}
          onChange={(v) => onChange("email", v)}
          error={errors.email}
          placeholder="jane@company.com"
          autoComplete="work email"
        />
        <InputField
          id="company"
          label="Company"
          value={state.company}
          onChange={(v) => onChange("company", v)}
          error={errors.company}
          placeholder="Acme Corp"
          autoComplete="organization"
        />
        <InputField
          id="job_title"
          label="Job title"
          value={state.job_title}
          onChange={(v) => onChange("job_title", v)}
          error={errors.job_title}
          placeholder="VP Engineering"
          autoComplete="organization-title"
        />
      </div>

      {/* Optional extra context */}
      <div className="mb-2">
        <label
          htmlFor="extra_context"
          className="block text-sm font-medium text-slate-900 mb-1.5"
        >
          Anything else we should know?{" "}
          <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <textarea
          id="extra_context"
          rows={3}
          maxLength={2000}
          value={state.extra_context ?? ""}
          onChange={(e) => onChange("extra_context", e.target.value)}
          placeholder="Regulatory constraints, security requirements, specific workloads, etc."
          className={`pp-input resize-none ${errors.extra_context ? "border-red-500/60" : ""}`}
        />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.extra_context} />
          <span className="text-xs text-slate-600 ml-auto">
            {(state.extra_context ?? "").length} / 2000
          </span>
        </div>
      </div>

      {/* Submit-level error */}
      {submitError && (
        <div
          role="alert"
          className="mt-4 px-4 py-3 rounded-xl border border-red-500/30 bg-rag-red-bg text-sm text-red-600"
        >
          {submitError}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500 leading-relaxed">
        By submitting you agree to Pixel Punch&apos;s{" "}
        <a href="/privacy" className="underline hover:text-slate-900 transition-colors">
          privacy policy
        </a>
        . We never sell your data.
      </p>
    </div>
  );
}
