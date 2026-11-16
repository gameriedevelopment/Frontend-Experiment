import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { activeNavigationEvent } from "./navigationEvents";

export function RouteScrollManager() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.addEventListener(activeNavigationEvent, scrollToTop);
    return () => window.removeEventListener(activeNavigationEvent, scrollToTop);
  }, []);

  return null;
}
