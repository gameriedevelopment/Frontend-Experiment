import { useSearchParams } from "react-router-dom";

/**
 * The open Manage section, kept in `?manage=` so notifications and links can land on it.
 * `aliases` maps older names the backend still sends (team "access" is our "people").
 */
export function useManageView<V extends string>(views: readonly V[], fallback: V, aliases: Readonly<Record<string, V>> = {}) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("manage") ?? "";
  const requested = aliases[raw] ?? raw;
  const view = (views as readonly string[]).includes(requested) ? (requested as V) : fallback;
  const setView = (next: V) => {
    const nextParams = new URLSearchParams(params);
    if (next === fallback) nextParams.delete("manage");
    else nextParams.set("manage", next);
    setParams(nextParams, { replace: true });
  };
  return [view, setView] as const;
}
