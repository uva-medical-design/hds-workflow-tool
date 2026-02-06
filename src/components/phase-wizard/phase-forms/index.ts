import type { ComponentType } from "react";
import { Phase1Form } from "./phase-1-form";
import { Phase2Form } from "./phase-2-form";
import { Phase3Form } from "./phase-3-form";
import { Phase4Form } from "./phase-4-form";
import { Phase5Form } from "./phase-5-form";
import { Phase6Form } from "./phase-6-form";
import { Phase7Form } from "./phase-7-form";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PhaseFormProps {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

const PHASE_FORMS: Record<number, ComponentType<PhaseFormProps>> = {
  1: Phase1Form,
  2: Phase2Form,
  3: Phase3Form,
  4: Phase4Form,
  5: Phase5Form,
  6: Phase6Form,
  7: Phase7Form,
};

export function getPhaseForm(phase: number): ComponentType<PhaseFormProps> {
  return PHASE_FORMS[phase] ?? Phase1Form;
}
