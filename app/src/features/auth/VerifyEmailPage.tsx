import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { resendConfirmationEmail, signOut } from "./api";
import { useAuthStore } from "./authStore";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";
import { Turnstile, useTurnstile } from "./components/Turnstile";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setVerificationOngoing = useAuthStore((state) => state.setVerificationOngoing);
  const pendingEmail = user?.email ?? sessionStorage.getItem("Gamerie_pending_email");
  const [email, setEmail] = useState(pendingEmail ?? "");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstile();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.emailVerified) navigate("/home", { replace: true });
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [navigate, user?.emailVerified]);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter the email address used to create your account.");
      return;
    }
    if (turnstile.blocking) {
      setError("Complete the verification check before resending the email.");
      return;
    }
    try {
      setIsResending(true);
      setError(null);
      setMessage(null);
      await resendConfirmationEmail(normalizedEmail, turnstile.token ?? undefined);
      sessionStorage.setItem("Gamerie_pending_email", normalizedEmail);
      setMessage("A new verification email has been sent.");
      setVerificationOngoing(false);
      startCountdown();
    } catch (requestError) {
      const status = (requestError as { response?: { status?: number } }).response?.status;
      setError(
        status === 400
          ? "This email address is already verified."
          : status === 404
            ? "We couldn't find this account."
            : getApiErrorMessage(requestError, "We couldn't resend the verification email."),
      );
    } finally {
      turnstile.renew();
      setIsResending(false);
    }
  };

  const backToLogin = async () => {
    try {
      await signOut();
    } catch {
      clearUser();
    }
    navigate("/login", { replace: true });
  };


  return (
    <AuthLayout stageTitle={["One step", "from the lobby."]} stageCopy="Verify your email and your player ID is ready.">
      <span className="mb-8 grid size-14 place-items-center rounded-2xl bg-lavender-400/12 text-lavender-300 ring-1 ring-inset ring-lavender-400/25">
        <Icon name="mail" className="size-7" weight="duotone" />
      </span>
      <AuthHeading
        title="Check your email"
        description={
          pendingEmail ? (
            <>
              We sent a verification link to <span className="font-medium text-mist-50">{pendingEmail}</span>. Open it
              to finish creating your account.
            </>
          ) : (
            "Enter the email address used to create your account and we'll send a fresh verification link."
          )
        }
      />

      <div className="mt-8 grid gap-5">
        {!pendingEmail && (
          <TextField
            id="verification-email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        )}
        <p className="text-sm leading-relaxed text-mist-500">
          It can take a few minutes to arrive. Check your spam folder if you don't see it.
        </p>
        {message && <Notice tone="signal">{message}</Notice>}
        {error && (
          <Notice tone="danger" title="Email not sent">
            {error}
          </Notice>
        )}
        <Turnstile {...turnstile.widget} />
        <Button
          tone="outline"
          size="lg"
          onClick={() => void resend()}
          disabled={isResending || countdown > 0 || turnstile.blocking || !email.trim()}
          className="w-full"
        >
          {isResending
            ? "Sending"
            : countdown > 0
              ? `Resend available in ${countdown}s`
              : "Resend verification email"}
        </Button>
        <button
          type="button"
          onClick={() => void backToLogin()}
          className="flex items-center justify-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50"
        >
          <Icon name="arrowLeft" className="size-4" />
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}
