import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthHandoffPage } from "@/features/auth/AuthHandoffPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { SignInPage } from "@/features/auth/SignInPage";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { AppShell } from "./shell/AppShell";
import { PlaceholderPage } from "./shell/PlaceholderPage";

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
  "/profile/:username",
  "/settings",
  "/matches",
  "/matches/log",
  "/matches/log/:submissionId",
  "/challenges",
  "/challenges/:challengeId",
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
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
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
          {shellRoutes.map((path) => (
            <Route key={path} path={path} element={<PlaceholderPage />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
