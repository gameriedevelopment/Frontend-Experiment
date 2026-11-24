import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { listGames } from "./api";
import { coverOf } from "./catalog";

/** Pick a catalog game. With nothing typed it lists the most played ones. */
export function GamePicker({ id, label = "Game", value, onChange, error }: { id: string; label?: string; value: ComboboxOption | null; onChange: (option: ComboboxOption | null) => void; error?: string }) {
  const [query, setQuery] = useState("");
  const search = useDebouncedValue(query.trim(), 250);
  const games = useQuery({
    queryKey: ["admin", "games", "picker", search],
    queryFn: () => listGames({ page: 1, limit: 8, search: search || undefined, sort: search ? undefined : "popular" }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const options = (games.data?.data ?? []).map((game) => ({
    value: game.id,
    label: game.name,
    description: [game.company, game.gameType].filter(Boolean).join(" · ") || undefined,
    image: coverOf(game.wallPhoto) ?? undefined,
  }));
  return (
    <Combobox
      id={id}
      label={label}
      placeholder="Search the catalog"
      browse
      browseLabel="Most played"
      query={query}
      onQueryChange={setQuery}
      options={options}
      loading={games.isFetching}
      value={value}
      onChange={onChange}
      avatars
      error={error}
      emptyText="No games match"
    />
  );
}
