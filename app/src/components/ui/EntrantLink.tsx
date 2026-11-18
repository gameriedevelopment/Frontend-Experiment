import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

/** Wraps a player or team's avatar and name in a link to their page; plain text when there is nowhere to go. */
export function EntrantLink({
  to,
  className,
  children,
}: {
  to: string | null;
  className?: string;
  children: ReactNode;
}) {
  if (!to) return <span className={className}>{children}</span>;
  return (
    <Link to={to} className={cn("transition-colors hover:text-lavender-200", className)}>
      {children}
    </Link>
  );
}
