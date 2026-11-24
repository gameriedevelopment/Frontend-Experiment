import type { ReactNode } from "react";
import { Facts } from "@/components/record/Facts";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { describeAction, formatDateTime } from "@/lib/format";
import { entityPath, isEntityKind } from "@/lib/paths";
import type { AuditRecord } from "../types";

function fieldLabel(key: string) {
  return describeAction(key.replace(/([a-z\d])([A-Z])/g, "$1 $2"));
}

function Value({ value }: { value: unknown }) {
  if (value === undefined) return <span className="text-mist-500">—</span>;
  if (value === null) return <span className="text-mist-500">None</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "object") {
    return <pre className="min-w-0 whitespace-pre-wrap wrap-anywhere font-mono text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }
  return <span className="whitespace-pre-wrap wrap-anywhere">{String(value)}</span>;
}

function SnapshotChanges({ before, after }: Pick<AuditRecord, "before" | "after">) {
  const previous = before ?? {};
  const current = after ?? {};
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(current)]));
  const changed = keys.filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
  if (!changed.length) return <p className="text-sm text-mist-400">No field changes recorded.</p>;
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden rounded-2xl bg-white/6 ring-1 ring-inset ring-white/6">
      {changed.map((key) => (
        <div key={key} className="grid grid-cols-2 gap-x-4 gap-y-2 bg-ink-900 px-4 py-3">
          <dt className="col-span-2 wrap-anywhere text-sm font-medium text-mist-50">{fieldLabel(key)}</dt>
          <dd className="min-w-0 text-sm text-mist-300">
            <p className="type-label mb-1 text-[0.6rem] text-mist-500">Before</p>
            <Value value={previous[key]} />
          </dd>
          <dd className="min-w-0 text-sm text-mist-100">
            <p className="type-label mb-1 text-[0.6rem] text-mist-500">After</p>
            <Value value={current[key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AuditRecordDialog({ record, onClose, onFilter }: { record: AuditRecord; onClose: () => void; onFilter: () => void }) {
  const target = isEntityKind(record.targetType) ? entityPath(record.targetType, record.targetId) : null;
  const details: Array<[string, ReactNode]> = [
    ["Administrator", record.actor],
    ["Recorded", formatDateTime(record.createdAt)],
    ["Action code", record.action],
    ["Target type", describeAction(record.targetType)],
    ["Target ID", <span title={record.targetId}>{record.targetId}</span>],
  ];
  if (record.requestId) details.push(["Request ID", <span title={record.requestId}>{record.requestId}</span>]);
  if (record.ipAddress) details.push(["IP address", record.ipAddress]);
  return (
    <Dialog open title={describeAction(record.action)} icon="audit" size="lg" onClose={onClose}
      footer={
        <>
          <Button size="sm" tone="outline" onClick={onFilter}>Filter to target</Button>
          {target && <LinkButton size="sm" to={target}>Open target</LinkButton>}
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <Facts className="[&_dd]:whitespace-normal [&_dd]:wrap-anywhere" items={details} />
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <h3 className="text-sm font-semibold text-mist-50">Reason</h3>
          <p className="whitespace-pre-wrap wrap-anywhere text-sm text-mist-300">{record.reason || "No reason recorded."}</p>
        </section>
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <h3 className="text-sm font-semibold text-mist-50">Changes</h3>
          <SnapshotChanges before={record.before} after={record.after} />
        </section>
      </div>
    </Dialog>
  );
}
