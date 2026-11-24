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
import { useTeamDossier } from "./hooks";

export function TeamPage() {
  const { teamId = "" } = useParams();
  const dossier = useTeamDossier(teamId);
  const data = dossier.data;
  useBreadcrumb(data?.team.name);
  useDocumentTitle(data?.team.name ?? "Team");

  if (dossier.isLoading) return <DossierSkeleton />;
  if (!data) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <BackLink to="/teams" label="Teams" />
        <StatePanel icon="team" tone="danger" title="This team didn't load" description={getApiErrorMessage(dossier.error, "It may have been deleted. Go back to Teams and search again.")} />
      </div>
    );
  }

  const { team, counts, competitions } = data;
  const entered = competitions.entered.tournaments + competitions.entered.ladders + competitions.entered.leagues;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        title={team.name}
        image={team.logo}
        cover={team.backgroundImage}
        square
        stamps={
          <>
            {team.isBanned ? <Stamp tone="danger" icon="prohibit">Banned</Stamp> : !data.reports.open && <Stamp tone="signal" icon="check">Good standing</Stamp>}
            {data.reports.open > 0 && <Stamp tone="danger" icon="flag">{data.reports.open} open {data.reports.open === 1 ? "report" : "reports"}</Stamp>}
            {team.level && <Stamp>{statusLabel(team.level)}</Stamp>}
          </>
        }
        meta={
          <>
            <span>Created {formatDate(team.createdAt)}</span>
            {(team.region || team.country) && <span>{[team.region, team.country].filter(Boolean).join(" · ")}</span>}
            {team.slug && <span>/{team.slug}</span>}
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/teams/${encodeURIComponent(team.slug ?? team.id)}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            <ModerationActions kind="teams" id={team.id} name={team.name} banned={team.isBanned} />
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Members", value: figure(counts.members) },
              { label: "Followers", value: figure(counts.followers) },
              { label: "Hubs", value: figure(counts.hubs) },
              { label: "Competitions", value: figure(entered), hint: `${competitions.entered.tournaments} tournaments` },
            ]}
          />
          <Panel title="Roster">
            <MemberList members={data.members} empty="Nobody is on this team." />
          </Panel>
          <Panel title="Competitions">
            <CompetitionList rows={competitions.recent} empty="Hasn't entered a competition yet." />
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
                ["Level", statusLabel(team.level)],
                ["Region", team.region],
                ["Country", team.country],
                ["Platforms", team.platforms.length ? team.platforms.join(", ") : null],
                ["Games", team.games.length ? team.games.join(", ") : null],
              ]}
            />
          </Panel>
          <Panel title="Hubs" description={data.hubs.length ? undefined : "Not in a hub."}>
            {data.hubs.length > 0 && (
              <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
                {data.hubs.map((hub) => (
                  <li key={hub.id}>
                    <Link to={`/hubs/${hub.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/4">
                      <Avatar src={hub.logo ?? undefined} name={hub.name} size="sm" tone="ink" shape="square" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{hub.name}</span>
                      <span className="font-mono text-[0.7rem] text-mist-500">{statusLabel(hub.type)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {team.description && (
            <Panel title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{team.description}</p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
