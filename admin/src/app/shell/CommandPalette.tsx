import { useQueryClient } from "@tanstack/react-query";
import { Command } from "cmdk";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Kbd } from "@/components/layout/Kbd";
import { useSession } from "@/features/auth/session";
import { useSearch } from "@/features/people/hooks";
import type { SearchResult } from "@/features/people/types";
import { entityPath } from "@/lib/paths";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PLAYER_APP_URL } from "@/lib/env";
import { toast } from "@/lib/toast";
import { NAV } from "./navigation";
import { usePalette } from "./palette";

const groupClass =
  "px-1 pb-1 [&_[cmdk-group-heading]]:type-label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[0.6rem] [&_[cmdk-group-heading]]:text-mist-500";

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  user: "Player",
  team: "Team",
  hub: "Hub",
  tournament: "Tournament",
  ladder: "Ladder",
  league: "League",
};

function Item({
  icon,
  children,
  hint,
  onSelect,
  value,
  keywords,
}: {
  icon: IconName;
  children: ReactNode;
  hint?: ReactNode;
  onSelect: () => void;
  value: string;
  keywords?: string[];
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[0.92rem] text-mist-200 data-[selected=true]:bg-white/6 data-[selected=true]:text-mist-50"
    >
      <Icon name={icon} className="size-[1.1rem] text-mist-500" />
      <span className="flex-1 truncate">{children}</span>
      {hint}
    </Command.Item>
  );
}

/** ⌘K: find any player, team, hub or competition, jump to a section, or run a console action. */
export function CommandPalette() {
  const open = usePalette((state) => state.open);
  const setOpen = usePalette((state) => state.setOpen);
  const user = useSession((state) => state.user);
  const signOut = useSession((state) => state.signOut);
  const client = useQueryClient();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const query = useDebouncedValue(term.trim(), 200);
  const search = useSearch(query);
  const results = query.length >= 2 ? (search.data ?? []) : [];
  const run = (action: () => void) => {
    setOpen(false);
    setTerm("");
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTerm("");
      }}
      label="Search and jump"
      loop
      overlayClassName="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-card bg-ink-850 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10 focus:outline-none"
    >
      <div className="flex items-center gap-3 border-b border-white/6 px-5">
        <Icon name="search" className="size-5 text-mist-500" />
        <Command.Input value={term} onValueChange={setTerm} placeholder="Find a player, team, hub or competition" className="h-14 min-w-0 flex-1 bg-transparent text-[0.98rem] text-mist-50 outline-none placeholder:text-mist-500" />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2 scrollbar-thin">
        <Command.Empty className="px-4 py-12 text-center text-sm text-mist-400">
          {search.isFetching ? "Searching…" : query.length >= 2 ? "Nothing on Gamerie matches that." : "Type two letters to search Gamerie."}
        </Command.Empty>
        {results.length > 0 && (
          <Command.Group heading="On Gamerie" className={groupClass}>
            {results.map((result) => (
              <Command.Item
                key={`${result.kind}-${result.id}`}
                value={`result ${result.kind} ${result.id}`}
                keywords={[term, result.title, result.subtitle ?? ""]}
                onSelect={() => run(() => navigate(entityPath(result.kind, result.id)))}
                className="flex h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-[0.92rem] text-mist-200 data-[selected=true]:bg-white/6 data-[selected=true]:text-mist-50"
              >
                <Avatar
                  src={result.image ?? undefined}
                  name={result.title}
                  size="sm"
                  tone={result.kind === "user" ? "brand" : "ink"}
                  shape={result.kind === "user" ? "circle" : "square"}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 truncate">
                    {result.title}
                    {result.flagged && <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-label="Banned, reported or removed" />}
                  </span>
                  {result.subtitle && <span className="block truncate font-mono text-[0.68rem] text-mist-500">{result.subtitle}</span>}
                </span>
                <span className="type-label text-[0.55rem] text-mist-500">{KIND_LABEL[result.kind]}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {NAV.map((group) => (
          <Command.Group key={group.label} heading={group.label} className={groupClass}>
            {group.items
              .filter((item) => !item.superAdmin || user?.isSuperAdmin)
              .map((item) => (
                <Item
                  key={item.to}
                  value={`${group.label} ${item.label}`}
                  icon={item.icon}
                  onSelect={() => run(() => navigate(item.to))}
                  hint={
                    item.key && (
                      <span className="flex gap-1">
                        <Kbd>G</Kbd>
                        <Kbd>{item.key.toUpperCase()}</Kbd>
                      </span>
                    )
                  }
                >
                  {item.label}
                </Item>
              ))}
          </Command.Group>
        ))}
        <Command.Group heading="Actions" className={groupClass}>
          <Item
            value="refresh reload data"
            icon="refresh"
            onSelect={() =>
              run(() => {
                void client.invalidateQueries();
                toast.info("Refreshing everything on screen");
              })
            }
          >
            Refresh data
          </Item>
          <Item value="open player app gamerie" icon="open" onSelect={() => run(() => window.open(PLAYER_APP_URL, "_blank", "noopener"))}>
            Open the Gamerie app
          </Item>
          <Item
            value="sign out log out"
            icon="signOut"
            onSelect={() =>
              run(() => {
                signOut();
                navigate("/sign-in", { replace: true });
              })
            }
          >
            Sign out
          </Item>
        </Command.Group>
      </Command.List>
      <div className="flex items-center gap-4 border-t border-white/6 px-5 py-3 text-xs text-mist-500">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>G</Kbd> then a letter jumps anywhere
        </span>
      </div>
    </Command.Dialog>
  );
}
