import { Link, useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { Panel } from "@/components/layout/Panel";
import { AuditTrail } from "@/features/people/components/AuditTrail";
import { BackLink } from "@/components/record/BackLink";
import { CompetitionList } from "@/features/people/components/CompetitionList";
import { DossierHeader, DossierSkeleton } from "@/components/record/DossierHeader";
import { Facts, Figures } from "@/components/record/Facts";
import { MemberList } from "@/features/people/components/MemberList";
import { ModerationActions } from "@/features/people/components/ModerationActions";
import { OwnerCell } from "@/features/people/components/OwnerCell";
import { ReportList } from "@/features/people/components/ReportList";
import { Stamp } from "@/components/record/Stamp";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate, statusLabel } from "@/lib/format";
import { useBreadcrumb } from "@/app/shell/crumb";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useHubDossier } from "./hooks";

export function HubPage() {
  const { hubId = "" } = useParams();
  const dossier = useHubDossier(hubId);
  const data = dossier.data;
  useBreadcrumb(data?.hub.name);
  useDocumentTitle(data?.hub.name ?? "Hub");

  if (dossier.isLoading) return <DossierSkeleton />;
  if (!data) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <BackLink to="/hubs" label="Hubs" />
        <StatePanel icon="hub" tone="danger" title="This hub didn't load" description={getApiErrorMessage(dossier.error, "It may have been deleted. Go back to Hubs and search again.")} />
      </div>
    );
  }

  const { hub, counts } = data;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        title={hub.name}
        image={hub.logo}
        cover={hub.backgroundImage}
        square
        stamps={
          <>
            {hub.isBanned ? <Stamp tone="danger" icon="prohibit">Banned</Stamp> : !data.reports.open && <Stamp tone="signal" icon="check">Good standing</Stamp>}
            <Stamp tone="lavender">{statusLabel(hub.type)}</Stamp>
            <Stamp icon={hub.visibility === "private" ? "lock" : "globe"}>{statusLabel(hub.visibility)}</Stamp>
            <Stamp>{statusLabel(hub.joinPolicy)} join</Stamp>
            {data.reports.open > 0 && <Stamp tone="danger" icon="flag">{data.reports.open} open {data.reports.open === 1 ? "report" : "reports"}</Stamp>}
          </>
        }
        meta={
          <>
            <span>Created {formatDate(hub.createdAt)}</span>
            {hub.organizationName && <span>{hub.organizationName}</span>}
            {(hub.region || hub.country) && <span>{[hub.region, hub.country].filter(Boolean).join(" · ")}</span>}
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/hubs/${encodeURIComponent(hub.slug ?? hub.id)}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            <ModerationActions kind="hubs" id={hub.id} name={hub.name} banned={hub.isBanned} />
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Members", value: figure(counts.members) },
              { label: "Teams", value: figure(counts.teams) },
              { label: "Followers", value: figure(counts.followers) },
              { label: "Hosted", value: figure(counts.hosted), hint: "Competitions run" },
            ]}
          />
          <Panel title="Staff">
            <MemberList members={data.staff} empty="No staff besides the owner." />
          </Panel>
          <Panel title="Hosted competitions">
            <CompetitionList rows={data.hosted} empty="This hub hasn't run a competition yet." />
          </Panel>
          <ReportList against={data.reports.against} open={data.reports.open} latest={data.reports.latest} />
          <AuditTrail entries={data.audit} />
        </div>
        <aside className="grid min-w-0 gap-6">
          <Panel title="Owner">
            <OwnerCell owner={data.owner} />
          </Panel>
          <Panel title="Details">
            <Facts
              items={[
                ["Type", statusLabel(hub.type)],
                ["Organization", hub.organizationName],
                ["Visibility", statusLabel(hub.visibility)],
                ["Joining", statusLabel(hub.joinPolicy)],
                ["Region", hub.region],
                ["Games", hub.games.length ? hub.games.join(", ") : null],
              ]}
            />
          </Panel>
          <Panel title="Teams" description={data.teams.length ? `${data.teams.length} in this hub` : "No teams yet."}>
            {data.teams.length > 0 && (
              <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
                {data.teams.map((team) => (
                  <li key={team.id}>
                    <Link to={`/teams/${team.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/4">
                      <Avatar src={team.logo ?? undefined} name={team.name} size="sm" tone="ink" shape="square" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</span>
                      {team.isBanned ? <Stamp tone="danger">Banned</Stamp> : <span className="font-mono text-[0.7rem] text-mist-500">{team.members} members</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {hub.description && (
            <Panel title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{hub.description}</p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
