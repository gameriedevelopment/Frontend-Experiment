import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageLoader } from "@/components/ui/Loader";
import { AuthHandoffPage } from "@/features/auth/AuthHandoffPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { SignInPage } from "@/features/auth/SignInPage";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { AppShell } from "./shell/AppShell";
import { PlaceholderPage } from "./shell/PlaceholderPage";

const HomePage = lazy(() =>
  import("@/features/home/HomePage").then((module) => ({ default: module.HomePage })),
);
const ChallengesPage = lazy(() =>
  import("@/features/challenges/ChallengesPage").then((module) => ({ default: module.ChallengesPage })),
);
const ChallengeDetailPage = lazy(() =>
  import("@/features/challenges/ChallengeDetailPage").then((module) => ({ default: module.ChallengeDetailPage })),
);
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const PlayerCardPage = lazy(() =>
  import("@/features/profile/PlayerCardPage").then((module) => ({ default: module.PlayerCardPage })),
);

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

const shellRoutes = [
  "/feed",
  "/post/:postId",
  "/users",
  "/search",
  "/games",
  "/games/:gameId",
  "/teams",
  "/teams/create",
  "/teams/:communitySlug",
  "/teams/:communitySlug/edit",
  "/hubs",
  "/hubs/create",
  "/hubs/:communitySlug",
  "/hubs/:communitySlug/edit",
  "/messages",
  "/notifications",
  "/settings",
  "/matches",
  "/matches/log",
  "/matches/log/:submissionId",
  "/tournaments",
  "/tournaments/create",
  "/tournaments/:tournamentId",
  "/tournaments/:tournamentId/edit",
  "/ladders",
  "/ladders/create",
  "/ladders/:ladderId",
  "/ladders/:ladderId/edit",
  "/leaderboard",
  "/calendar",
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
            path="/challenges/:challengeId"
            element={
              <Deferred>
                <ChallengeDetailPage />
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
          {shellRoutes.map((path) => (
            <Route key={path} path={path} element={<PlaceholderPage />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
