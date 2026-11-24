import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import type { Owner } from "../types";

export function OwnerCell({ owner }: { owner: Owner | null }) {
  if (!owner) return <span className="text-xs text-mist-500">No owner</span>;
  return (
    <Link to={`/users/${owner.id}`} className="flex min-w-0 items-center gap-2 text-sm text-mist-200 hover:text-mist-50">
      <Avatar src={owner.profileImage ?? undefined} name={owner.username} size="xs" />
      <span className="truncate">{owner.username}</span>
    </Link>
  );
}
