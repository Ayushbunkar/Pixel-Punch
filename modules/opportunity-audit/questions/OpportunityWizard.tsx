"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOpportunityForm } from "./hooks/useOpportunityForm";
import { useSubmitOpportunity } from "./hooks/useSubmitOpportunity";
import * as motion from "framer-motion/client";
import { slideUp } from "@/shared/components/animations";
import toast from "react-hot-toast";

import { StepContext } from "./steps/StepContext";
import { StepDataSystems } from "./steps/StepDataSystems";
import { StepWorkflows } from "./steps/StepWorkflows";
import { StepOperations } from "./steps/StepOperations";
import { StepStrategy } from "./steps/StepStrategy";


import { ChevronLeft, Loader2, ArrowRight, ChevronRight, Lock, Zap, Ban } from "lucide-react";

const STEP_LABELS = [
  "Business Context",
  "Data Architecture",
  "Process & Workflows",
  "Customer Operations",
  "AI Strategic Fit",
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Step {step} of {total}
        </span>
        <span className="text-xs font-medium text-slate-400">{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500 animate-[pulse_2s_infinite]"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
      <div className="flex justify-between mt-3 px-1">
        {Array.from({ length: total }, (_, i) => {
          const isActive = i + 1 === step;
          const isCompleted = i + 1 < step;
          return (
            <div key={i} className="relative flex items-center justify-center w-4 h-4">
              {isActive && (
                <span className="absolute animate-ping inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-2.5 h-2.5 bg-emerald-500 shadow-[0_0_6px_#10b981]"
                    : isCompleted
                    ? "w-2 h-2 bg-emerald-400"
                    : "w-1.5 h-1.5 bg-slate-200"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NavProps {
  step:       number;
  total:      number;
  loading:    boolean;
  onBack:     () => void;
  onNext:     () => void;
}

function NavButtons({ step, total, loading, onBack, onNext }: NavProps) {
  const isLast = step === total;
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1 || loading}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-colors"
        aria-label="Go to previous step"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        Back
      </button>

      <div className="flex items-center gap-3">
        {isLast ? (
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="px-6 py-2.5 bg-[#0d6efd] text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[200px] flex items-center justify-center gap-2 text-sm font-semibold"
            aria-label="Submit and get your AI Opportunity Roadmap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Opportunities…
              </>
            ) : (
              <>
                See my results
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors min-w-[140px] flex items-center justify-center gap-2 text-sm font-semibold"
            aria-label="Go to next step"
          >
            Continue
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

interface NavProps {
  step:       number;
  total:      number;
  loading:    boolean;
  onBack:     () => void;
  onNext:     () => void;
}

function NavButtons({ step, total, loading, onBack, onNext }: NavProps) {
  const isLast = step === total;
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1 || loading}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-colors"
        aria-label="Go to previous step"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        Back
      </button>

      <div className="flex items-center gap-3">
        {isLast ? (
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="px-6 py-2.5 bg-[#0d6efd] text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[200px] flex items-center justify-center gap-2 text-sm font-semibold"
            aria-label="Submit and see your AI Opportunity Roadmap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Opportunities…
              </>
            ) : (
              <>
                See my results
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors min-w-[140px] flex items-center justify-center gap-2 text-sm font-semibold"
            aria-label="Go to next step"
          >
            Continue
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

interface OpportunityWizardProps {
  initialRef?: string;
}

export function OpportunityWizard({ initialRef }: OpportunityWizardProps) {
  const router = useRouter();
  const {
    state, step, errors, totalSteps, isLoaded,
    setField, toggleArrayValue, goNext, goBack, validateAll, resetForm
  } = useOpportunityForm(initialRef);

  const formRef = useRef<HTMLDivElement>(null);

  const { submit, loading } = useSubmitOpportunity();

  const handleNext = async () => {
    const canAdvance = goNext();
    if (canAdvance && step === totalSteps) {
      const result = await submit(state, validateAll);
      if (result.success && result.data) {
        toast.success("Opportunity scan complete!");
        resetForm();
        router.push(`/ai/opportunity-scan/results?id=${result.data.submissionId}`);
      } else if (result.errors && Object.keys(result.errors).length > 0) {
        const missing = Object.keys(result.errors)
          .map((k) => k.replace("_", " "))
          .join(", ");
          
        toast.error(`Please complete the required fields: ${missing}`, {
          id: "opportunity-val-error",
        });
      } else if (result.message) {
        toast.error(result.message);
      }
    }
  };

  useEffect(() => {
    if (formRef.current) {
      const yOffset = -80; // Offset from top of viewport
      const element = formRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [step]);



  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepContext
            state={state}
            errors={errors}
            onChange={setField}
          />
        );
      case 2:
        return (
          <StepDataSystems
            state={state}
            errors={errors}
            onChange={setField}
            onToggleArray={toggleArrayValue}
          />
        );
      case 3:
        return (
          <StepWorkflows
            state={state}
            errors={errors}
            onChange={setField}
            onToggleArray={toggleArrayValue}
          />
        );
      case 4:
        return (
          <StepOperations
            state={state}
            errors={errors}
            onChange={setField}
          />
        );
      case 5:
        return (
          <StepStrategy
            state={state}
            errors={errors}
            onChange={setField}
          />
        );
      default:
        return null;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      ref={formRef}
      variants={slideUp} initial="hidden" animate="show"
      className="w-full max-w-3xl mx-auto"
    >
      <div className="glass-card p-8 md:p-10 shadow-xl border border-slate-200">
        <ProgressBar step={step} total={totalSteps} />

        <div key={step}>
          {renderStep()}
        </div>

        <NavButtons
          step={step}
          total={totalSteps}
          loading={loading}
          onBack={goBack}
          onNext={handleNext}
        />
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-6 mt-6">
        {[
          { icon: <Lock className="w-4 h-4 text-slate-400" />, label: "GDPR Compliant Data Security" },
          { icon: <Zap className="w-4 h-4 text-slate-400" />, label: "Instant Digital Roadmap" },
          { icon: <Ban className="w-4 h-4 text-slate-400" />, label: "Free Assessment" },
        ].map(({ icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
