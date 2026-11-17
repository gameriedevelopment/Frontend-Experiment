import { useEffect } from "react";

/** Names the tab after what's on screen (a tournament, a team), once it has loaded. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    if (title) document.title = `${title} · Gamerie`;
  }, [title]);
}
