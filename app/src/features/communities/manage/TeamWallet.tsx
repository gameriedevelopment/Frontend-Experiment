import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgoLong } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useTeamWallet, useTeamWalletInsights, useTeamWalletTransactions, useTransferTeamWalletTokens } from "../hooks";
import type { TeamSummary, TeamWalletTransactionStatus, TeamWalletTransactionType } from "../types";
import { EntityPicker, Empty, Section } from "./ManageParts";

const typeMeta: Record<TeamWalletTransactionType, { label: string; icon: IconName; sign: 1 | -1 | 0 }> = {
  INCOMING: { label: "Received", icon: "arrowDown", sign: 1 },
  OUTGOING: { label: "Sent", icon: "arrowUp", sign: -1 },
  TRANSFER: { label: "Transfer", icon: "transfer", sign: -1 },
  CHALLENGE_RESERVE: { label: "Held for a challenge", icon: "lock", sign: 0 },
  CHALLENGE_RELEASE: { label: "Released from a challenge", icon: "check", sign: 1 },
};
const amount = (value: number | string | undefined) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function TransferDialog({ team, available, onClose }: { team: TeamSummary; available: number; onClose: () => void }) {
  const transfer = useTransferTeamWalletTokens(team.id);
  const [recipient, setRecipient] = useState<"teams" | "players">("players");
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [value, setValue] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const parsed = Number(value);
  const invalid = !Number.isFinite(parsed) || parsed <= 0 || parsed > available;

  return (
    <Dialog
      open
      title="Send tokens"
      description={`From ${team.name}'s wallet. ${amount(available)} available.`}
      icon="wallet"
      onClose={onClose}
      dismissible={!transfer.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            icon="send"
            disabled={!target || invalid || transfer.isPending || target.value === team.id}
            onClick={() =>
              target &&
              transfer.mutate(
                { teamId: team.id, amount: parsed, idempotencyKey: key, ...(recipient === "teams" ? { recipientTeamId: target.value } : { recipientUserId: target.value }) },
                {
                  onSuccess: () => {
                    toast.success("Tokens sent", `${amount(parsed)} to ${target.label}`);
                    onClose();
                  },
                },
              )
            }
          >
            {transfer.isPending ? "Sending…" : "Send"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <Segmented
          label="Recipient"
          value={recipient}
          onChange={(next) => {
            setRecipient(next);
            setTarget(null);
          }}
          options={[
            { value: "players", label: "A player" },
            { value: "teams", label: "Another team" },
          ]}
          className="w-fit"
        />
        <EntityPicker id="wallet-recipient" kind={recipient} label={recipient === "teams" ? "Team" : "Player"} value={target} onChange={setTarget} />
        <TextField
          id="wallet-amount"
          label="Amount"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/[^\d.]/g, ""))}
          error={value && invalid ? (parsed > available ? "That's more than the wallet holds." : "Enter an amount above zero.") : undefined}
        />
        {transfer.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(transfer.error, "The transfer didn't go through.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function TeamWallet({ team }: { team: TeamSummary }) {
  const wallet = useTeamWallet(team.id, true);
  const insights = useTeamWalletInsights(team.id, true);
  const [type, setType] = useState<TeamWalletTransactionType | "">("");
  const [status, setStatus] = useState<TeamWalletTransactionStatus | "">("");
  const transactions = useTeamWalletTransactions(team.id, { type: type || undefined, status: status || undefined }, true);
  const [sending, setSending] = useState(false);
  const balances = wallet.data?.balances ?? [];
  const primary = balances[0];
  const available = Number(primary?.amount ?? 0);
  const reserved = Object.values(wallet.data?.reservedBalances ?? {}).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const rows = transactions.data?.pages.flatMap((page) => page.data) ?? [];
  const flows = insights.data?.flows;
  const owner = Boolean(team.viewerRelationship?.isOwner);

  if (wallet.isLoading) return <Skeleton className="h-80 rounded-card" />;
  if (wallet.isError)
    return (
      <Section title="Wallet">
        <Empty>{getApiErrorMessage(wallet.error, "The wallet didn't load.")}</Empty>
      </Section>
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="relative overflow-hidden rounded-card bg-ink-900 p-5 ring-1 ring-inset ring-white/8 sm:p-6">
        <div className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(60%_90%_at_100%_0%,black,transparent)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="type-label text-mist-500">Balance</p>
            <p className="type-display mt-2 text-[2.5rem] leading-none tabular-nums">
              {amount(available)}
              <span className="ml-2 text-base text-lavender-300">{primary?.token?.symbol ?? "tokens"}</span>
            </p>
            <p className="mt-2 text-sm text-mist-400">{reserved > 0 ? `${amount(reserved)} held for open challenges` : "Nothing held for challenges"}</p>
          </div>
          {owner && (
            <Button icon="send" disabled={available <= 0} onClick={() => setSending(true)}>
              Send tokens
            </Button>
          )}
        </div>
        {flows && (
          <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/6 pt-5 sm:grid-cols-4">
            {[
              ["In", flows.totalInflow],
              ["Out", flows.totalOutflow],
              ["Held", flows.totalReserved],
              ["Net", flows.netFlow],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="type-label text-mist-500">{label}</dt>
                <dd className={cn("mt-1.5 font-semibold tabular-nums", label === "Net" && Number(value) < 0 && "text-danger")}>{amount(value as number)}</dd>
              </div>
            ))}
          </dl>
        )}
        {balances.length > 1 && (
          <p className="relative mt-4 text-xs text-mist-500">
            Also holds {balances.slice(1).map((balance) => `${amount(balance.amount)} ${balance.token?.symbol ?? ""}`).join(", ")}
          </p>
        )}
      </section>

      <Section
        title="Activity"
        meta={
          <div className="flex flex-wrap gap-2">
            <FilterMenu
              label="Type"
              value={type}
              options={Object.entries(typeMeta).map(([value, meta]) => ({ value, label: meta.label }))}
              onChange={(value) => setType(value as TeamWalletTransactionType | "")}
            />
            <FilterMenu
              label="Status"
              value={status}
              options={[
                { value: "COMPLETED", label: "Completed" },
                { value: "PENDING", label: "Pending" },
                { value: "FAILED", label: "Failed" },
              ]}
              onChange={(value) => setStatus(value as TeamWalletTransactionStatus | "")}
            />
          </div>
        }
      >
        {transactions.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : transactions.isError ? (
          <Empty>{getApiErrorMessage(transactions.error, "Wallet activity didn't load.")}</Empty>
        ) : rows.length ? (
          <>
            <ul className="grid">
              {rows.map((row) => {
                const meta = typeMeta[row.type] ?? { label: row.type, icon: "transfer" as IconName, sign: 0 };
                return (
                  <li key={row.id} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", meta.sign > 0 ? "bg-signal/10 text-signal" : meta.sign < 0 ? "bg-white/6 text-mist-200" : "bg-lavender-400/10 text-lavender-300")}>
                      <Icon name={meta.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{row.metadata?.description || meta.label}</span>
                      <span className="block text-xs text-mist-500">
                        {timeAgoLong(row.timestamp || row.createdAt || "")}
                        {row.status !== "COMPLETED" ? ` · ${row.status.toLowerCase()}` : ""}
                      </span>
                    </span>
                    <span className={cn("shrink-0 font-semibold tabular-nums", meta.sign > 0 ? "text-signal" : row.status === "FAILED" ? "text-mist-500 line-through" : "text-mist-100")}>
                      {meta.sign > 0 ? "+" : meta.sign < 0 ? "−" : ""}
                      {amount(row.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {transactions.hasNextPage && (
              <Button tone="outline" size="sm" className="mx-auto mt-4 flex" disabled={transactions.isFetchingNextPage} onClick={() => void transactions.fetchNextPage()}>
                {transactions.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}
          </>
        ) : (
          <Empty>{type || status ? "Nothing matches these filters." : "No wallet activity yet. Prize payouts and challenge stakes show here."}</Empty>
        )}
      </Section>
      {sending && <TransferDialog team={team} available={available} onClose={() => setSending(false)} />}
    </div>
  );
}
