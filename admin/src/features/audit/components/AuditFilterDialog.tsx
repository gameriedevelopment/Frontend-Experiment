import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import type { AuditFilters } from "../types";

export const validId = (value: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
export const dateParam = (value: string) => value && Number.isFinite(Date.parse(value)) ? value : undefined;

export function AuditFilterDialog({ filters, onApply, onClose }: {
  filters: AuditFilters;
  onApply: (filters: AuditFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AuditFilters>(() => ({
    ...filters,
    from: toLocalInput(dateParam(filters.from)),
    to: toLocalInput(dateParam(filters.to)),
  }));
  const [errors, setErrors] = useState<Partial<AuditFilters>>({});
  const change = (key: keyof AuditFilters, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const apply = (event: FormEvent) => {
    event.preventDefault();
    const actorId = draft.actorId.trim();
    const targetId = draft.targetId.trim();
    const nextErrors: Partial<AuditFilters> = {};
    if (actorId && !validId(actorId)) nextErrors.actorId = "Enter a valid administrator ID.";
    if (targetId && !validId(targetId)) nextErrors.targetId = "Enter a valid target ID.";
    if (draft.from && !dateParam(draft.from)) nextErrors.from = "Enter a valid start time.";
    if (draft.to && !dateParam(draft.to)) nextErrors.to = "Enter a valid end time.";
    if (draft.from && draft.to && Date.parse(draft.from) > Date.parse(draft.to)) {
      nextErrors.to = "Choose an end time after the start.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onApply({ actorId, targetId, action: draft.action.trim(), from: fromLocalInput(draft.from), to: fromLocalInput(draft.to) });
  };

  return (
    <Dialog open title="Audit filters" icon="search" onClose={onClose}
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="audit-filter-form">Apply filters</Button>
        </>
      }
    >
      <form id="audit-filter-form" onSubmit={apply} className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <TextField id="audit-action" label="Action code" placeholder="user.ban" maxLength={80} value={draft.action} onChange={(event) => change("action", event.target.value)} />
        <TextField id="audit-actor" label="Administrator ID" value={draft.actorId} error={errors.actorId} onChange={(event) => change("actorId", event.target.value)} />
        <TextField id="audit-target" label="Target ID" value={draft.targetId} error={errors.targetId} onChange={(event) => change("targetId", event.target.value)} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <TextField id="audit-from" label="From" type="datetime-local" value={draft.from} error={errors.from} onChange={(event) => change("from", event.target.value)} />
          <TextField id="audit-to" label="To" type="datetime-local" value={draft.to} error={errors.to} onChange={(event) => change("to", event.target.value)} />
        </div>
      </form>
    </Dialog>
  );
}
