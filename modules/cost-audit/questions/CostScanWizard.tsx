"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCostScanForm }   from "./hooks/useCostScanForm";
import { useSubmitScan }     from "./hooks/useSubmitScan";
import * as motion from "framer-motion/client";
import { slideUp } from "@/shared/components/animations";
import toast from "react-hot-toast";
import { AiDependenceStep }  from "./steps/AiDependenceStep";
import { SpendBandStep }     from "./steps/SpendBandStep";
import { UnitEconomicsStep } from "./steps/UnitEconomicsStep";
import { PainStep }          from "./steps/PainStep";
import { LeakageStep }       from "./steps/LeakageStep";
import { OptimizationStep }  from "./steps/OptimizationStep";
import { ThresholdStep }     from "./steps/ThresholdStep";
import { ContactStep }       from "./steps/ContactStep";
import { TechnicalStep }     from "./steps/TechnicalStep";
import { AiDependence, SpendBand, SpendVisibility, MainPain,
         LeakagePattern, SavingsThreshold, UnitEconomic, OptimizationDone }
  from "@/modules/cost-audit/types";
import { ChevronLeft, Loader2, ArrowRight, ChevronRight, Lock, Zap, Ban } from "lucide-react";

// ── Step meta ─────────────────────────────────────────────────────────────────
const STEP_LABELS = [
  "AI Dependence",
  "Spend & Visibility",
  "Unit Economics",
  "Cost Pain",
  "Leakage",
  "Optimization",
  "Savings Threshold",
  "Technical Audit",
  "Contact",
];

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          Step {step} of {total}
        </span>
        <span className="text-xs text-slate-400">{STEP_LABELS[step - 1]}</span>
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
      {/* Step dots */}
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

// ── Nav buttons ───────────────────────────────────────────────────────────────
interface NavProps {
  step:       number;
  total:      number;
  loading:    boolean;
  onBack:     () => void;
  onNext:     () => void;
  onSubmit:   () => void;
  onSkipSubmit: () => void;
}

function NavButtons({ step, total, loading, onBack, onNext, onSubmit, onSkipSubmit }: NavProps) {
  const isLast = step === total;
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-colors"
        aria-label="Go to previous step"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        Back
      </button>

      <div className="flex items-center gap-3">
        {step === 9 && (
          <button
            type="button"
            onClick={onSkipSubmit}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
          >
            Skip & See Results
          </button>
        )}

        {isLast ? (
          <button
            type="button"
            id="cost-scan-submit-btn"
            onClick={onSkipSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#0d6efd] text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[180px] flex items-center justify-center gap-2"
            aria-label="Submit and see your results"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing…
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
            id={`cost-scan-next-step-${step}`}
            onClick={onNext}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors min-w-[140px] flex items-center justify-center gap-2"
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

// ── Main wizard ───────────────────────────────────────────────────────────────
interface CostScanWizardProps {
  initialRef?: string;
}

export function CostScanWizard({ initialRef }: CostScanWizardProps) {
  const router = useRouter();
  const {
    state, step, errors, totalSteps,
    setField, toggleUnitEconomic, toggleOptimization,
    goNext, goBack, validateAll,
  } = useCostScanForm(initialRef);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      const yOffset = -80; // Offset from top of viewport
      const element = formRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [step]);

  const { submit, loading, error: submitError } = useSubmitScan();

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const result = await submit(state, validateAll);
    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    } else if (result.errors && Object.keys(result.errors).length > 0) {
      const FIELD_LABELS: Record<string, string> = {
        firstname: "Name",
        email: "Work Email",
        ai_dependence: "AI Dependence",
        monthly_spend_band: "Monthly Spend Band",
        spend_visibility: "Spend Visibility",
        unit_economics: "Unit Economics",
        main_pain: "Cost Pain",
        leakage_pattern: "Leakage Pattern",
        optimization_done: "Optimization",
        savings_threshold: "Savings Threshold",
      };
      
      const missing = Object.keys(result.errors)
        .map((k) => FIELD_LABELS[k] || k)
        .join(", ");
        
      toast.error(`Please complete the required fields: ${missing}`, {
        id: "validation-error",
      });
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  const handleSkipSubmit = async () => {
    const result = await submit(state, () => ({})); // Skip validation for contact fields
    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  // ── Step renderer ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <AiDependenceStep
            value={state.ai_dependence}
            onChange={(v: AiDependence) => setField("ai_dependence", v)}
            error={errors.ai_dependence}
          />
        );
      case 2:
        return (
          <SpendBandStep
            spendValue={state.monthly_spend_band}
            visibilityValue={state.spend_visibility}
            onSpendChange={(v: SpendBand) => setField("monthly_spend_band", v)}
            onVisChange={(v: SpendVisibility) => setField("spend_visibility", v)}
            spendError={errors.monthly_spend_band}
            visError={errors.spend_visibility}
          />
        );
      case 3:
        return (
          <UnitEconomicsStep
            values={state.unit_economics}
            onToggle={(v: UnitEconomic) => toggleUnitEconomic(v)}
            error={errors.unit_economics}
          />
        );
      case 4:
        return (
          <PainStep
            value={state.main_pain}
            onChange={(v: MainPain) => setField("main_pain", v)}
            error={errors.main_pain}
          />
        );
      case 5:
        return (
          <LeakageStep
            value={state.leakage_pattern}
            onChange={(v: LeakagePattern) => setField("leakage_pattern", v)}
            error={errors.leakage_pattern}
          />
        );
      case 6:
        return (
          <OptimizationStep
            values={state.optimization_done}
            onToggle={(v: OptimizationDone) => toggleOptimization(v)}
            error={errors.optimization_done}
          />
        );
      case 7:
        return (
          <ThresholdStep
            value={state.savings_threshold}
            onChange={(v: SavingsThreshold) => setField("savings_threshold", v)}
            error={errors.savings_threshold}
          />
        );
      case 8:
        return (
          <TechnicalStep
            state={state}
            errors={errors}
            onChange={setField}
            onAddDocument={(doc) => {
              const updatedDocs = [...(state.documents || []), doc];
              setField("documents", updatedDocs);
            }}
            onRemoveDocument={(index) => {
              const updatedDocs = (state.documents || []).filter((_, i) => i !== index);
              setField("documents", updatedDocs);
            }}
          />
        );
      case 9:
        return (
          <ContactStep
            state={state}
            errors={errors}
            onChange={setField}
            loading={loading}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      ref={formRef}
      variants={slideUp} initial="hidden" animate="show"
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-card p-8 md:p-10 shadow-lg border border-slate-200">
        <ProgressBar step={step} total={totalSteps} />

        {/* Step content — key forces remount (re-triggers fadeUp animation) */}
        <div key={step}>
          {renderStep()}
        </div>

        <NavButtons
          step={step}
          total={totalSteps}
          loading={loading}
          onBack={goBack}
          onNext={goNext}
          onSubmit={handleSubmit}
          onSkipSubmit={handleSkipSubmit}
        />
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-6 mt-6">
        {[
          { icon: <Lock className="w-4 h-4 text-slate-400" />, label: "No login required" },
          { icon: <Zap className="w-4 h-4 text-slate-400" />, label: "Results in seconds" },
          { icon: <Ban className="w-4 h-4 text-slate-400" />, label: "No sales pressure" },
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
