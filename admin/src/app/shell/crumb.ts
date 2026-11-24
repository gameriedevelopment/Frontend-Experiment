import { useEffect } from "react";
import { create } from "zustand";

const useCrumbStore = create<{ label: string | null; set: (label: string | null) => void }>((set) => ({
  label: null,
  set: (label) => set({ label }),
}));

export const useCurrentCrumb = () => useCrumbStore((state) => state.label);

/** A record page names itself as the last breadcrumb, after its section. */
export function useBreadcrumb(label: string | null | undefined) {
  const set = useCrumbStore((state) => state.set);
  useEffect(() => {
    set(label ?? null);
    return () => set(null);
  }, [label, set]);
}
