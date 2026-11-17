import type { DraftForm, StepErrors } from "./draftForm";

export type SectionUpdater = <K extends keyof DraftForm>(
  section: K,
  patch: Partial<DraftForm[K]>,
) => void;

export interface StepProps {
  form: DraftForm;
  update: SectionUpdater;
  errors: StepErrors;
  /** Fields the server will no longer accept changes to (after registrations or the start). */
  locked: Set<string>;
}
