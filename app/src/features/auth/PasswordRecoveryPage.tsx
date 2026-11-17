import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { confirmPasswordReset, requestPasswordReset } from "./api";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";
import { PasswordChecklist } from "./components/PasswordChecklist";
import { Turnstile } from "./components/Turnstile";

const requestSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
});

// Same rules as sign-up; the reset endpoint also caps length at 35.
const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(35, "Use no more than 35 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

function Submit({ busy, idle, working }: { busy: boolean; idle: string; working: string }) {
  return (
    <Button type="submit" size="lg" icon={busy ? undefined : "arrowRight"} orb disabled={busy} className="mt-1 w-full justify-between pl-7">
      {busy ? (
        <span className="flex w-full items-center justify-center gap-2.5">
          <Icon name="spinner" className="size-4 animate-spin" weight="bold" />
          {working}
        </span>
      ) : (
        idle
      )}
    </Button>
  );
}

function RequestLink() {
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const turnstileRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const form = useForm<z.infer<typeof requestSchema>>({ resolver: zodResolver(requestSchema), defaultValues: { email: "" } });
  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileFailed(false);
  }, []);
  const onExpire = useCallback(() => setTurnstileToken(null), []);
  const onFail = useCallback(() => setTurnstileFailed(true), []);

  const submit = form.handleSubmit(async ({ email }) => {
    // A widget that can't load shouldn't trap people; the API still checks where it's configured.
    if (turnstileRequired && !turnstileToken && !turnstileFailed) return setError("Complete the check below to send a reset link.");
    setError(null);
    try {
      await requestPasswordReset(email, turnstileToken ?? undefined);
      setSentTo(email);
    } catch (reason) {
      setTurnstileToken(null);
      setError(getApiErrorMessage(reason, "We couldn't send the reset link. Try again."));
    }
  });

  if (sentTo)
    return (
      <>
        <AuthHeading title="Check your email" description={<>If an account exists for <span className="font-semibold text-mist-100">{sentTo}</span>, a reset link is on its way.</>} />
        <p className="mt-6 text-sm leading-relaxed text-mist-400">It can take a few minutes. If it doesn't arrive, check your spam folder.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button tone="outline" onClick={() => setSentTo("")}>
            Use another email
          </Button>
          <LinkButton to="/login" tone="ghost">
            Back to sign in
          </LinkButton>
        </div>
      </>
    );

  return (
    <>
      <AuthHeading title="Reset your password" description="Enter your email and we'll send you a link to choose a new one." />
      <form className="mt-9 grid gap-5" onSubmit={submit} noValidate>
        {error && (
          <Notice tone="danger" title="Link not sent">
            {error}
          </Notice>
        )}
        <TextField id="email" label="Email address" type="email" autoComplete="email" autoFocus placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} />
        {turnstileRequired && <Turnstile onVerify={onVerify} onExpire={onExpire} onError={onFail} />}
        <Submit busy={form.formState.isSubmitting} idle="Send reset link" working="Sending" />
      </form>
    </>
  );
}

function ChooseNewPassword({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } });
  const password = form.watch("password");

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await confirmPasswordReset({ ...values, resetToken: token });
      setDone(true);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "This link may have expired. Request a new one and try again."));
    }
  });

  if (done)
    return (
      <>
        <AuthHeading title="Password updated" description="Your new password is ready. Sign in with it to continue." />
        <LinkButton to="/login" size="lg" icon="arrowRight" orb className="mt-9 w-full justify-between pl-7">
          Continue to sign in
        </LinkButton>
      </>
    );

  return (
    <>
      <AuthHeading title="Choose a new password" description="Pick one you don't use anywhere else." />
      <form className="mt-9 grid gap-5" onSubmit={submit} noValidate>
        {error && (
          <Notice tone="danger" title="Password not updated">
            {error}{" "}
            <Link to="/forgot-password" className="font-semibold text-lavender-300 hover:text-lavender-200">
              Get a new link
            </Link>
          </Notice>
        )}
        <div className="grid gap-3">
          <PasswordField id="password" label="New password" autoComplete="new-password" autoFocus error={form.formState.errors.password?.message} {...form.register("password")} />
          <PasswordChecklist value={password} />
        </div>
        <PasswordField id="confirm-password" label="Confirm new password" autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />
        <Submit busy={form.formState.isSubmitting} idle="Update password" working="Updating" />
      </form>
    </>
  );
}

/** /forgot-password asks for an email; the link in that email opens /reset-password with its token. */
export function PasswordRecoveryPage() {
  const [params] = useSearchParams();
  const token = (params.get("mode") === "resetPassword" ? params.get("oobCode") : null) ?? params.get("resetToken") ?? params.get("token") ?? "";

  return (
    <AuthLayout
      stageTitle={["Back in", "the game."]}
      aside={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-lavender-300 hover:text-lavender-200">
            Sign in
          </Link>
        </>
      }
    >
      {token ? <ChooseNewPassword token={token} /> : <RequestLink />}
    </AuthLayout>
  );
}
