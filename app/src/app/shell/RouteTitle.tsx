import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitles } from "./navigation";

function titleFor(pathname: string) {
  if (pathname.startsWith("/profile/")) return decodeURIComponent(pathname.split("/")[2] ?? "") || "Profile";
  if (pathname.startsWith("/post/")) return "Post";
  return pageTitles[pathname] ?? pageTitles[`/${pathname.split("/")[1] ?? ""}`];
}

/** Names the browser tab after the section, so history, bookmarks and tabs stay readable. */
export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = titleFor(pathname);
    document.title = title ? `${title} · Gamerie` : "Gamerie";
  }, [pathname]);
  return null;
}
