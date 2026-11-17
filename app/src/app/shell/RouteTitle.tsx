import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";
import { pageTitles } from "./navigation";

function titleFor(pathname: string) {
  if (pathname.startsWith("/profile/")) return decodeURIComponent(pathname.split("/")[2] ?? "") || "Profile";
  if (pathname.startsWith("/post/")) return "Post";
  return pageTitles[pathname] ?? pageTitles[`/${pathname.split("/")[1] ?? ""}`];
}

/** Names the browser tab after the section and reports the view to analytics. */
export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = titleFor(pathname);
    document.title = title ? `${title} · Gamerie` : "Gamerie";
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
