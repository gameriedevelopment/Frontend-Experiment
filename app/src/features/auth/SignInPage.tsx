import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Checkbox, PasswordField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { beginSocialAuth, signIn, type SocialProvider } from "./api";
import { getRequiredSocialProvider } from "./authError";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";
import { SocialAuthOptions } from "./components/SocialAuthOptions";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().default(false),
});

type SignInFields = z.infer<typeof schema>;

const providerName = (provider: SocialProvider) =>
  provider.charAt(0).toUpperCase() + provider.slice(1);

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requiredProvider, setRequiredProvider] = useState<SocialProvider | null>(null);
  const [sessionNotice] = useState(() => {
    const notice = sessionStorage.getItem("Gamerie_session_notice");
    sessionStorage.removeItem("Gamerie_session_notice");
    return notice;
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    if (searchParams.get("error") === "social_login_failed") {
      setSubmitError(
        searchParams.get("errorMsg") || "Social sign in was cancelled or failed. Please try again.",
      );
    }
  }, [searchParams]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setRequiredProvider(null);
    try {
      const result = await signIn(values.email, values.password, values.remember);
      const previous = location.state?.from as
        | { pathname?: string; search?: string; hash?: string }
        | undefined;
      const returnTo = previous?.pathname
        ? `${previous.pathname}${previous.search ?? ""}${previous.hash ?? ""}`
        : "/home";
      navigate(result.next === "verify-phone" ? "/verify-phone" : returnTo, { replace: true });
    } catch (error) {
      setRequiredProvider(getRequiredSocialProvider(error));
      setSubmitError(
        getApiErrorMessage(error, "We couldn't sign you in. Check your details and try again."),
      );
    }
  });

  return (
    <AuthLayout
      stageTitle={["Welcome back,", "player."]}
      aside={
        <>
          New to Gamerie?{" "}
          <Link to="/register" className="font-semibold text-lavender-300 hover:text-lavender-200">
            Create account
          </Link>
        </>
      }
    >
      <AuthHeading title="Sign in" description="Continue to your player ID." />

      <form className="mt-9 grid gap-5" onSubmit={onSubmit} noValidate>
        {sessionNotice && <Notice tone="info">{sessionNotice}</Notice>}
        {submitError && (
          <Notice
            tone="danger"
            title={requiredProvider ? `Use ${providerName(requiredProvider)} to sign in` : "Sign in unsuccessful"}
          >
            {submitError}
            {requiredProvider && requiredProvider !== "apple" && (
              <button
                type="button"
                onClick={() => beginSocialAuth(requiredProvider)}
                className="mt-2 block font-semibold text-lavender-300 hover:text-lavender-200"
              >
                Continue with {providerName(requiredProvider)}
              </button>
            )}
          </Notice>
        )}

        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          labelAction={
            <Link to="/forgot-password" className="text-[0.8rem] font-medium text-lavender-300 hover:text-lavender-200">
              Forgot password?
            </Link>
          }
          {...register("password")}
        />
        <Checkbox label="Keep me signed in on this device" {...register("remember")} />

        <Button
          type="submit"
          size="lg"
          icon={isSubmitting ? undefined : "arrowRight"}
          orb
          disabled={isSubmitting}
          className="mt-1 w-full justify-between pl-7"
        >
          {isSubmitting ? (
            <span className="flex w-full items-center justify-center gap-2.5">
              <Icon name="spinner" className="size-4 animate-spin" weight="bold" />
              Signing in
            </span>
          ) : (
            "Continue to Gamerie"
          )}
        </Button>
      </form>

      <div className="mt-8">
        <SocialAuthOptions mode="signin" />
      </div>
    </AuthLayout>
  );
}
