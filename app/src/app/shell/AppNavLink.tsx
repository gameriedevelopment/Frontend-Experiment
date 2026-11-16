import type { ComponentProps, MouseEvent } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { announceActiveNavigation, isCurrentNavigationTarget } from "./navigationEvents";

type AppNavLinkProps = ComponentProps<typeof NavLink>;

export function AppNavLink({ onClick, to, ...props }: AppNavLinkProps) {
  const location = useLocation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || typeof to !== "string") return;
    if (isCurrentNavigationTarget(to, location.pathname)) {
      event.preventDefault();
      announceActiveNavigation(to);
    }
  };

  return <NavLink {...props} to={to} onClick={handleClick} />;
}
