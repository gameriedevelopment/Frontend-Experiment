import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { TableFooter } from "@/components/data/TableFooter";
import { Panel } from "@/components/layout/Panel";
import { Facts } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate, formatDateTime, statusLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useQueryState } from "@/lib/useQueryState";
import { listReferralSignups, referralKey, updateReferralPayment } from "../api";
import type { ReferralSignup } from "../types";

const DEFAULTS = { search: "", page: "1" };
const LIMIT = 15;
const column = createColumnHelper<ReferralSignup>();

function signupColumns(onOpen: (signup: ReferralSignup) => void) {
  return [
    column.display({
      id: "player", header: "Player",
      cell: ({ row: { original: signup } }) => (
        <button type="button" onClick={() => onOpen(signup)} className="flex max-w-56 items-center gap-2 text-left hover:text-lavender-200">
          <Avatar src={signup.profileImage ?? undefined} name={signup.username} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{signup.username}</span>
            <span className="block truncate text-xs text-mist-400">{signup.email}</span>
          </span>
        </button>
      ),
    }),
    column.display({
      id: "eligibility", header: "Eligibility",
      cell: ({ row }) => <Stamp tone={row.original.eligibilityStatus === "eligible" ? "signal" : "mist"}>{statusLabel(row.original.eligibilityStatus)}</Stamp>,
    }),
    column.display({
      id: "payment", header: "Payment",
      cell: ({ row }) => <Stamp tone={row.original.paymentStatus === "paid" ? "lavender" : "mist"}>{statusLabel(row.original.paymentStatus)}</Stamp>,
    }),
    column.display({
      id: "level", header: "Level / matches",
      cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{figure(row.original.level)} / {figure(row.original.recordedMatchCount)}</span>,
    }),
    column.display({
      id: "joined", header: "Joined",
      cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.createdAt)}</span>,
    }),
  ];
}

export function ReferralSignups({ id }: { id: string }) {
  const client = useQueryClient();
  const [state, set] = useQueryState(DEFAULTS);
  const [selected, setSelected] = useState<ReferralSignup | null>(null);
  const [payment, setPayment] = useState<ReferralSignup | null>(null);
  const page = Math.max(1, Math.floor(Number(state.page)) || 1);
  const query = { page, limit: LIMIT, search: state.search || undefined };
  const signups = useQuery({
    queryKey: [...referralKey, id, "signups", query],
    queryFn: () => listReferralSignups(id, query),
    placeholderData: keepPreviousData,
  });
  const paid = payment?.paymentStatus !== "paid";
  const paymentLabel = paid ? "Mark paid" : "Reopen payment";

  return (
    <Panel title="Sign-ups" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
      <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search player or email" className="w-full sm:w-72" />
      <DataTable columns={signupColumns(setSelected)} data={signups.data?.data ?? []} getRowId={(row) => row.id} onRowClick={setSelected}
        loading={signups.isFetching} error={signups.isError ? getApiErrorMessage(signups.error, "Sign-ups didn't load.") : null}
        onRetry={() => void signups.refetch()} minWidth="38rem"
        empty={{ icon: "user", title: state.search ? "No sign-ups match" : "No sign-ups yet", description: state.search ? "Try another player or email." : undefined }}
      />
      {signups.data && signups.data.total > LIMIT && <TableFooter page={page} limit={LIMIT} total={signups.data.total} onPage={(next) => set({ page: String(next) })} />}
      {selected && (
        <Dialog open title={selected.username} description={selected.email} icon="user" onClose={() => setSelected(null)}
          footer={
            <>
              <LinkButton to={`/users/${selected.userId}`} tone="outline" size="sm">Open user</LinkButton>
              <Button size="sm" disabled={selected.eligibilityStatus !== "eligible" && selected.paymentStatus !== "paid"} onClick={() => {
                setPayment(selected);
                setSelected(null);
              }}>{selected.paymentStatus === "paid" ? "Reopen payment" : "Mark paid"}</Button>
            </>
          }
        >
          <Facts items={[
            ["Referral status", statusLabel(selected.status)],
            ["Eligibility", statusLabel(selected.eligibilityStatus)],
            ["Eligible since", formatDateTime(selected.eligibleAt)],
            ["Level", figure(selected.level)],
            ["Recorded matches", figure(selected.recordedMatchCount)],
            ["Payment", statusLabel(selected.paymentStatus)],
            ["Paid at", formatDateTime(selected.paidAt)],
            ["Profile completion", selected.profileCompletion ? `${selected.profileCompletion.score}%` : null],
            ["Joined", formatDateTime(selected.createdAt)],
          ]} />
        </Dialog>
      )}
      {payment && (
        <ReasonDialog
          title={paid ? `Mark ${payment.username} as paid?` : `Reopen payment for ${payment.username}?`}
          description={paid ? "Record a payment that has already been made." : "The sign-up will show as unpaid again."}
          confirmLabel={paymentLabel}
          icon="gift"
          tone="brand"
          onClose={() => setPayment(null)}
          onConfirm={async (reason) => {
            await updateReferralPayment(payment.id, paid, reason);
            toast.success(paid ? "Marked as paid" : "Payment reopened");
            void client.invalidateQueries({ queryKey: referralKey });
          }}
        />
      )}
    </Panel>
  );
}
