import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useCreateConversation, useRecipientSearch, useUserTeams } from "../hooks";
import type { MessageConversation, RecipientTeam, RecipientUser } from "../types";

export function NewConversationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (conversation: MessageConversation, tab: "user" | "team") => void }) {
  const user = useAuthStore((state) => state.user);
  const [type, setType] = useState<"user" | "team">("user");
  const [query, setQuery] = useState("");
  const term = useDebouncedValue(query.trim());
  const results = useRecipientSearch(type, term);
  const myTeams = useUserTeams(user?.id);
  const create = useCreateConversation();
  const memberOf = new Set((myTeams.data ?? []).map((team) => team.id));

  const start = (entry: RecipientUser | RecipientTeam) => {
    if (!user) return;
    if (type === "user") {
      const person = entry as RecipientUser;
      create.mutate(
        { participantIds: [user.id, person.id], type: "user", name: person.displayName || person.username, avatar: person.profileImage ?? undefined },
        { onSuccess: (conversation) => onCreated(conversation, "user"), onError: (error) => toast.error("Couldn't start the conversation", getApiErrorMessage(error, "Try again in a moment.")) },
      );
      return;
    }
    const team = entry as RecipientTeam;
    const member = memberOf.has(team.id);
    const participantIds = member
      ? Array.from(new Set([user.id, ...(team.members ?? []).map((item) => item.user?.id || item.userId || "").filter(Boolean)]))
      : [user.id];
    create.mutate(
      { participantIds, type: member ? "team" : "team-inbox", teamId: team.id, name: team.name, avatar: team.logo ?? undefined },
      { onSuccess: (conversation) => onCreated(conversation, "team"), onError: (error) => toast.error("Couldn't start the conversation", getApiErrorMessage(error, "Try again in a moment.")) },
    );
  };

  const items = (results.data ?? []).filter((entry) => entry.id !== user?.id);

  return (
    <Dialog open={open} title="New message" description="Message a player, or a team's inbox if you're not on it." icon="edit" onClose={onClose} dismissible={!create.isPending}>
      <div className="grid gap-4">
        <Segmented
          label="Recipient"
          value={type}
          onChange={(next) => {
            setType(next);
            setQuery("");
          }}
          options={[
            { value: "user", label: "Player" },
            { value: "team", label: "Team" },
          ]}
          className="w-fit"
        />
        <label className="relative block">
          <span className="sr-only">Search {type === "user" ? "players" : "teams"}</span>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={type === "user" ? "Search players by username" : "Search teams by name"} className={cn(inputClasses, "pl-11")} />
        </label>
        <ul className="-mx-2 grid max-h-80 min-h-40 content-start overflow-y-auto scrollbar-thin scrollbar-thumb-white/12">
          {term.length < 2 ? (
            <li className="px-4 py-10 text-center text-sm text-mist-500">Type at least two letters to search.</li>
          ) : results.isLoading ? (
            <li className="px-4 py-10 text-center text-sm text-mist-500">Searching…</li>
          ) : items.length ? (
            items.map((entry) => {
              const team = type === "team";
              const name = team ? (entry as RecipientTeam).name : (entry as RecipientUser).displayName || (entry as RecipientUser).username;
              const image = team ? (entry as RecipientTeam).logo : (entry as RecipientUser).profileImage;
              return (
                <li key={entry.id}>
                  <button type="button" disabled={create.isPending} onClick={() => start(entry)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:opacity-50">
                    <Avatar src={image ?? undefined} name={name} tone={team ? "ink" : "brand"} online={!team && (entry as RecipientUser).isOnline} className={team ? "rounded-xl" : "rounded-full"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{name}</span>
                      <span className="block truncate text-xs text-mist-500">
                        {team ? (memberOf.has(entry.id) ? "Your team · team chat" : "Message the team's inbox") : `@${(entry as RecipientUser).username}${(entry as RecipientUser).gamerTitle ? ` · ${(entry as RecipientUser).gamerTitle}` : ""}`}
                      </span>
                    </span>
                    <Icon name="arrowRight" className="size-4 text-mist-500" />
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-10 text-center text-sm text-mist-500">No {type === "user" ? "players" : "teams"} match.</li>
          )}
        </ul>
      </div>
    </Dialog>
  );
}
