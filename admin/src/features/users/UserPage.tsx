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
import { ModerationActions } from "@/features/people/components/ModerationActions";
import { ReportList } from "@/features/people/components/ReportList";
import { Stamp } from "@/components/record/Stamp";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate, statusLabel } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { useBreadcrumb } from "@/app/shell/crumb";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useUserDossier } from "./hooks";

const sum = (counts: Record<string, number>) => Object.values(counts).reduce((total, value) => total + value, 0);

export function UserPage() {
  const { userId = "" } = useParams();
  const dossier = useUserDossier(userId);
  const data = dossier.data;
  useBreadcrumb(data?.user.username);
  useDocumentTitle(data?.user.username ?? "Player");

  if (dossier.isLoading) return <DossierSkeleton />;
  if (!data) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <BackLink to="/users" label="Users" />
        <StatePanel icon="user" tone="danger" title="This player didn't load" description={getApiErrorMessage(dossier.error, "They may have been deleted. Go back to Users and search again.")} />
      </div>
    );
  }

  const { user, record, counts, competitions } = data;
  const winRate = record.played ? Math.round((record.won / record.played) * 100) : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        idLabel={user.gamerieId ?? undefined}
        title={user.username}
        image={user.profileImage}
        cover={user.backgroundImage}
        stamps={
          <>
            {user.isBanned ? (
              <Stamp tone="danger" icon="prohibit">Banned</Stamp>
            ) : (
              !data.reports.open && !data.restrictions.length && <Stamp tone="signal" icon="check">Good standing</Stamp>
            )}
            {user.role.toLowerCase() === "admin" && <Stamp tone="lavender" icon="shield">Admin</Stamp>}
            <Stamp tone={user.emailVerified ? "mist" : "danger"}>{user.emailVerified ? "Email confirmed" : "Email unconfirmed"}</Stamp>
            {user.phoneVerified && <Stamp>Phone verified</Stamp>}
            {data.reports.open > 0 && <Stamp tone="danger" icon="flag">{data.reports.open} open {data.reports.open === 1 ? "report" : "reports"}</Stamp>}
            {data.restrictions.length > 0 && <Stamp tone="danger" icon="octagon">{data.restrictions.length} {data.restrictions.length === 1 ? "restriction" : "restrictions"}</Stamp>}
          </>
        }
        meta={
          <>
            <span>Joined {formatDate(user.createdAt)}</span>
            <span>Last active {user.lastLogin ? timeAgo(user.lastLogin) : "never"}</span>
            {user.region && <span>{user.region}</span>}
            <span>{user.email}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/profile/${encodeURIComponent(user.username)}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            <ModerationActions kind="users" id={user.id} name={user.username} banned={user.isBanned} />
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Level", value: `Lv ${data.progression.level}`, hint: `${figure(data.progression.totalGp)} GP` },
              { label: "Record", value: `${record.won}–${record.drawn}–${record.lost}`, hint: winRate == null ? "W–D–L · no matches yet" : `W–D–L · ${winRate}% of ${record.played} won` },
              { label: "Followers", value: figure(counts.followers), hint: `Follows ${figure(counts.following)}` },
              { label: "Posts", value: figure(counts.posts), hint: `${figure(counts.comments)} comments` },
            ]}
          />
          <Panel
            title="Competitions"
            description={`Entered ${sum(competitions.entered)} · organised ${sum(competitions.organised)}${record.tournamentWins ? ` · ${record.tournamentWins} tournament wins` : ""}`}
          >
            <CompetitionList rows={competitions.recent} empty="Hasn't entered a tournament, ladder or league yet." />
          </Panel>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
            <Panel title="Teams">
              {data.teams.length === 0 ? (
                <p className="text-sm text-mist-400">Not on a team.</p>
              ) : (
                <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
                  {data.teams.map((team) => (
                    <li key={team.id}>
                      <Link to={`/teams/${team.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/4">
                        <Avatar src={team.logo ?? undefined} name={team.name} size="sm" tone="ink" shape="square" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</span>
                        <span className="font-mono text-[0.7rem] text-mist-500">{team.owner ? "Owner" : team.title || statusLabel(team.role)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Hubs">
              {data.hubs.length === 0 ? (
                <p className="text-sm text-mist-400">Not in a hub.</p>
              ) : (
                <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
                  {data.hubs.map((hub) => (
                    <li key={hub.id}>
                      <Link to={`/hubs/${hub.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/4">
                        <Avatar src={hub.logo ?? undefined} name={hub.name} size="sm" tone="ink" shape="square" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{hub.name}</span>
                        <span className="font-mono text-[0.7rem] text-mist-500">{statusLabel(hub.designation ?? hub.role)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
          <ReportList against={data.reports.against} open={data.reports.open} filed={data.reports.filed} latest={data.reports.latest} />
          <AuditTrail entries={data.audit} />
        </div>

        <aside className="grid min-w-0 gap-6">
          {data.restrictions.length > 0 && (
            <Panel title="Restrictions" className="ring-danger/30">
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                {data.restrictions.map((restriction) => (
                  <li key={`${restriction.source}-${restriction.createdAt}`} className="rounded-xl bg-danger/6 px-4 py-3 ring-1 ring-inset ring-danger/20">
                    <p className="text-sm font-semibold">
                      {restriction.source === "creator_lock" ? "Can't create ladders or leagues" : "Can't host tournaments"} <span className="font-mono text-xs text-mist-400">({restriction.kind})</span>
                    </p>
                    {restriction.reason && <p className="mt-1 text-xs text-mist-300">{restriction.reason}</p>}
                    <p className="mt-1 font-mono text-[0.68rem] text-mist-500">Since {formatDate(restriction.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="Account">
            <Facts
              items={[
                ["Full name", user.fullName],
                ["Email", user.email],
                ["Signs in with", statusLabel(user.provider ?? "email")],
                ["Phone", user.phoneVerified ? "Verified" : "Not verified"],
                ["Region", user.region],
                ["Platforms", user.platforms.length ? user.platforms.join(", ") : null],
                ["Came from", data.referredBy ? `${data.referredBy.type === "partner" ? "Code" : "Invite from"} ${data.referredBy.name}` : "Direct"],
                ["Invited", `${counts.referrals} players`],
                ["Last seen", user.lastSeen ? timeAgo(user.lastSeen) : null],
              ]}
            />
          </Panel>
          <Panel title="Linked games" description={data.games.length ? undefined : "No game accounts linked."}>
            {data.games.length > 0 && (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                {data.games.map((game) => (
                  <li key={game.provider} className="flex items-center justify-between gap-3 rounded-xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
                    <span className="text-sm font-medium">{statusLabel(game.provider)}</span>
                    <span className="truncate font-mono text-xs text-mist-400">{game.handle ?? "Linked"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {(user.bio || user.gamerTitle) && (
            <Panel title="Bio">
              {user.gamerTitle && <p className="type-label text-lavender-300">{user.gamerTitle}</p>}
              {user.bio && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mist-300">{user.bio}</p>}
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
