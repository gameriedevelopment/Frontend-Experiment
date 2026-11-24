import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSearch } from "../hooks";

/** Pick one player or team by searching for them. `exclude` keeps the other side out of the list. */
export function EntityPicker({
  id,
  label,
  kind,
  value,
  onChange,
  exclude,
  error,
}: {
  id: string;
  label: string;
  kind: "user" | "team";
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
  exclude?: string | null;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const search = useSearch(useDebouncedValue(query, 250));
  const options = (search.data ?? [])
    .filter((result) => result.kind === kind && result.id !== exclude)
    .map((result) => ({ value: result.id, label: result.title, description: result.subtitle ?? undefined, image: result.image ?? undefined }));
  return (
    <Combobox
      id={id}
      label={label}
      placeholder={kind === "user" ? "Search players" : "Search teams"}
      query={query}
      onQueryChange={setQuery}
      options={options}
      loading={search.isFetching}
      value={value}
      onChange={onChange}
      avatars
      error={error}
      emptyText={query.trim().length < 2 ? "Type at least two letters" : kind === "user" ? "No players match" : "No teams match"}
    />
  );
}
