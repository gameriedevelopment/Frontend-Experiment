import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBreadcrumb } from "@/app/shell/crumb";
import { Panel } from "@/components/layout/Panel";
import { PageHeader } from "@/components/layout/PageHeader";
import { BackLink } from "@/components/record/BackLink";
import { DossierSkeleton } from "@/components/record/DossierHeader";
import { Facts, Figures } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { copyText } from "@/lib/clipboard";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { deleteReferralCode, getReferralCode, referralKey, updateReferralStatus } from "./api";
import { ReferralSignups } from "./components/ReferralSignups";
import { referralStatus, ReferralStatusStamp } from "./components/ReferralStatusStamp";
import type { ReferralCode } from "./types";

export function ReferralCodePage() {
  const { referralId = "" } = useParams();
  const query = useQuery({ queryKey: [...referralKey, "detail", referralId], queryFn: () => getReferralCode(referralId) });
  useBreadcrumb(query.data?.code);
  useDocumentTitle(query.data?.code ?? "Referral code");
  if (query.isLoading) return <DossierSkeleton />;
  if (!query.data) return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <BackLink to="/referrals" label="Referrals" />
      <StatePanel icon="warning" tone="danger" title="This code didn't load" description={getApiErrorMessage(query.error, "The code may have been deleted.")}
        action={<Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>Try again</Button>}
      />
    </div>
  );
  return <ReferralRecord key={query.data.id} record={query.data} />;
}

function ReferralRecord({ record }: { record: ReferralCode }) {
  const [action, setAction] = useState<"status" | "delete" | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const status = referralStatus(record);
  const active = status === "active";
  const statusAction = active ? "Deactivate" : "Activate";
  const copyLink = () => {
    const url = new URL(playerAppLink("/register"));
    url.searchParams.set("ref", record.code);
    void copyText(url.href).then(
      () => toast.success("Sign-up link copied"),
      () => toast.info("Couldn't copy the sign-up link"),
    );
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title={<span className="wrap-anywhere">{record.code}</span>} description={<span className="wrap-anywhere">{record.source}</span>}
        refresh={[referralKey]} actions={<Button tone="outline" size="sm" icon="copy" onClick={copyLink}>Copy sign-up link</Button>}
      />
      <Figures items={[
        { label: "Sign-ups", value: figure(record.signups) },
        { label: "Eligible", value: figure(record.eligible) },
        { label: "Eligible unpaid", value: figure(record.eligibleUnpaid) },
        { label: "Paid", value: figure(record.paid) },
      ]} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <ReferralSignups id={record.id} />
        <Panel title="Code details" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
          <Facts items={[
            ["Status", <ReferralStatusStamp record={record} />],
            ["Created", formatDateTime(record.createdAt)],
            ["Expiry", record.expiresAt ? formatDateTime(record.expiresAt) : "No expiry"],
          ]} />
          <div className="flex flex-wrap items-center gap-2">
            {status !== "expired" && <Button tone="outline" size="sm" onClick={() => setAction("status")}>{statusAction} code</Button>}
            {record.signups === 0 && <Button tone="outline" size="sm" icon="trash" className="text-danger" onClick={() => setAction("delete")}>Delete code</Button>}
          </div>
        </Panel>
      </div>
      {action === "status" && (
        <ReasonDialog title={`${statusAction} ${record.code}?`}
          description={active ? "The code stops working for new sign-ups. Existing sign-ups stay on this record." : "Players can use this code to sign up again."}
          confirmLabel={statusAction} icon="gift" tone={active ? "danger" : "brand"} onClose={() => setAction(null)}
          onConfirm={async (reason) => {
            await updateReferralStatus(record.id, active ? "inactive" : "active", reason);
            toast.success(active ? "Code deactivated" : "Code activated");
            void client.invalidateQueries({ queryKey: referralKey });
          }}
        />
      )}
      {action === "delete" && (
        <ReasonDialog title={`Delete ${record.code}?`} description="This permanently removes the code." confirmLabel="Delete" icon="trash" onClose={() => setAction(null)}
          onConfirm={async (reason) => {
            await deleteReferralCode(record.id, reason);
            toast.info("Code deleted");
            void client.invalidateQueries({ queryKey: referralKey });
            navigate("/referrals");
          }}
        />
      )}
    </div>
  );
}
