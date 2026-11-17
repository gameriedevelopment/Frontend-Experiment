import { Reorder } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { saveSeeding } from "../../api";
import { EntrantMark } from "../../components/EntrantMark";
import { useTournamentAction, useTournamentParticipants } from "../../hooks";
import type { HostedTournamentDetail, TournamentParticipant } from "../../types";

const seedable = ["registered", "checked_in"];

export function SeedingPanel({ tournament }: { tournament: HostedTournamentDetail }) {
  const participants = useTournamentParticipants(tournament.id);
  const [order, setOrder] = useState<TournamentParticipant[]>([]);
  const [changed, setChanged] = useState(false);
  const save = useTournamentAction(tournament.id, (ids: string[]) => saveSeeding(tournament.id, ids));
  const editable = tournament.seedingMethod === "manual" && ["registration", "check_in", "awaiting_start"].includes(tournament.phase);

  useEffect(() => {
    if (changed) return;
    setOrder(
      (participants.data ?? [])
        .filter((entrant) => seedable.includes(entrant.status))
        .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999) || a.registeredAt.localeCompare(b.registeredAt)),
    );
  }, [changed, participants.data]);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setChanged(true);
  };

  if (!editable) {
    return (
      <p className="rounded-2xl bg-white/3 px-4 py-3 text-sm text-mist-300 ring-1 ring-inset ring-white/6">
        {tournament.seedingMethod === "random"
          ? "Seeds are drawn at random when the bracket is generated. Switch to manual seeding in the settings to set them yourself."
          : "Seeding is fixed now that the bracket has been drawn."}
      </p>
    );
  }
  if (participants.isLoading) return <Skeleton className="h-64 rounded-card" />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist-400">Drag to reorder, or use the arrows. Seed 1 is the strongest. Top seeds get byes when the field is short.</p>
        <Button
          size="sm"
          icon="check"
          disabled={!changed || save.isPending}
          onClick={() =>
            save.mutate(
              order.map((entrant) => entrant.id),
              {
                onSuccess: () => {
                  setChanged(false);
                  toast.success("Seeding saved");
                },
              },
            )
          }
        >
          {save.isPending ? "Saving…" : "Save seeding"}
        </Button>
      </div>
      {save.isError && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(save.error, "The seeding couldn't be saved.")}
        </p>
      )}
      {order.length ? (
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={(next) => {
            setOrder(next);
            setChanged(true);
          }}
          className="grid gap-2"
        >
          {order.map((entrant, index) => (
            <Reorder.Item
              key={entrant.id}
              value={entrant}
              className="flex cursor-grab items-center gap-3 rounded-2xl bg-ink-900 px-3 py-2.5 ring-1 ring-inset ring-white/8 active:cursor-grabbing active:ring-lavender-400/50"
            >
              <Icon name="grip" className="size-4 text-mist-500" />
              <span className="type-display w-7 text-center text-base tabular-nums text-lavender-300">{index + 1}</span>
              <EntrantMark name={entrant.name} src={entrant.avatar} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entrant.name}</span>
              <button
                type="button"
                aria-label={`Move ${entrant.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/6 hover:text-mist-50 disabled:opacity-30"
              >
                <Icon name="arrowUp" className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Move ${entrant.name} down`}
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/6 hover:text-mist-50 disabled:opacity-30"
              >
                <Icon name="arrowDown" className="size-3.5" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <p className="text-sm text-mist-400">Seeds appear here as entrants register.</p>
      )}
    </div>
  );
}
