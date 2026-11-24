import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth/session";
import { NAV_ITEMS } from "./navigation";
import { usePalette } from "./palette";

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** ⌘K or / opens the palette; g then a letter jumps to a section. */
export function useShortcuts() {
  const navigate = useNavigate();
  const setOpen = usePalette((state) => state.setOpen);
  const superAdmin = useSession((state) => Boolean(state.user?.isSuperAdmin));

  useEffect(() => {
    let leader = 0;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!usePalette.getState().open);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target) || usePalette.getState().open) return;
      if (event.key === "/") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const key = event.key.toLowerCase();
      if (Date.now() - leader < 1200) {
        leader = 0;
        const item = NAV_ITEMS.find((entry) => entry.key === key && (!entry.superAdmin || superAdmin));
        if (item) {
          event.preventDefault();
          navigate(item.to);
        }
        return;
      }
      if (key === "g") leader = Date.now();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, setOpen, superAdmin]);
}
