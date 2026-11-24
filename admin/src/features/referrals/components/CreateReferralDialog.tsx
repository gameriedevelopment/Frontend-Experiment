import { useState } from "react";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { TextField } from "@/components/ui/Field";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { createReferralCode } from "../api";

export function CreateReferralDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [code, setCode] = useState("");
  const [source, setSource] = useState("");
  const [expiry, setExpiry] = useState("");
  const [errors, setErrors] = useState<{ code?: string; source?: string; expiry?: string }>({});

  return (
    <ReasonDialog
      title="Create referral code"
      confirmLabel="Create code"
      icon="gift"
      tone="brand"
      size="lg"
      onClose={onClose}
      validate={() => {
        const next: typeof errors = {};
        if (!/^[A-Z0-9_-]{3,32}$/.test(code.trim())) next.code = "Use 3–32 letters, numbers, underscores or hyphens.";
        if (source.trim().length < 2) next.source = "Enter a partner or campaign name.";
        if (expiry && !(new Date(expiry).getTime() > Date.now())) next.expiry = "Choose a time in the future.";
        setErrors(next);
        return Object.keys(next).length === 0;
      }}
      onConfirm={async (reason) => {
        const record = await createReferralCode({
          code: code.trim(),
          source: source.trim(),
          expiresAt: expiry ? fromLocalInput(expiry) : undefined,
          reason,
        });
        onCreated(record.id);
      }}
    >
      <TextField id="referral-code" label="Code" value={code} maxLength={32} error={errors.code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
      <TextField id="referral-source" label="Source" value={source} maxLength={255} error={errors.source} onChange={(event) => setSource(event.target.value)} />
      <TextField id="referral-expiry" label="Expiry (optional)" type="datetime-local" value={expiry} min={toLocalInput(new Date().toISOString())} error={errors.expiry} onChange={(event) => setExpiry(event.target.value)} />
    </ReasonDialog>
  );
}
