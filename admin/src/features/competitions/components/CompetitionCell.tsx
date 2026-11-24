import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

/** The name column of every competition table. */
export function CompetitionCell({ to, name, image, subtitle, official }: { to: string; name: string; image: string | null; subtitle: string; official?: boolean }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3">
      <Avatar src={image ?? undefined} name={name} size="sm" tone="ink" shape="square" />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 truncate font-medium text-mist-50">
          <span className="truncate">{name}</span>
          {official && <Icon name="seal" weight="fill" className="size-3.5 shrink-0 text-lavender-300" aria-label="Official" />}
        </span>
        <span className="block truncate font-mono text-[0.7rem] text-mist-500">{subtitle}</span>
      </span>
    </Link>
  );
}
