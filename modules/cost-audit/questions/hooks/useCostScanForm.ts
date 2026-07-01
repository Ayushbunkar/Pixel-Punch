"use client";

import { useState, useCallback } from "react";
import {
  FormState,
  INITIAL_FORM_STATE,
  ValidationErrors,
  AI_DEPENDENCE_VALUES,
  SPEND_BAND_VALUES,
  SPEND_VISIBILITY_VALUES,
  UNIT_ECONOMICS_VALUES,
  MAIN_PAIN_VALUES,
  LEAKAGE_PATTERN_VALUES,
  OPTIMIZATION_DONE_VALUES,
  SAVINGS_THRESHOLD_VALUES,
  UnitEconomic,
  OptimizationDone,
  isValidEnum,
} from "@/modules/cost-audit/types";

const TOTAL_STEPS = 9;

// ─────────────────────────────────────────────────────────────────────────────
// Per-step validation
// ─────────────────────────────────────────────────────────────────────────────
function validateStep(step: number, state: FormState): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (step) {
    case 1:
      if (!state.ai_dependence || !isValidEnum(state.ai_dependence, AI_DEPENDENCE_VALUES))
        errors.ai_dependence = "Please select an option.";
      break;

    case 2:
      if (!state.monthly_spend_band || !isValidEnum(state.monthly_spend_band, SPEND_BAND_VALUES))
        errors.monthly_spend_band = "Please select your spend band.";
      if (!state.spend_visibility || !isValidEnum(state.spend_visibility, SPEND_VISIBILITY_VALUES))
        errors.spend_visibility = "Please select your visibility level.";
      break;

    case 3: {
      if (state.unit_economics.length === 0) {
        errors.unit_economics = "Please select at least one option.";
        break;
      }
      const invalidUE = state.unit_economics.filter(
        (v) => !isValidEnum(v, UNIT_ECONOMICS_VALUES),
      );
      if (invalidUE.length > 0) {
        errors.unit_economics = "Invalid selection.";
        break;
      }
      if (
        state.unit_economics.includes("none") &&
        state.unit_economics.length > 1
      ) {
        errors.unit_economics =
          '"We don\'t measure unit economics" must be selected alone.';
      }
      break;
    }

    case 4:
      if (!state.main_pain || !isValidEnum(state.main_pain, MAIN_PAIN_VALUES))
        errors.main_pain = "Please select an option.";
      break;

    case 5:
      if (!state.leakage_pattern || !isValidEnum(state.leakage_pattern, LEAKAGE_PATTERN_VALUES))
        errors.leakage_pattern = "Please select an option.";
      break;

    case 6: {
      if (state.optimization_done.length === 0) {
        errors.optimization_done = "Please select at least one option.";
        break;
      }
      const invalidOD = state.optimization_done.filter(
        (v) => !isValidEnum(v, OPTIMIZATION_DONE_VALUES),
      );
      if (invalidOD.length > 0) {
        errors.optimization_done = "Invalid selection.";
        break;
      }
      if (
        state.optimization_done.includes("none_adhoc") &&
        state.optimization_done.length > 1
      ) {
        errors.optimization_done =
          '"None / only ad-hoc" must be selected alone.';
      }
      break;
    }

    case 7:
      if (!state.savings_threshold || !isValidEnum(state.savings_threshold, SAVINGS_THRESHOLD_VALUES))
        errors.savings_threshold = "Please select an option.";
      break;

    case 8:
      if (state.website_url.trim()) {
        if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(state.website_url.trim())) {
          errors.website_url = "Please enter a valid website URL.";
        }
      }
      break;

    case 9:
      if (!state.firstname.trim()) errors.firstname = "Name is required.";
      if (!state.email.trim())     errors.email     = "Work email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email))
        errors.email = "Please enter a valid email address.";
      break;
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useCostScanForm(initialRef?: string) {
  const [state, setState] = useState<FormState>({
    ...INITIAL_FORM_STATE,
    ref: initialRef ?? "",
  });
  const [step, setStep]         = useState(1);
  const [errors, setErrors]     = useState<ValidationErrors>({});
  const [touched, setTouched]   = useState(false);

  // ── Setters ──────────────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  // ── Multi-select toggle helpers ──────────────────────────────────────────

  /** Toggle a unit_economics option, enforcing the "none" exclusive rule */
  const toggleUnitEconomic = useCallback((value: UnitEconomic) => {
    setState((prev) => {
      const current = prev.unit_economics;
      if (value === "none") {
        // If already selected, deselect it (return empty array)
        if (current.includes("none")) {
          return { ...prev, unit_economics: [] };
        }
        // Selecting "none" clears everything else
        return { ...prev, unit_economics: ["none"] };
      }
      // Selecting a metric clears "none" if present
      const without = current.filter((v) => v !== "none" && v !== value);
      const included = current.includes(value);
      return {
        ...prev,
        unit_economics: included ? without : [...without, value],
      };
    });
    setErrors((prev) => ({ ...prev, unit_economics: undefined }));
  }, []);

  /** Toggle an optimization_done option, enforcing "none_adhoc" exclusive rule */
  const toggleOptimization = useCallback((value: OptimizationDone) => {
    setState((prev) => {
      const current = prev.optimization_done;
      if (value === "none_adhoc") {
        // If already selected, deselect it (return empty array)
        if (current.includes("none_adhoc")) {
          return { ...prev, optimization_done: [] };
        }
        return { ...prev, optimization_done: ["none_adhoc"] };
      }
      const without = current.filter(
        (v) => v !== "none_adhoc" && v !== value,
      );
      const included = current.includes(value);
      return {
        ...prev,
        optimization_done: included ? without : [...without, value],
      };
    });
    setErrors((prev) => ({ ...prev, optimization_done: undefined }));
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setTouched(true);
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false; // validation failed
    }
    setErrors({});
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
    return true;
  }, [step, state]);

  const goBack = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }, []);

  // ── Final validation (full form, for submit) ──────────────────────────────

  const validateAll = useCallback((): ValidationErrors => {
    let all: ValidationErrors = {};
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      all = { ...all, ...validateStep(s, state) };
    }
    setErrors(all);
    return all;
  }, [state]);

  return {
    state,
    step,
    errors,
    touched,
    totalSteps: TOTAL_STEPS,
    setField,
    toggleUnitEconomic,
    toggleOptimization,
    goNext,
    goBack,
    validateAll,
  };
}
