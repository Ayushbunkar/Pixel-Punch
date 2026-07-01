"use client";
import { Check, AlertTriangle } from "lucide-react";
// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives shared by all step components
// ─────────────────────────────────────────────────────────────────────────────

interface OptionCardProps {
  value:      string;
  label:      string;
  sublabel?:  string;
  icon?:      React.ReactNode;
  selected:   boolean;
  multi?:     boolean;           // renders checkbox indicator vs radio dot
  onClick:    () => void;
  disabled?:  boolean;
}

export function OptionCard({
  label, sublabel, icon, selected, multi, onClick, disabled,
}: OptionCardProps) {
  const selectedClass = multi
    ? selected ? "selected-multi" : ""
    : selected ? "selected" : "";

  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`option-card w-full text-left ${selectedClass} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {/* Selection indicator */}
      <span
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-${multi ? "md" : "full"} border-2 flex items-center justify-center transition-all duration-150
          ${selected
            ? multi
              ? "border-blue-600 bg-blue-600"
              : "border-blue-600 bg-blue-600"
            : "border-slate-300"
          }`}
      >
        {selected && (
          multi
            ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
            : <span className="w-2 h-2 rounded-full bg-white block" />
        )}
      </span>

      {/* Content */}
      <div className="flex-1">
        <span className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{label}</span>
        </span>
        {sublabel && (
          <p className="mt-1 text-xs text-slate-600 ml-7 leading-relaxed">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Error message ─────────────────────────────────────────────────────────────

interface FieldErrorProps { message?: string }
export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// ── Multi-select hint ─────────────────────────────────────────────────────────

export function MultiSelectHint({ note }: { note?: string }) {
  return (
    <p className="text-xs text-slate-500 mb-4">
      {note ?? "Select all that apply."}
    </p>
  );
}
