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

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Name
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
              placeholder="Jane Doe"
              className={`pl-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400
                ${errors.firstname ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
            />
          </div>
          <FieldError message={errors.firstname} />
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
                ${errors.email ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        {/* Company Name */}
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
                ${errors.company ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
            />
          </div>
          <FieldError message={errors.company} />
        </div>
      </div>
    </div>
  );
}
