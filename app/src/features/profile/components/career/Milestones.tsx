import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateField } from "@/components/ui/DateField";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { OptionCards } from "@/components/ui/OptionCards";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useUpdatePlayerProfile } from "../../hooks";
import type { PlayerProfile } from "../../types";
import { ProfileSection } from "../ProfileSection";

type Milestone = NonNullable<PlayerProfile["milestones"]>[number];
const types = ["achievement", "event", "career", "status", "other"] as const;
type MilestoneType = (typeof types)[number];

const typeMeta: Record<MilestoneType, { label: string; icon: IconName }> = {
  achievement: { label: "Achievement", icon: "trophy" },
  event: { label: "Event", icon: "calendar" },
  career: { label: "Career", icon: "team" },
  status: { label: "Status", icon: "spark" },
  other: { label: "Other", icon: "flag" },
};

const kindOf = (value?: string): MilestoneType => (types.includes(value as MilestoneType) ? (value as MilestoneType) : "other");
const dayOf = (item: Milestone) => String(item.date || item.createdAt || new Date().toISOString()).slice(0, 10);

export function Milestones({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const update = useUpdatePlayerProfile(profile.id);
  const milestones = profile.milestones ?? [];
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", date: new Date().toISOString().slice(0, 10), type: "career" as MilestoneType });

  const normalized = (items: Milestone[]) =>
    items.map((item) => ({
      title: item.title || "Milestone",
      description: item.description || "",
      date: dayOf(item),
      type: kindOf(item.type),
      ...(item.icon ? { icon: item.icon } : {}),
    }));

  const begin = (index: number | "new") => {
    const current = index === "new" ? null : milestones[index];
    setDraft({
      title: current?.title ?? "",
      description: current?.description ?? "",
      date: current ? dayOf(current) : new Date().toISOString().slice(0, 10),
      type: kindOf(current?.type ?? "career"),
    });
    setEditing(index);
  };

  const save = async () => {
    const items = normalized(milestones);
    const value = { title: draft.title.trim() || "Milestone", description: draft.description.trim(), date: draft.date, type: draft.type };
    if (editing === "new") items.push(value);
    else if (typeof editing === "number") items[editing] = value;
    try {
      await update.mutateAsync({ milestones: items });
      toast.success(editing === "new" ? "Milestone added" : "Milestone updated");
      setEditing(null);
    } catch {
      // Shown in the dialog.
    }
  };

  const ordered = milestones.map((item, index) => ({ item, index })).sort((a, b) => dayOf(b.item).localeCompare(dayOf(a.item)));
  const visible = expanded ? ordered : ordered.slice(0, 4);

  return (
    <ProfileSection
      title="Milestones"
      meta={
        own ? (
          <Button tone="ghost" size="sm" icon="plus" className="-mr-3" onClick={() => begin("new")}>
            Add
          </Button>
        ) : undefined
      }
    >
      {visible.length ? (
        <ol className="grid">
          {visible.map(({ item, index }, position) => {
            const meta = typeMeta[kindOf(item.type)];
            return (
              <li key={`${item.title}-${index}`} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 pb-5 last:pb-0">
                {position < visible.length - 1 && <span aria-hidden="true" className="absolute left-4.25 top-10 h-[calc(100%-2.5rem)] w-px bg-white/10" />}
                <span className="grid size-9 place-items-center rounded-xl bg-lavender-400/12 text-lavender-300">
                  <Icon name={meta.icon} weight="duotone" className="size-[1.1rem]" />
                </span>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold">{item.title || "Milestone"}</p>
                    <p className="mt-0.5 text-xs text-mist-500">
                      {meta.label} ·{" "}
                      {new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(dayOf(item)))}
                    </p>
                    {item.description && <p className="mt-2 text-sm leading-relaxed text-mist-300">{item.description}</p>}
                  </div>
                  {own && (
                    <Menu
                      label={`Options for ${item.title || "milestone"}`}
                      items={[
                        { label: "Edit", icon: "edit", onSelect: () => begin(index) },
                        { label: "Remove", icon: "trash", danger: true, onSelect: () => setRemoving(index) },
                      ]}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-mist-400">
          {own ? "Mark the moments that shaped you: first team, first title, going pro." : "No milestones shared yet."}
        </p>
      )}
      {ordered.length > 4 && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-4 text-sm font-medium text-lavender-300 hover:text-lavender-200">
          {expanded ? "Show fewer" : `Show all ${ordered.length}`}
        </button>
      )}

      {editing !== null && (
        <Dialog
          open
          title={editing === "new" ? "Add a milestone" : "Edit milestone"}
          icon="flag"
          size="lg"
          onClose={() => setEditing(null)}
          dismissible={!update.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={update.isPending || !draft.title.trim() || !draft.date} onClick={() => void save()}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div className="grid gap-5">
            <OptionCards
              legend="Kind"
              columns={3}
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
              options={types.map((type) => ({ value: type, label: typeMeta[type].label, icon: typeMeta[type].icon }))}
            />
            <TextField id="m-title" label="Title" maxLength={100} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Joined Denver Drift" />
            <DateField id="m-date" label="Date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
            <TextAreaField id="m-description" label="Details (optional)" maxLength={500} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            {update.isError && (
              <p role="alert" className="text-sm text-danger">
                {getApiErrorMessage(update.error, "It couldn't be saved.")}
              </p>
            )}
          </div>
        </Dialog>
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this milestone?"
        description="It's taken off your career timeline."
        confirmLabel="Remove"
        pending={update.isPending}
        onConfirm={() =>
          removing !== null &&
          update.mutate(
            { milestones: normalized(milestones).filter((_, index) => index !== removing) },
            {
              onSuccess: () => {
                setRemoving(null);
                toast.info("Milestone removed");
              },
            },
          )
        }
        onClose={() => setRemoving(null)}
      />
    </ProfileSection>
  );
}
