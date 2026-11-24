import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, statusLabel } from "@/lib/format";
import type { MemberRow } from "../types";
import { Stamp } from "@/components/record/Stamp";

/** A roster or staff list; each person opens their dossier. */
export function MemberList({ members, empty }: { members: MemberRow[]; empty: string }) {
  if (members.length === 0) return <p className="text-sm text-mist-400">{empty}</p>;
  return (
    <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
      {members.map((member) => (
        <li key={member.id}>
          <Link to={`/users/${member.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4">
            <Avatar src={member.profileImage ?? undefined} name={member.username} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 truncate text-sm font-medium">
                {member.username}
                {member.isBanned && <Stamp tone="danger">Banned</Stamp>}
              </span>
              <span className="block truncate font-mono text-[0.7rem] text-mist-500">{[member.gamerieId, member.title].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="text-right">
              <span className="block text-xs text-mist-200">{statusLabel(member.role)}</span>
              <span className="block font-mono text-[0.68rem] text-mist-500">{member.joinedAt ? `Since ${formatDate(member.joinedAt)}` : ""}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
