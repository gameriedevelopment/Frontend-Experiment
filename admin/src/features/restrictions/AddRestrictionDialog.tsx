import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { SearchField } from "@/components/data/SearchField";
import { useSearch } from "@/features/people/hooks";
import type { SearchResult } from "@/features/people/types";
import { cn } from "@/lib/cn";
import { addRestriction } from "./api";

type Area = "creator" | "hosting";

/** Lock or ban someone from creating competitions. Account bans live on the player's own page. */
export function AddRestrictionDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [area, setArea] = useState<Area>("creator");
  const [kind, setKind] = useState<"locked" | "banned">("locked");
  const [term, setTerm] = useState("");
  const [subject, setSubject] = useState<SearchResult | null>(null);
  const search = useSearch(term);
  const kinds = area === "creator" ? ["user", "hub"] : ["user"];
  const results = (search.data ?? []).filter((result) => kinds.includes(result.kind)).slice(0, 6);

  return (
    <ReasonDialog
      title="Add a restriction"
      description="To ban a whole account, team or hub, use Ban on its page."
      confirmLabel={kind === "locked" ? "Lock" : "Ban"}
      icon="prohibit"
      size="lg"
      ready={Boolean(subject)}
      onClose={onClose}
      onConfirm={(reason) =>
        addRestriction({ area, kind, reason, subject: { kind: subject!.kind as "user" | "hub", id: subject!.id } }).then(onAdded)
      }
    >
      <OptionCards
        legend="What to restrict"
        value={area}
        onChange={(next) => {
          setArea(next);
          if (next === "hosting" && subject?.kind === "hub") setSubject(null);
        }}
        options={[
          { value: "creator", label: "Ladders and leagues", description: "Creating new ones, for a player or a hub", icon: "ladders" },
          { value: "hosting", label: "Tournaments", description: "Hosting new ones, for a player", icon: "trophy" },
        ]}
      />
      <OptionCards
        legend="How"
        value={kind}
        onChange={setKind}
        options={[
          { value: "locked", label: "Lock", description: "They see your reason when they try", icon: "lock" },
          { value: "banned", label: "Ban", description: "Banned outright, no reason shown", icon: "prohibit" },
        ]}
      />
      <div className="grid gap-2">
        <p className="text-sm font-medium">{area === "creator" ? "Player or hub" : "Player"}</p>
        {subject ? (
          <div className="flex items-center gap-3 rounded-2xl bg-lavender-400/8 px-3.5 py-2.5 ring-1 ring-inset ring-lavender-400/35">
            <Avatar src={subject.image ?? undefined} name={subject.title} size="sm" tone={subject.kind === "user" ? "brand" : "ink"} shape={subject.kind === "user" ? "circle" : "square"} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{subject.title}</span>
              {subject.subtitle && <span className="block truncate font-mono text-[0.68rem] text-mist-500">{subject.subtitle}</span>}
            </span>
            <button type="button" aria-label="Choose someone else" onClick={() => setSubject(null)} className="grid size-7 place-items-center rounded-full text-mist-400 hover:bg-white/8 hover:text-mist-50">
              <Icon name="close" className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <SearchField value={term} onChange={setTerm} placeholder={area === "creator" ? "Search players and hubs" : "Search players"} />
            {term.trim().length >= 2 && (
              <ul className="grid gap-1">
                {results.length === 0 ? (
                  <li className="px-2 py-3 text-sm text-mist-400">{search.isFetching ? "Searching…" : "No one matches that."}</li>
                ) : (
                  results.map((result) => (
                    <li key={`${result.kind}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => setSubject(result)}
                        className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5")}
                      >
                        <Avatar src={result.image ?? undefined} name={result.title} size="sm" tone={result.kind === "user" ? "brand" : "ink"} shape={result.kind === "user" ? "circle" : "square"} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{result.title}</span>
                          {result.subtitle && <span className="block truncate font-mono text-[0.68rem] text-mist-500">{result.subtitle}</span>}
                        </span>
                        <span className="type-label text-[0.55rem] text-mist-500">{result.kind === "user" ? "Player" : "Hub"}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </ReasonDialog>
  );
}
