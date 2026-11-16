import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Checkbox, PasswordField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { Notice } from "@/components/ui/Notice";
import { publicLinks } from "@/config/links";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { registerAccount } from "./api";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";
import { SocialAuthOptions } from "./components/SocialAuthOptions";
import { Turnstile } from "./components/Turnstile";

const titles = ["Player", "Streamer", "Spectator", "Coach", "Trainer", "Analyst"] as const;
const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;
const platformLabels: Record<(typeof platforms)[number], string> = {
  PC: "PC",
  XBOX: "Xbox",
  PS5: "PS5",
  Switch: "Switch",
  Mobile: "Mobile",
};

const registrationSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters")
      .max(30, "Use no more than 30 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address")
      .email("Enter a valid email address"),
    dateOfBirth: z
      .string()
      .min(1, "Enter your date of birth")
      .refine((value) => {
        const birthDate = new Date(value);
        if (Number.isNaN(birthDate.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const month = today.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
        return age >= 16;
      }, "You must be 16 or older to create an account"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    termsAccepted: z.boolean().refine(Boolean, "Accept the terms to continue"),
    gamerTitle: z.enum(titles, {
      errorMap: () => ({ message: "Choose the option that describes you" }),
    }),
    gameLevel: z.enum(levels, { errorMap: () => ({ message: "Choose your gaming level" }) }),
    platforms: z.array(z.enum(platforms)).min(1, "Choose at least one platform"),
    referralCode: z.string().trim().max(32, "Referral code is too long").optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegistrationFields = z.infer<typeof registrationSchema>;
type RegistrationStep = 1 | 2 | 3;

const fieldsByStep: Record<RegistrationStep, Array<keyof RegistrationFields>> = {
  1: ["username", "email", "dateOfBirth"],
  2: ["password", "confirmPassword", "termsAccepted"],
  3: ["gamerTitle", "gameLevel", "platforms", "referralCode"],
};

const stepCopy: Record<RegistrationStep, { label: string; title: string; description: string }> = {
  1: { label: "Account", title: "Create your player ID", description: "Start with the essentials. You can add more later." },
  2: { label: "Security", title: "Secure your account", description: "Use a password you don't use anywhere else." },
  3: { label: "Your game", title: "Tell us how you play", description: "This sets up your player profile. You can change it any time." },
};

const passwordRules = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  { label: "Symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function StepIndicator({ step }: { step: RegistrationStep }) {
  return (
    <ol aria-label="Sign-up progress" className="mb-9 grid grid-cols-3 gap-2">
      {([1, 2, 3] as const).map((index) => (
        <li key={index} aria-current={index === step ? "step" : undefined}>
          <span
            className={cn(
              "block h-1 rounded-full transition-colors duration-500",
              index <= step ? "bg-lavender-400" : "bg-white/10",
            )}
          />
          <span
            className={cn(
              "mt-2.5 block text-xs font-medium transition-colors duration-500",
              index === step ? "text-mist-50" : "text-mist-500",
            )}
          >
            {stepCopy[index].label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul aria-label="Password requirements" className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 text-[0.8rem] transition-colors duration-300",
              met ? "text-mist-200" : "text-mist-500",
            )}
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full transition-colors duration-300",
                met ? "bg-lavender-400 text-ink-950" : "ring-1 ring-inset ring-white/15",
              )}
            >
              {met && <Icon name="check" className="size-2.5" weight="bold" />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<RegistrationStep>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const turnstileRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  // If verification can't load/errors, don't trap the user on a dead button.
  const turnstileBlocking = turnstileRequired && !turnstileToken && !turnstileFailed;
  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFields>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      platforms: [],
      referralCode: "",
    },
  });
  const password = watch("password");

  useEffect(() => {
    const referralCode = searchParams.get("ref");
    if (referralCode) setValue("referralCode", referralCode.toUpperCase());
    if (searchParams.get("error") === "social_login_failed") {
      setSubmitError(
        searchParams.get("errorMsg") || "Social sign up was cancelled or failed. Please try again.",
      );
    }
  }, [searchParams, setValue]);

  const nextStep = async () => {
    if (await trigger(fieldsByStep[step])) {
      setSubmitError(null);
      setStep((current) => Math.min(3, current + 1) as RegistrationStep);
    }
  };

  const onTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileFailed(false);
  }, []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), []);
  const onTurnstileError = useCallback(() => setTurnstileFailed(true), []);

  const onSubmit = handleSubmit(async (values) => {
    if (turnstileBlocking) {
      setSubmitError("Complete the verification check to create your account.");
      return;
    }
    setSubmitError(null);
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        username: values.username,
        role: "user",
        gamerTitle: values.gamerTitle,
        gameLevel: values.gameLevel,
        platforms: values.platforms,
        termsAccepted: values.termsAccepted,
        dateOfBirth: values.dateOfBirth,
        referralCode: values.referralCode || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });
      navigate("/verify-email", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "We couldn't create your account. Please try again.");
      setSubmitError(message);
      if ((error as { response?: { status?: number } }).response?.status === 409) setStep(1);
    }
  });

  return (
    <AuthLayout
      stageTitle={["Your game,", "on the record."]}
      stageCopy="One identity for the games you play, the teams you build and every result you earn."
      aside={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-lavender-300 hover:text-lavender-200">
            Sign in
          </Link>
        </>
      }
    >
      <StepIndicator step={step} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
        >
          <AuthHeading title={stepCopy[step].title} description={stepCopy[step].description} />
        </motion.div>
      </AnimatePresence>

      <form className="mt-8 grid gap-5" onSubmit={onSubmit} noValidate>
        {submitError && (
          <Notice tone="danger" title="Account not created">
            {submitError}
          </Notice>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="grid gap-5"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
          >
            {step === 1 && (
              <>
                <TextField
                  id="username"
                  label="Username"
                  autoComplete="username"
                  placeholder="Choose a username"
                  error={errors.username?.message}
                  {...register("username")}
                />
                <TextField
                  id="register-email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <TextField
                  id="date-of-birth"
                  label="Date of birth"
                  type="date"
                  autoComplete="bday"
                  max={new Date().toISOString().split("T")[0]}
                  error={errors.dateOfBirth?.message}
                  {...register("dateOfBirth")}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-3.5">
                  <PasswordField
                    id="register-password"
                    label="Password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordChecklist value={password} />
                </div>
                <PasswordField
                  id="confirm-password"
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Enter the password again"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <div className="grid gap-2">
                  <Checkbox
                    label={
                      <span>
                        I agree to Gamerie's{" "}
                        <a className="text-lavender-300 hover:text-lavender-200" href={publicLinks.terms}>
                          Terms
                        </a>{" "}
                        and{" "}
                        <a className="text-lavender-300 hover:text-lavender-200" href={publicLinks.privacy}>
                          Privacy Policy
                        </a>
                        .
                      </span>
                    }
                    {...register("termsAccepted")}
                  />
                  {errors.termsAccepted && (
                    <p role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
                      <Icon name="warning" className="size-3.5" weight="bold" />
                      {errors.termsAccepted.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <ChoiceGroup legend="What best describes you?" error={errors.gamerTitle?.message}>
                  {titles.map((title) => (
                    <ChoiceChip key={title} label={title} value={title} {...register("gamerTitle")} />
                  ))}
                </ChoiceGroup>
                <ChoiceGroup legend="Gaming level" columns={5} error={errors.gameLevel?.message}>
                  {levels.map((level) => (
                    <ChoiceChip
                      key={level}
                      label={level}
                      value={level}
                      className="[&>span]:px-2 [&>span]:text-[0.8rem]"
                      {...register("gameLevel")}
                    />
                  ))}
                </ChoiceGroup>
                <ChoiceGroup legend="Platforms" hint="Choose all that apply" columns={5} error={errors.platforms?.message}>
                  {platforms.map((platform) => (
                    <ChoiceChip
                      key={platform}
                      multiple
                      label={platformLabels[platform]}
                      value={platform}
                      className="[&>span]:px-2 [&>span]:text-[0.8rem]"
                      {...register("platforms")}
                    />
                  ))}
                </ChoiceGroup>
                <TextField
                  id="referral-code"
                  label="Referral code"
                  autoComplete="off"
                  placeholder="Enter code"
                  labelAction={<span className="text-xs text-mist-500">Optional</span>}
                  error={errors.referralCode?.message}
                  {...register("referralCode")}
                />
                <Turnstile onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} onError={onTurnstileError} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 flex gap-3">
          {step > 1 && (
            <Button
              tone="outline"
              size="lg"
              onClick={() => setStep((current) => (current - 1) as RegistrationStep)}
              className="px-5"
              aria-label="Back"
            >
              <Icon name="arrowLeft" className="size-4" weight="bold" />
            </Button>
          )}
          {step < 3 ? (
            <Button size="lg" icon="arrowRight" orb onClick={nextStep} className="flex-1 justify-between pl-7">
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              icon={isSubmitting ? undefined : "arrowRight"}
              orb
              disabled={isSubmitting || turnstileBlocking}
              className="flex-1 justify-between pl-7"
            >
              {isSubmitting ? (
                <span className="flex w-full items-center justify-center gap-2.5">
                  <Icon name="spinner" className="size-4 animate-spin" weight="bold" />
                  Creating account
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          )}
        </div>
      </form>

      {step === 1 && (
        <div className="mt-8">
          <SocialAuthOptions mode="signup" referralCode={searchParams.get("ref") ?? undefined} />
        </div>
      )}
    </AuthLayout>
  );
}
