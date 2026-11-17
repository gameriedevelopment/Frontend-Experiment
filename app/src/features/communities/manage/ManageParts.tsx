import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { useSearchResults } from "@/features/discovery/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { memberName, memberUserId, type Community } from "../format";
import { useDeleteCommunity, useTransferCommunityOwnership } from "../hooks";
import type { CommunityKind, CommunityUser } from "../types";

export const fail = (title: string) => (error: unknown) => toast.error(title, getApiErrorMessage(error, "Try again in a moment."));

export function Section({ title, description, meta, children, tone }: { title: string; description?: string; meta?: ReactNode; children: ReactNode; tone?: "danger" }) {
  return (
    <section className={cn("rounded-card p-5 ring-1 ring-inset sm:p-6", tone === "danger" ? "bg-danger/4 ring-danger/20" : "bg-ink-900/60 ring-white/6")}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2.5 text-base font-semibold">
            {title}
            {typeof meta === "number" && meta > 0 ? <span className="rounded-full bg-white/7 px-2 py-0.5 text-xs font-medium tabular-nums text-mist-300">{meta}</span> : null}
          </h3>
          {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
        </div>
        {typeof meta !== "number" && meta}
      </header>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-white/2 px-4 py-6 text-center text-sm text-mist-500 ring-1 ring-inset ring-white/5">{children}</p>;
}

/** A person or team waiting on an answer, with whatever actions fit the request. */
export function RequestRow({ name, image, detail, at, children, square }: { name: string; image?: string; detail?: string; at?: string; children?: ReactNode; square?: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-3 ring-1 ring-inset ring-white/6">
      <Avatar src={image} name={name} tone={square ? "ink" : "brand"} className={square ? "rounded-xl" : "rounded-full"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block truncate text-xs text-mist-500">{[detail, at ? timeAgo(at) : null].filter(Boolean).join(" · ") || "Waiting"}</span>
      </span>
      {children && <span className="flex gap-1.5">{children}</span>}
    </li>
  );
}

export const userName = (user?: CommunityUser) => user?.displayName || user?.username || "Player";

/** Search players or teams and pick one. */
export function EntityPicker({
  id,
  kind,
  label,
  value,
  onChange,
}: {
  id: string;
  kind: "players" | "teams";
  label: string;
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const term = useDebouncedValue(query);
  const players = useSearchResults("players", term, kind === "players");
  const teams = useSearchResults("teams", term, kind === "teams");
  const options = useMemo<ComboboxOption[]>(
    () =>
      kind === "teams"
        ? (teams.data?.data ?? []).map((team) => ({ value: team.id, label: team.name, image: team.logo }))
        : (players.data?.data ?? []).map((player) => ({ value: player.id, label: player.username, description: player.gamerTitle, image: player.profileImage })),
    [kind, players.data, teams.data],
  );
  return (
    <Combobox
      id={id}
      label={label}
      placeholder={kind === "teams" ? "Search teams" : "Search players"}
      query={query}
      onQueryChange={setQuery}
      options={options}
      loading={(kind === "teams" ? teams : players).isFetching}
      value={value}
      onChange={onChange}
      avatars
    />
  );
}

/** Ownership transfer and deletion. Both ask for the community's name, typed out. */
export function DangerZone({ kind, item }: { kind: CommunityKind; item: Community }) {
  const navigate = useNavigate();
  const transfer = useTransferCommunityOwnership(kind, item.id, item.slug || item.id);
  const remove = useDeleteCommunity(kind, item.id);
  const [dialog, setDialog] = useState<"transfer" | "delete" | null>(null);
  const [newOwner, setNewOwner] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const candidates = (item.members ?? []).filter((member) => member.isActive !== false && memberUserId(member) && memberUserId(member) !== item.ownerId);
  const close = () => {
    setDialog(null);
    setConfirmation("");
    setNewOwner("");
  };

  if (!item.viewerRelationship?.isOwner) return null;

  return (
    <Section title="Ownership" description={`Only the owner sees this. Both actions affect everyone in the ${kind}.`} tone="danger">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6">
          <p className="text-sm font-semibold">Transfer ownership</p>
          <p className="mt-1 text-sm text-mist-400">Hand the {kind} to another member. You stay on as a member.</p>
          <Button tone="outline" size="sm" icon="transfer" className="mt-4" disabled={!candidates.length} onClick={() => setDialog("transfer")}>
            Transfer
          </Button>
          {!candidates.length && <p className="mt-2 text-xs text-mist-500">Add a member first.</p>}
        </div>
        <div className="rounded-2xl bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6">
          <p className="text-sm font-semibold">Delete {kind}</p>
          <p className="mt-1 text-sm text-mist-400">Removes the {kind}, its posts and memberships for good.</p>
          <Button tone="outline" size="sm" icon="trash" className="mt-4 text-danger" onClick={() => setDialog("delete")}>
            Delete
          </Button>
        </div>
      </div>

      {dialog && (
        <Dialog
          open
          title={dialog === "transfer" ? `Transfer ${item.name}` : `Delete ${item.name}?`}
          description={dialog === "transfer" ? "The new owner gets every permission, including deleting the " + kind + "." : "This can't be undone."}
          icon={dialog === "transfer" ? "transfer" : "trash"}
          tone="danger"
          onClose={close}
          dismissible={!transfer.isPending && !remove.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={confirmation !== item.name || (dialog === "transfer" && !newOwner) || transfer.isPending || remove.isPending}
                onClick={() =>
                  dialog === "transfer"
                    ? transfer.mutate(newOwner, { onSuccess: () => (close(), toast.success("Ownership transferred")), onError: fail("Couldn't transfer ownership") })
                    : remove.mutate(undefined, {
                        onSuccess: () => {
                          toast.info(`${item.name} was deleted`);
                          navigate(`/${kind}s`, { replace: true });
                        },
                        onError: fail(`Couldn't delete the ${kind}`),
                      })
                }
              >
                {dialog === "transfer" ? (transfer.isPending ? "Transferring…" : "Transfer ownership") : remove.isPending ? "Deleting…" : `Delete ${kind}`}
              </Button>
            </>
          }
        >
          <div className="grid gap-5">
            {dialog === "transfer" && (
              <fieldset className="grid min-w-0 gap-2">
                <legend className="mb-2 text-sm font-medium">New owner</legend>
                <div className="grid max-h-60 gap-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/12">
                  {candidates.map((member) => (
                    <label
                      key={memberUserId(member)}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-inset transition-colors",
                        newOwner === memberUserId(member) ? "bg-lavender-400/10 ring-lavender-400/50" : "ring-white/8 hover:bg-white/3",
                      )}
                    >
                      <input type="radio" name="new-owner" className="sr-only" checked={newOwner === memberUserId(member)} onChange={() => setNewOwner(memberUserId(member))} />
                      <Avatar src={member.user?.profileImage} name={memberName(member)} size="sm" className="rounded-full" />
                      <span className="text-sm font-semibold">{memberName(member)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <TextField id="confirm-name" label={`Type ${item.name} to confirm`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </div>
        </Dialog>
      )}
    </Section>
  );
}
