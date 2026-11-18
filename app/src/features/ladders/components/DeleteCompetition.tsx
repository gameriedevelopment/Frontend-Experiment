import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";

type Outcome = { outcome: "deleted" | "removed" };

/**
 * Delete for a ladder or league. The server decides: with nothing played it is deleted for good;
 * once matches are played it is removed instead, so players keep their results.
 */
export function DeleteCompetition({ kind, name, onDelete }: { kind: "ladder" | "league"; name: string; onDelete: () => Promise<Outcome> }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const remove = useMutation({
    mutationFn: onDelete,
    onSuccess: ({ outcome }) => {
      toast.info(outcome === "deleted" ? `${name} was deleted` : `${name} was removed`, outcome === "removed" ? "Matches already played stay on players' records." : undefined);
      navigate(`/${kind}s`, { replace: true });
      void client.invalidateQueries({ queryKey: [`${kind}s`] });
    },
  });
  const close = () => {
    if (remove.isPending) return;
    setOpen(false);
    setConfirmation("");
    remove.reset();
  };

  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-danger/25 sm:p-6">
      <h2 className="text-base font-semibold">Delete {kind}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-mist-400">
        If no match has been played, the {kind} is deleted for good. Once matches are played it's removed instead: it disappears for everyone, results stay on players' records, and Gamerie can restore it.
      </p>
      <Button tone="outline" size="sm" icon="trash" className="mt-4 text-danger" onClick={() => setOpen(true)}>
        Delete {kind}
      </Button>
      {open && (
        <Dialog
          open
          title={`Delete ${name}?`}
          description={`Everyone in it is told. If matches were played, the ${kind} is removed rather than deleted.`}
          icon="trash"
          tone="danger"
          onClose={close}
          dismissible={!remove.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button size="sm" disabled={confirmation !== name || remove.isPending} onClick={() => remove.mutate()}>
                {remove.isPending ? "Deleting…" : `Delete ${kind}`}
              </Button>
            </>
          }
        >
          <div className="grid gap-3">
            <TextField
              id={`delete-${kind}-name`}
              label={
                <>
                  Type <strong className="font-semibold text-mist-50">{name}</strong> to confirm
                </>
              }
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
            {remove.isError && <p className="text-sm text-danger">{getApiErrorMessage(remove.error, `The ${kind} couldn't be deleted. Try again.`)}</p>}
          </div>
        </Dialog>
      )}
    </section>
  );
}
