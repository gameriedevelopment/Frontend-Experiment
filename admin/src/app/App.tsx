import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AcceptInvitePage } from "@/features/auth/AcceptInvitePage";
import { RequireAdmin } from "@/features/auth/RequireAdmin";
import { SignInPage } from "@/features/auth/SignInPage";
import { NAV_ITEMS } from "./shell/navigation";
import { AdminShell } from "./shell/AdminShell";
import { PendingPage } from "./PendingPage";

const OverviewPage = lazy(() => import("@/features/overview/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const QueuePage = lazy(() => import("@/features/queue/QueuePage").then((module) => ({ default: module.QueuePage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((module) => ({ default: module.UsersPage })));
const UserPage = lazy(() => import("@/features/users/UserPage").then((module) => ({ default: module.UserPage })));
const TeamsPage = lazy(() => import("@/features/teams/TeamsPage").then((module) => ({ default: module.TeamsPage })));
const TeamPage = lazy(() => import("@/features/teams/TeamPage").then((module) => ({ default: module.TeamPage })));
const HubsPage = lazy(() => import("@/features/hubs/HubsPage").then((module) => ({ default: module.HubsPage })));
const HubPage = lazy(() => import("@/features/hubs/HubPage").then((module) => ({ default: module.HubPage })));
const TournamentsPage = lazy(() => import("@/features/tournaments/TournamentsPage").then((module) => ({ default: module.TournamentsPage })));
const TournamentPage = lazy(() => import("@/features/tournaments/TournamentPage").then((module) => ({ default: module.TournamentPage })));
const LaddersPage = lazy(() => import("@/features/ladders/LaddersPage").then((module) => ({ default: module.LaddersPage })));
const LadderPage = lazy(() => import("@/features/ladders/LadderPage").then((module) => ({ default: module.LadderPage })));
const LeaguesPage = lazy(() => import("@/features/leagues/LeaguesPage").then((module) => ({ default: module.LeaguesPage })));
const LeaguePage = lazy(() => import("@/features/leagues/LeaguePage").then((module) => ({ default: module.LeaguePage })));
const DisputesPage = lazy(() => import("@/features/disputes/DisputesPage").then((module) => ({ default: module.DisputesPage })));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const FlaggedPage = lazy(() => import("@/features/flagged/FlaggedPage").then((module) => ({ default: module.FlaggedPage })));
const RestrictionsPage = lazy(() => import("@/features/restrictions/RestrictionsPage").then((module) => ({ default: module.RestrictionsPage })));
const ChallengesPage = lazy(() => import("@/features/challenges/ChallengesPage").then((module) => ({ default: module.ChallengesPage })));
const NewChallengePage = lazy(() => import("@/features/challenges/NewChallengePage").then((module) => ({ default: module.NewChallengePage })));
const ChallengePage = lazy(() => import("@/features/challenges/ChallengePage").then((module) => ({ default: module.ChallengePage })));
const GamesPage = lazy(() => import("@/features/games/GamesPage").then((module) => ({ default: module.GamesPage })));
const GameEditorPage = lazy(() => import("@/features/games/GameEditorPage").then((module) => ({ default: module.GameEditorPage })));
const AchievementsPage = lazy(() => import("@/features/achievements/AchievementsPage").then((module) => ({ default: module.AchievementsPage })));

const pending = NAV_ITEMS.filter((item) => item.phase);

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:teamId" element={<TeamPage />} />
          <Route path="hubs" element={<HubsPage />} />
          <Route path="hubs/:hubId" element={<HubPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/:tournamentId" element={<TournamentPage />} />
          <Route path="ladders" element={<LaddersPage />} />
          <Route path="ladders/:ladderId" element={<LadderPage />} />
          <Route path="leagues" element={<LeaguesPage />} />
          <Route path="leagues/:leagueId" element={<LeaguePage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="flagged" element={<FlaggedPage />} />
          <Route path="restrictions" element={<RestrictionsPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="challenges/new" element={<NewChallengePage />} />
          <Route path="challenges/:challengeId" element={<ChallengePage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/new" element={<GameEditorPage />} />
          <Route path="games/:gameId" element={<GameEditorPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          {pending.map((item) => (
            <Route key={item.to} path={`${item.to.slice(1)}/*`} element={<PendingPage />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
