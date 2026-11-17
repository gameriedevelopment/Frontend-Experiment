import { useParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Loader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { hrefOf } from "./format";
import { useCommunityDetail, useHubDashboard } from "./hooks";
import { HubReport } from "./manage/HubReport";

/** The hub report on its own page, without the app around it, so it prints or saves as a PDF. */
export function HubReportPage() {
  const { communitySlug } = useParams();
  const hub = useCommunityDetail("hub", communitySlug);
  const canManage = Boolean(hub.data?.viewerRelationship?.canManage);
  const dashboard = useHubDashboard(hub.data?.id ?? "", canManage);
  useDocumentTitle(hub.data ? `${hub.data.name} report` : null);

  if (hub.isLoading) return <PageLoader label="Loading report" />;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-[minmax(0,1fr)] content-start gap-6 px-4 py-6 sm:px-8 sm:py-10 print:max-w-none print:bg-white print:p-0 print:text-ink-950">
      {!hub.data ? (
        <StatePanel icon="hub" title="Hub not found" description="It may have been renamed or removed." action={<LinkButton to="/hubs" tone="outline" size="sm">Browse hubs</LinkButton>} />
      ) : !canManage ? (
        <StatePanel
          icon="lock"
          title="Only the hub's team can see this report"
          action={
            <LinkButton to={hrefOf("hub", hub.data)} tone="outline" size="sm">
              Back to {hub.data.name}
            </LinkButton>
          }
        />
      ) : dashboard.isLoading ? (
        <Skeleton className="h-[36rem] rounded-card" />
      ) : !dashboard.data ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="The report couldn't load"
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void dashboard.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <HubReport
          hub={hub.data}
          data={dashboard.data}
          actions={
            <>
              <LinkButton to={hrefOf("hub", hub.data, "manage")} tone="ghost" size="sm">
                Back to the hub
              </LinkButton>
              <Button size="sm" icon="printer" onClick={() => window.print()}>
                Print or save PDF
              </Button>
            </>
          }
        />
      )}
    </main>
  );
}
