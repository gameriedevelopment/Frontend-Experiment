import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { getApiErrorMessage } from "@/lib/errors";
import type { ReportReason } from "../api";
import { useReportChallengeScore } from "../hooks";
import type { Challenge } from "../types";

// The report endpoint takes a generic moderation type; these are the result problems each one stands for.
const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "other", label: "The result is wrong" },
  { value: "inappropriate", label: "Wrong winner" },
  { value: "spam", label: "Score not agreed" },
  { value: "harassment", label: "Something else" },
];

export function ReportDialog({
  challenge,
  open,
  onReported,
  onClose,
}: {
  challenge: Challenge;
  open: boolean;
  onReported: () => void;
  onClose: () => void;
}) {
  const report = useReportChallengeScore();
  const [type, setType] = useState<ReportReason>("other");
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState("");
  const authorId =
    challenge.type === "team"
      ? challenge.challengerTeamId || challenge.initiatedBy || ""
      : challenge.challengerId || challenge.initiatedBy || "";

  const submit = async () => {
    if (reason.trim().length < 10) return setInvalid("Describe the problem in at least 10 characters.");
    setInvalid("");
    try {
      await report.mutateAsync({ challengeId: challenge.id, contentAuthorId: authorId, type, reason: reason.trim() });
      onReported();
    } catch {
      // Shown below the form.
    }
  };

  return (
    <Dialog
      open={open}
      title="Report this result"
      description="Gamerie reviews reported results. Both sides are notified of the outcome."
      onClose={onClose}
      dismissible={!report.isPending}
      size="lg"
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={report.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={report.isPending} onClick={() => void submit()}>
            {report.isPending ? "Sending…" : "Send report"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <ChoiceGroup legend="What's wrong?" columns={2}>
          {reasons.map((item) => (
            <ChoiceChip
              key={item.value}
              name="report-reason"
              value={item.value}
              checked={type === item.value}
              onChange={() => setType(item.value)}
              label={item.label}
            />
          ))}
        </ChoiceGroup>
        <TextAreaField
          id="report-details"
          label="Details"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="What happened, and what the result should be."
          error={invalid}
        />
        {report.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(report.error, "The report could not be sent.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
