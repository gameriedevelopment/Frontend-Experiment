import { PageHeader } from "@/components/layout/PageHeader";
import { useSession } from "@/features/auth/session";
import { operatorName } from "@/features/auth/types";
import { useQueue } from "@/features/queue/hooks";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { GrowthChart } from "./components/GrowthChart";
import { KpiBand } from "./components/KpiBand";
import { LiveNow } from "./components/LiveNow";
import { MatchesChart } from "./components/MatchesChart";
import { RecentActivity } from "./components/RecentActivity";
import { WorkQueue } from "./components/WorkQueue";
import { useMetrics } from "./hooks";

function greeting(hour = new Date().getHours()) {
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export function OverviewPage() {
  useDocumentTitle("Overview");
  const user = useSession((state) => state.user);
  const queue = useQueue();
  const metrics = useMetrics();
  const waiting = queue.data?.total ?? 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Overview"
        refresh={[["admin", "overview"], ["admin", "competitions"], ["admin", "queue"]]}
        description={
          <>
            {greeting()}, {operatorName(user)}.{" "}
            {queue.isLoading && "Checking what needs you."}
            {queue.data && (waiting
              ? `${waiting} ${waiting === 1 ? "decision is" : "decisions are"} waiting on the team.`
              : "Nothing is waiting on the team.")}
          </>
        }
      />
      <KpiBand metrics={metrics.data} loading={metrics.isLoading} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WorkQueue queue={queue.data} loading={queue.isLoading} retry={() => void queue.refetch()} />
        <LiveNow />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-6">
          <GrowthChart />
          <MatchesChart />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
