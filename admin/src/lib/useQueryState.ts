import { useSearchParams } from "react-router-dom";

/**
 * Page filters kept in the URL, so a filtered view can be shared and survives a reload.
 * Values equal to their default are left out of the address. Changing a filter returns to page 1.
 */
export function useQueryState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  const state = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, params.get(key) ?? fallback])) as T;
  const set = (patch: Partial<T>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === "" || value === defaults[key]) next.delete(key);
          else next.set(key, value);
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true },
    );
  return [state, set] as const;
}
