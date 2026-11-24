import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stamp } from "@/components/record/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatePanel } from "@/components/ui/StatePanel";
import { useSession } from "@/features/auth/session";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateTime, statusLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { administratorsKey, listAdministratorInvites, listAdministrators } from "./api";
import { accessLevel, AdministratorDialogs, memberName, type AdministratorDesk } from "./components/AdministratorDialogs";
import type { Administrator, AdministratorInvite } from "./types";

const DEFAULTS = { view: "", search: "", page: "1" };
const LIMIT = 20;
const memberColumn = createColumnHelper<Administrator>();
const inviteColumn = createColumnHelper<AdministratorInvite>();

function memberColumns(open: (member: Administrator) => void) {
  return [
    memberColumn.display({ id: "name", header: "Administrator", cell: ({ row: { original: member } }) => (
      <button type="button" className="flex max-w-72 items-center gap-2 text-left hover:text-lavender-200" onClick={() => open(member)}>
        <Avatar src={member.profileImage ?? undefined} name={memberName(member)} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{memberName(member)}</span>
          {member.username && <span className="block truncate text-xs text-mist-400">{member.email}</span>}
        </span>
      </button>
    ) }),
    memberColumn.display({ id: "role", header: "Role", cell: ({ row }) => accessLevel(row.original) }),
    memberColumn.display({ id: "status", header: "Access", cell: ({ row }) => (
      <Stamp tone={row.original.status === "active" ? "signal" : "danger"}>{statusLabel(row.original.status)}</Stamp>
    ) }),
    memberColumn.display({ id: "activity", header: "Last admin activity", cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDateTime(row.original.lastActiveAt)}</span>
    ) }),
  ];
}

function inviteColumns(open: (invite: AdministratorInvite) => void) {
  return [
    inviteColumn.display({ id: "email", header: "Email", cell: ({ row: { original: invite } }) => (
      <button type="button" className="block max-w-72 truncate text-left font-medium hover:text-lavender-200" onClick={() => open(invite)}>{invite.email}</button>
    ) }),
    inviteColumn.display({ id: "status", header: "Status", cell: ({ row }) => (
      <Stamp tone={row.original.status === "accepted" ? "signal" : "mist"}>{statusLabel(row.original.status)}</Stamp>
    ) }),
    inviteColumn.display({ id: "invited-by", header: "Invited by", cell: ({ row }) => row.original.invitedByEmail || "—" }),
    inviteColumn.display({ id: "expiry", header: "Expiry", cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDateTime(row.original.expiresAt)}</span>
    ) }),
  ];
}

export function AdministratorsPage() {
  useDocumentTitle("Administrators");
  const user = useSession((state) => state.user);
  if (!user?.isSuperAdmin) return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Administrators" />
      <StatePanel icon="operator" title="Super admin access required" />
    </div>
  );
  return <AdministratorsDirectory actorId={user.id} />;
}

function AdministratorsDirectory({ actorId }: { actorId: string }) {
  const [state, set] = useQueryState(DEFAULTS);
  const [desk, setDesk] = useState<AdministratorDesk | null>(null);
  const client = useQueryClient();
  const view = state.view === "invites" ? "invites" : "members";
  const page = Math.max(1, Math.floor(Number(state.page)) || 1);
  const query = { page, limit: LIMIT, search: state.search || undefined };
  const members = useQuery({ queryKey: [...administratorsKey, "members", query], queryFn: () => listAdministrators(query), placeholderData: keepPreviousData, enabled: view === "members" });
  const invites = useQuery({ queryKey: [...administratorsKey, "invites", query], queryFn: () => listAdministratorInvites(query), placeholderData: keepPreviousData, enabled: view === "invites" });
  const total = (view === "members" ? members.data : invites.data)?.total ?? 0;
  const openMember = (member: Administrator) => setDesk({ kind: "member", member });
  const openInvite = (invite: AdministratorInvite) => setDesk({ kind: "invitation", invite });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Administrators" refresh={[administratorsKey]} actions={<Button size="sm" icon="plus" onClick={() => setDesk({ kind: "invite" })}>Invite administrator</Button>} />
      <Segmented label="Administrator records" className="w-fit" value={view} onChange={(next) => set({ view: next === "invites" ? "invites" : "", search: "" })}
        options={[{ value: "members", label: "Administrators" }, { value: "invites", label: "Invitations" }]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search by email" className="w-full sm:w-72" />
      </div>
      {view === "members" ? (
        <DataTable columns={memberColumns(openMember)} data={members.data?.data ?? []} getRowId={(row) => row.id} onRowClick={openMember}
          loading={members.isFetching} error={members.isError ? getApiErrorMessage(members.error, "Administrators didn't load.") : null}
          onRetry={() => void members.refetch()} minWidth="44rem"
          empty={{ icon: "operator", title: state.search ? "No administrators match" : "No administrators yet", description: state.search ? "Try another email address." : undefined }}
        />
      ) : (
        <DataTable columns={inviteColumns(openInvite)} data={invites.data?.data ?? []} getRowId={(row) => row.id} onRowClick={openInvite}
          loading={invites.isFetching} error={invites.isError ? getApiErrorMessage(invites.error, "Invitations didn't load.") : null}
          onRetry={() => void invites.refetch()} minWidth="44rem"
          empty={{ icon: "mail", title: state.search ? "No invitations match" : "No invitations yet", description: state.search ? "Try another email address." : undefined }}
        />
      )}
      {total > LIMIT && <TableFooter page={page} limit={LIMIT} total={total} onPage={(next) => set({ page: String(next) })} />}
      {desk && <AdministratorDialogs key={desk.kind} desk={desk} actorId={actorId} onChange={setDesk} onClose={() => setDesk(null)}
        onSaved={(message) => {
          toast.success(message);
          void client.invalidateQueries({ queryKey: administratorsKey });
          if (desk.kind === "invite") set({ view: "invites", search: "" });
        }}
      />}
    </div>
  );
}
