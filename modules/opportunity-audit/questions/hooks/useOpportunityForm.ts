"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FormState,
  INITIAL_FORM_STATE,
  ValidationErrors,
  BUSINESS_TYPE_VALUES,
  MAIN_OUTCOME_VALUES,
  BIGGEST_CHALLENGE_VALUES,
  DATA_SYSTEMS_VALUES,
  AUTOMATION_BARRIERS_VALUES,
  WORKFLOW_STANDARDIZATION_VALUES,
  MANUAL_PROCESSES_VALUES,
  INFO_RETRIEVAL_VALUES,
  SYSTEMS_CONNECTION_VALUES,
  DATA_QUALITY_VALUES,
  INQUIRY_HANDLING_VALUES,
  REQUEST_TYPES_VALUES,
  LEAD_QUALIFICATION_VALUES,
  DESIRED_USE_CASE_VALUES,
  ADOPTION_BLOCKER_VALUES,
  COMPANY_SIZE_VALUES,
  isValidEnum,
} from "../../types";

const TOTAL_STEPS = 5;
const STORAGE_KEY = "pixelpunch_opportunity_form_progress";

function validateStep(step: number, state: FormState): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (step) {
    case 1: // Context
      if (!state.business_type || !isValidEnum(state.business_type, BUSINESS_TYPE_VALUES))
        errors.business_type = "Please select your business type.";
      if (!state.main_outcome || !isValidEnum(state.main_outcome, MAIN_OUTCOME_VALUES))
        errors.main_outcome = "Please select your target outcome.";
      if (!state.biggest_challenge || !isValidEnum(state.biggest_challenge, BIGGEST_CHALLENGE_VALUES))
        errors.biggest_challenge = "Please select your biggest challenge.";
      break;

    case 2: // Data Systems
      if (state.data_systems.length === 0)
        errors.data_systems = "Please select at least one system.";
      if (!state.automation_barriers || !isValidEnum(state.automation_barriers, AUTOMATION_BARRIERS_VALUES))
        errors.automation_barriers = "Please select your main automation barrier.";
      if (!state.workflow_standardization || !isValidEnum(state.workflow_standardization, WORKFLOW_STANDARDIZATION_VALUES))
        errors.workflow_standardization = "Please select workflow standardization level.";
      break;

    case 3: // Workflows & Quality
      if (state.manual_processes.length === 0)
        errors.manual_processes = "Please select at least one manual process.";
      if (!state.info_retrieval || !isValidEnum(state.info_retrieval, INFO_RETRIEVAL_VALUES))
        errors.info_retrieval = "Please select how you find information.";
      if (!state.systems_connection || !isValidEnum(state.systems_connection, SYSTEMS_CONNECTION_VALUES))
        errors.systems_connection = "Please select systems connectivity.";
      if (!state.data_quality || !isValidEnum(state.data_quality, DATA_QUALITY_VALUES))
        errors.data_quality = "Please select data quality level.";
      break;

    case 4: // Operations
      if (!state.inquiry_handling || !isValidEnum(state.inquiry_handling, INQUIRY_HANDLING_VALUES))
        errors.inquiry_handling = "Please select inquiry handling method.";
      if (!state.request_types || !isValidEnum(state.request_types, REQUEST_TYPES_VALUES))
        errors.request_types = "Please select common request type.";
      if (!state.lead_qualification || !isValidEnum(state.lead_qualification, LEAD_QUALIFICATION_VALUES))
        errors.lead_qualification = "Please select lead qualification method.";
      break;

    case 5: // AI Strategy
      if (!state.desired_use_case || !isValidEnum(state.desired_use_case, DESIRED_USE_CASE_VALUES))
        errors.desired_use_case = "Please select the highest-value AI use case.";
      if (!state.adoption_blocker || !isValidEnum(state.adoption_blocker, ADOPTION_BLOCKER_VALUES))
        errors.adoption_blocker = "Please select AI adoption blocker.";
      break;


  }

  return errors;
}

export function useOpportunityForm(initialRef?: string) {
  const [state, setState] = useState<FormState>(INITIAL_FORM_STATE);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load progress on mount ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...INITIAL_FORM_STATE,
          ...parsed.state,
          ref: initialRef ?? parsed.state.ref ?? "op-landing",
        });
        setStep(parsed.step || 1);
      } else if (initialRef) {
        setState((prev) => ({ ...prev, ref: initialRef }));
      }
    } catch (e) {
      console.error("Failed to load form progress", e);
    }
    setIsLoaded(true);
  }, [initialRef]);

  // ── Save progress on state change ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, step })
      );
    } catch (e) {
      console.error("Failed to save form progress", e);
    }
  }, [state, step, isLoaded]);

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const toggleArrayValue = useCallback(
    <K extends "data_systems" | "manual_processes">(
      field: K,
      value: FormState[K][number]
    ) => {
      setState((prev) => {
        const current = prev[field] as string[];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [field]: updated };
      });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const goNext = useCallback(() => {
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
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

  const validateAll = useCallback((): ValidationErrors => {
    let allErrors: ValidationErrors = {};
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      allErrors = { ...allErrors, ...validateStep(s, state) };
    }
    setErrors(allErrors);
    return allErrors;
  }, [state]);

  const resetForm = useCallback(() => {
    setState({ ...INITIAL_FORM_STATE, ref: initialRef ?? "op-landing" });
    setStep(1);
    setErrors({});
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, [initialRef]);

  return {
    state,
    step,
    errors,
    totalSteps: TOTAL_STEPS,
    isLoaded,
    setField,
    toggleArrayValue,
    goNext,
    goBack,
    validateAll,
    resetForm,
  };
}
