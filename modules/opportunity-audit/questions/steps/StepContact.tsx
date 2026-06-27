"use client";

import type { FormState, ValidationErrors } from "../../types";
import { FieldError } from "@/shared/components/WizardUI";
import { User, Mail, Briefcase, Building, Layers } from "lucide-react";

interface StepContactProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: (field: keyof FormState, val: any) => void;
  loading: boolean;
}

export function StepContact({ state, errors, onChange, loading }: StepContactProps) {
  return (
    <div className="space-y-6 step-enter">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Where should we send your AI Opportunity Roadmap?
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          We will compile your audit results into a PDF report and send it to your inbox.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            First Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              disabled={loading}
              value={state.firstname}
              onChange={(e) => onChange("firstname", e.target.value)}
              placeholder="Jane"
              className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
                ${errors.firstname ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
            />
          </div>
          <FieldError message={errors.firstname} />
        </div>

        {/* Last name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Last Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              disabled={loading}
              value={state.lastname}
              onChange={(e) => onChange("lastname", e.target.value)}
              placeholder="Doe"
              className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
                ${errors.lastname ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
            />
          </div>
          <FieldError message={errors.lastname} />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Work Email
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            disabled={loading}
            value={state.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="jane@company.com"
            className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
              ${errors.email ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
          />
        </div>
        <FieldError message={errors.email} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Company Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </span>
            <input
              type="text"
              disabled={loading}
              value={state.company}
              onChange={(e) => onChange("company", e.target.value)}
              placeholder="Acme Corp"
              className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
                ${errors.company ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
            />
          </div>
          <FieldError message={errors.company} />
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Company Size
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </span>
            <select
              disabled={loading}
              value={state.company_size}
              onChange={(e) => onChange("company_size", e.target.value)}
              className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all appearance-none cursor-pointer
                ${errors.company_size ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
            >
              <option value="" disabled>Select size...</option>
              <option value="1_10">1-10 employees</option>
              <option value="11_50">11-50 employees</option>
              <option value="51_200">51-200 employees</option>
              <option value="201_500">201-500 employees</option>
              <option value="501_plus">501+ employees</option>
            </select>
          </div>
          <FieldError message={errors.company_size} />
        </div>
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Job Title
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Briefcase className="w-4 h-4" />
          </span>
          <input
            type="text"
            disabled={loading}
            value={state.job_title}
            onChange={(e) => onChange("job_title", e.target.value)}
            placeholder="Head of Operations"
            className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
              ${errors.job_title ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"}`}
          />
        </div>
        <FieldError message={errors.job_title} />
      </div>

      {/* Extra context */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Additional Context (Optional)
        </label>
        <textarea
          disabled={loading}
          rows={3}
          value={state.extra_context}
          onChange={(e) => onChange("extra_context", e.target.value)}
          placeholder="Tell us about specific workflows you want to automate, tools you use, or operational bottlenecks..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
        />
        <FieldError message={errors.extra_context} />
      </div>
    </div>
  );
}
