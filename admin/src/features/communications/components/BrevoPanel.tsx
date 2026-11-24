import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Panel } from "@/components/layout/Panel";
import { Facts } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { figure } from "@/lib/format";
import { toast } from "@/lib/toast";
import { communicationsKey, runBrevoResync } from "../api";
import type { BrevoReceipt } from "../types";

const CONFIRMATION = "CONFIRM CRM SYNC";

export function BrevoPanel() {
  const [receipt, setReceipt] = useState<BrevoReceipt | null>(null);
  const [mode, setMode] = useState<"dry" | "live" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const client = useQueryClient();
  const dryRun = mode === "dry";
  const reviewed = receipt?.dryRun === true;
  const counts: Array<[string, string]> = receipt ? [
    ["Pending", figure(receipt.total)],
    ["Valid", figure(receipt.valid)],
    ["Duplicates skipped", figure(receipt.duplicatesSkipped)],
  ] : [];
  if (receipt && !reviewed) counts.push(["Submitted", figure(receipt.synced)], ["Failed", figure(receipt.failed)]);

  const close = () => {
    setMode(null);
    setConfirmation("");
  };

  return (
    <Panel title="Brevo re-sync" description="Retry contacts marked as unsynced. Check the counts before submitting the import." bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
      {receipt && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3" aria-live="polite">
          <p className="text-sm font-semibold text-mist-100">{reviewed ? "Dry run recorded" : "Live run recorded"}</p>
          <Facts items={counts} />
          <p className="wrap-anywhere font-mono text-xs text-mist-400">Audit ID {receipt.auditId}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button tone="outline" size="sm" onClick={() => setMode("dry")}>Run dry check</Button>
        {reviewed && <Button size="sm" onClick={() => setMode("live")}>Run live sync</Button>}
      </div>
      {mode && (
        <ReasonDialog
          key={mode}
          title={dryRun ? "Check pending contacts?" : "Submit contacts to Brevo?"}
          description={dryRun ? "Shows the counts and records this check in the audit log." : "Submits email addresses, names, usernames and sign-up dates for import."}
          icon="refresh"
          tone={dryRun ? "brand" : "danger"}
          confirmLabel={dryRun ? "Run dry check" : "Run live sync"}
          ready={dryRun || (reviewed && confirmation === CONFIRMATION)}
          onClose={close}
          onConfirm={async (reason) => {
            const result = await runBrevoResync({ dryRun, reason, confirmation: dryRun ? undefined : confirmation });
            setReceipt(result);
            toast.success(dryRun ? "Dry run recorded" : "Live run recorded");
            void client.invalidateQueries({ queryKey: communicationsKey });
          }}
        >
          {!dryRun && <TextField id="brevo-confirmation" label={`Type ${CONFIRMATION}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} />}
        </ReasonDialog>
      )}
    </Panel>
  );
}
