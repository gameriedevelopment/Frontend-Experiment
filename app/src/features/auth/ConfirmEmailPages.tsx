import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { confirmEmail, confirmEmailChange, fetchSmsVerificationEnabled, syncUserWithBackend } from "./api";
import { useAuthStore } from "./authStore";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";

type State<T> = { status: "working" } | { status: "done"; value: T } | { status: "failed"; message: string };

/** Runs a one-time link's token exactly once, even under StrictMode's double effects. */
function useTokenAction<T>(action: (token: string) => Promise<T>) {
  const { token } = useParams();
  const ran = useRef(false);
  const [state, setState] = useState<State<T>>({ status: "working" });
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) return setState({ status: "failed", message: "This link is missing its code. Open it again from the email." });
    action(token)
      .then((value) => setState({ status: "done", value }))
      .catch((reason) => setState({ status: "failed", message: getApiErrorMessage(reason, "This link is invalid or has expired.") }));
  }, [action, token]);
  return state;
}

function Working({ title }: { title: string }) {
  return (
    <div role="status" className="grid gap-6">
      <AuthHeading title={title} description="This only takes a moment." />
      <Icon name="spinner" className="size-6 animate-spin text-lavender-300" weight="bold" />
    </div>
  );
}

function Failed({ title, message, action }: { title: string; message: string; action: ReactNode }) {
  return (
    <div className="grid gap-6">
      <AuthHeading title={title} />
      <Notice tone="danger">{message}</Notice>
      <div>{action}</div>
    </div>
  );
}

const verifyEmail = async (token: string) => {
  await confirmEmail(token);
  return (await fetchSmsVerificationEnabled()) ? "/verify-phone" : "/home";
};

/** The link from the sign-up email: confirms the address and signs the player in. */
export function ConfirmEmailPage() {
  const state = useTokenAction(verifyEmail);
  return (
    <AuthLayout stageTitle={["Welcome to", "Gamerie."]}>
      {state.status === "working" ? (
        <Working title="Confirming your email" />
      ) : state.status === "failed" ? (
        <Failed
          title="Email not confirmed"
          message={state.message}
          action={
            <LinkButton to="/verify-email" tone="outline">
              Send a new link
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-8">
          <AuthHeading title="Email confirmed" description={state.value === "/verify-phone" ? "One more step: add your phone number to secure your account." : "Your account is ready."} />
          <LinkButton to={state.value} size="lg" icon="arrowRight" orb className="w-full justify-between pl-7">
            Continue
          </LinkButton>
        </div>
      )}
    </AuthLayout>
  );
}

const changeEmail = async (token: string) => {
  const result = await confirmEmailChange(token);
  await syncUserWithBackend();
  return result.email;
};

/** The link sent to a new address from Settings: switches the account over to it. */
export function ConfirmEmailChangePage() {
  const state = useTokenAction(changeEmail);
  const signedIn = useAuthStore((store) => Boolean(store.user));
  const next = signedIn ? "/settings?section=account" : "/login";
  return (
    <AuthLayout stageTitle={["Your account,", "updated."]}>
      {state.status === "working" ? (
        <Working title="Updating your email" />
      ) : state.status === "failed" ? (
        <Failed
          title="Email not changed"
          message={state.message}
          action={
            <LinkButton to={next} tone="outline">
              {signedIn ? "Back to settings" : "Sign in"}
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-8">
          <AuthHeading title="Email changed" description={<>You'll sign in with <span className="font-semibold text-mist-100">{state.value}</span> from now on.</>} />
          <LinkButton to={next} size="lg" icon="arrowRight" orb className="w-full justify-between pl-7">
            {signedIn ? "Back to settings" : "Sign in"}
          </LinkButton>
        </div>
      )}
    </AuthLayout>
  );
}
