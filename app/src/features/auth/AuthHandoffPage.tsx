import { Link, useLocation } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { publicLinks } from "@/config/links";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";

const steps: Record<string, { title: string; stage: readonly [string, string] }> = {
  "/forgot-password": { title: "Reset your password", stage: ["Back in", "the game."] },
  "/reset-password": { title: "Choose a new password", stage: ["Back in", "the game."] },
  "/verify-phone": { title: "Verify your phone", stage: ["One step", "from the lobby."] },
};

// Auth steps that this experiment hasn't rebuilt yet continue in the live app with the same path and query.
export function AuthHandoffPage() {
  const { pathname, search, hash } = useLocation();
  const step = steps[pathname] ?? { title: "Continue on Gamerie", stage: ["Your game,", "on the record."] };
  const destination = new URL(`${pathname}${search}${hash}`, publicLinks.liveApp).href;

  return (
    <AuthLayout
      stageTitle={step.stage}
      aside={
        <Link to="/login" className="font-semibold text-lavender-300 hover:text-lavender-200">
          Back to sign in
        </Link>
      }
    >
      <AuthHeading
        title={step.title}
        description="This step hasn't been rebuilt in the new experience yet. Continue in the current Gamerie app; your account is the same."
      />
      <ButtonLink href={destination} size="lg" icon="arrowUpRight" orb className="mt-9 w-full justify-between pl-7">
        Continue in Gamerie
      </ButtonLink>
    </AuthLayout>
  );
}
