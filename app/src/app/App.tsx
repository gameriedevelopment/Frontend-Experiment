import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageLoader } from "@/components/ui/Loader";
import { AuthHandoffPage } from "@/features/auth/AuthHandoffPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { SignInPage } from "@/features/auth/SignInPage";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { ConnectionCallbackPage } from "@/features/games/connections/ConnectionCallbackPage";
import { AppShell } from "./shell/AppShell";

const HomePage = lazy(() =>
  import("@/features/home/HomePage").then((module) => ({ default: module.HomePage })),
);
const ChallengesPage = lazy(() =>
  import("@/features/challenges/ChallengesPage").then((module) => ({ default: module.ChallengesPage })),
);
const NewChallengePage = lazy(() =>
  import("@/features/challenges/NewChallengePage").then((module) => ({ default: module.NewChallengePage })),
);
const ChallengeDetailPage = lazy(() =>
  import("@/features/challenges/ChallengeDetailPage").then((module) => ({ default: module.ChallengeDetailPage })),
);
const TournamentsPage = lazy(() =>
  import("@/features/tournaments/TournamentsPage").then((module) => ({ default: module.TournamentsPage })),
);
const TournamentPage = lazy(() =>
  import("@/features/tournaments/detail/TournamentPage").then((module) => ({ default: module.TournamentPage })),
);
const CreateTournamentPage = lazy(() =>
  import("@/features/tournaments/create/CreateTournamentPage").then((module) => ({ default: module.CreateTournamentPage })),
);
const CommunityDirectoryPage = lazy(() =>
  import("@/features/communities/CommunityDirectoryPage").then((module) => ({ default: module.CommunityDirectoryPage })),
);
const CommunityDetailPage = lazy(() =>
  import("@/features/communities/CommunityDetailPage").then((module) => ({ default: module.CommunityDetailPage })),
);
const CommunityFormPage = lazy(() =>
  import("@/features/communities/CommunityFormPage").then((module) => ({ default: module.CommunityFormPage })),
);
const MessagesPage = lazy(() => import("@/features/messages/MessagesPage").then((module) => ({ default: module.MessagesPage })));
const NotificationsPage = lazy(() =>
  import("@/features/notifications/NotificationsPage").then((module) => ({ default: module.NotificationsPage })),
);
const FeedPage = lazy(() => import("@/features/feed/FeedPage").then((module) => ({ default: module.FeedPage })));
const PostPage = lazy(() => import("@/features/feed/PostPage").then((module) => ({ default: module.PostPage })));
const LeaderboardPage = lazy(() =>
  import("@/features/leaderboard/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage })),
);
const LaddersPage = lazy(() =>
  import("@/features/ladders/LaddersPage").then((module) => ({ default: module.LaddersPage })),
);
const LadderPage = lazy(() =>
  import("@/features/ladders/detail/LadderPage").then((module) => ({ default: module.LadderPage })),
);
const CreateLadderPage = lazy(() =>
  import("@/features/ladders/create/CreateLadderPage").then((module) => ({ default: module.CreateLadderPage })),
);
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const PlayerCardPage = lazy(() =>
  import("@/features/profile/PlayerCardPage").then((module) => ({ default: module.PlayerCardPage })),
);
const SearchPage = lazy(() => import("@/features/discovery/SearchPage").then((module) => ({ default: module.SearchPage })));
const PlayersPage = lazy(() => import("@/features/discovery/PlayersPage").then((module) => ({ default: module.PlayersPage })));
const GamesPage = lazy(() => import("@/features/games/GamesPage").then((module) => ({ default: module.GamesPage })));
const GameDetailPage = lazy(() => import("@/features/games/GameDetailPage").then((module) => ({ default: module.GameDetailPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const MatchesPage = lazy(() => import("@/features/matches/MatchesPage").then((module) => ({ default: module.MatchesPage })));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage").then((module) => ({ default: module.CalendarPage })));

function Deferred({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading" />}>{children}</Suspense>;
}

const handoffRoutes = [
  "/forgot-password",
  "/reset-password",
  "/verify-phone",
  "/confirm-email/:token",
  "/confirm-email-change/:token",
  "/auth/callback",
];

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {["/card/:username", "/s/:username"].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <Deferred>
                <PlayerCardPage />
              </Deferred>
            }
          />
        ))}
        {(["steam", "lichess"] as const).map((source) => (
          <Route
            key={source}
            path={`/${source}/connect/callback`}
            element={
              <ProtectedRoute>
                <ConnectionCallbackPage source={source} />
              </ProtectedRoute>
            }
          />
        ))}
        {handoffRoutes.map((path) => (
          <Route key={path} path={path} element={<AuthHandoffPage />} />
        ))}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/home"
            element={
              <Deferred>
                <HomePage />
              </Deferred>
            }
          />
          <Route
            path="/challenges"
            element={
              <Deferred>
                <ChallengesPage />
              </Deferred>
            }
          />
          <Route
            path="/challenges/new"
            element={
              <Deferred>
                <NewChallengePage />
              </Deferred>
            }
          />
          <Route
            path="/challenges/:challengeId"
            element={
              <Deferred>
                <ChallengeDetailPage />
              </Deferred>
            }
          />
          <Route
            path="/tournaments"
            element={
              <Deferred>
                <TournamentsPage />
              </Deferred>
            }
          />
          {["/tournaments/create", "/tournaments/:tournamentId/edit"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <Deferred>
                  <CreateTournamentPage />
                </Deferred>
              }
            />
          ))}
          <Route
            path="/tournaments/:tournamentId"
            element={
              <Deferred>
                <TournamentPage />
              </Deferred>
            }
          />
          <Route
            path="/ladders"
            element={
              <Deferred>
                <LaddersPage />
              </Deferred>
            }
          />
          {["/ladders/create", "/ladders/:ladderId/edit"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <Deferred>
                  <CreateLadderPage />
                </Deferred>
              }
            />
          ))}
          <Route
            path="/ladders/:ladderId"
            element={
              <Deferred>
                <LadderPage />
              </Deferred>
            }
          />
          <Route
            path="/teams"
            element={
              <Deferred>
                <CommunityDirectoryPage kind="team" />
              </Deferred>
            }
          />
          <Route
            path="/teams/create"
            element={
              <Deferred>
                <CommunityFormPage key="team-create" kind="team" />
              </Deferred>
            }
          />
          <Route
            path="/teams/:communitySlug/edit"
            element={
              <Deferred>
                <CommunityFormPage key="team-edit" kind="team" />
              </Deferred>
            }
          />
          <Route
            path="/teams/:communitySlug"
            element={
              <Deferred>
                <CommunityDetailPage kind="team" />
              </Deferred>
            }
          />
          <Route
            path="/hubs"
            element={
              <Deferred>
                <CommunityDirectoryPage kind="hub" />
              </Deferred>
            }
          />
          <Route
            path="/hubs/create"
            element={
              <Deferred>
                <CommunityFormPage key="hub-create" kind="hub" />
              </Deferred>
            }
          />
          <Route
            path="/hubs/:communitySlug/edit"
            element={
              <Deferred>
                <CommunityFormPage key="hub-edit" kind="hub" />
              </Deferred>
            }
          />
          <Route
            path="/hubs/:communitySlug"
            element={
              <Deferred>
                <CommunityDetailPage kind="hub" />
              </Deferred>
            }
          />
          <Route
            path="/messages"
            element={
              <Deferred>
                <MessagesPage />
              </Deferred>
            }
          />
          <Route
            path="/notifications"
            element={
              <Deferred>
                <NotificationsPage />
              </Deferred>
            }
          />
          <Route
            path="/feed"
            element={
              <Deferred>
                <FeedPage />
              </Deferred>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <Deferred>
                <PostPage />
              </Deferred>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <Deferred>
                <LeaderboardPage />
              </Deferred>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <Deferred>
                <ProfilePage />
              </Deferred>
            }
          />
          <Route
            path="/search"
            element={
              <Deferred>
                <SearchPage />
              </Deferred>
            }
          />
          <Route
            path="/users"
            element={
              <Deferred>
                <PlayersPage />
              </Deferred>
            }
          />
          <Route
            path="/games"
            element={
              <Deferred>
                <GamesPage />
              </Deferred>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <Deferred>
                <GameDetailPage />
              </Deferred>
            }
          />
          <Route
            path="/settings"
            element={
              <Deferred>
                <SettingsPage />
              </Deferred>
            }
          />
          <Route
            path="/matches"
            element={
              <Deferred>
                <MatchesPage />
              </Deferred>
            }
          />
          <Route
            path="/matches/log"
            element={
              <Deferred>
                <MatchesPage />
              </Deferred>
            }
          />
          <Route
            path="/matches/log/:submissionId"
            element={
              <Deferred>
                <MatchesPage />
              </Deferred>
            }
          />
          <Route
            path="/calendar"
            element={
              <Deferred>
                <CalendarPage />
              </Deferred>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
