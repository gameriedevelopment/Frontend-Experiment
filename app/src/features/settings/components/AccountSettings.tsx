import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { changePassword, fetchSmsVerificationEnabled, requestEmailChange, signOut } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/authStore";
import type { PlayerProfile } from "@/features/profile/types";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { SettingsCard, SettingsRows } from "./SettingsParts";

// Phone parsing carries country metadata, so it loads only when someone opens the phone form.
const PhoneVerification = lazy(() => import("./PhoneVerification").then((module) => ({ default: module.PhoneVerification })));

function useFormattedPhone(phone: string | null) {
  const [formatted, setFormatted] = useState<string | null>(null);
  useEffect(() => {
    if (!phone) return;
    let live = true;
    void import("./PhoneVerification").then(({ formatPhone }) => live && setFormatted(formatPhone(phone)));
    return () => {
      live = false;
    };
  }, [phone]);
  return phone ? (formatted ?? phone) : null;
}

type Panel = "email" | "password" | "phone";

const providerNames: Record<string, string> = { google: "Google", facebook: "Facebook", discord: "Discord", apple: "Apple" };

function Row({ label, value, badge, action, children }: { label: string; value: ReactNode; badge?: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-mist-100">
            {label}
            {badge}
          </p>
          <p className="mt-0.5 truncate text-sm text-mist-400">{value}</p>
        </div>
        {action}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function Verified({ done }: { done: boolean }) {
  return done ? (
    <span className="type-label flex items-center gap-1 rounded-full bg-signal/10 px-2 py-0.5 text-signal">
      <Icon name="verified" className="size-3" />
      Verified
    </span>
  ) : (
    <span className="type-label rounded-full bg-white/6 px-2 py-0.5 text-mist-400">Not verified</span>
  );
}

function EmailForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(next)) return setError("Enter a valid email address.");
    setError("");
    setPending(true);
    try {
      await requestEmailChange(next, password);
      setSentTo(next);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "We couldn't start the change. Try again in a moment."));
    } finally {
      setPending(false);
    }
  };

  if (sentTo)
    return (
      <div className="grid gap-4">
        <Notice tone="signal" title="Check your inbox">
          We sent a confirmation link to {sentTo}. Your email changes when you open it.
        </Notice>
        <div>
          <Button tone="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="settings-new-email" label="New email" type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField id="settings-email-password" label="Current password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !email.trim() || !password}>
          {pending ? "Sending…" : "Send confirmation link"}
        </Button>
        <Button type="button" tone="ghost" size="sm" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (values.next.length < 8) return setError("Use at least 8 characters.");
    if (values.next === values.current) return setError("Pick a password that's different from your current one.");
    if (values.next !== values.confirm) return setError("The new passwords don't match.");
    setError("");
    setPending(true);
    try {
      await changePassword(values.current, values.next, values.confirm);
      toast.success("Password changed", "Sign in again with your new password.");
      await signOut();
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(getApiErrorMessage(reason, "We couldn't change your password. Try again in a moment."));
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <PasswordField
        id="settings-current-password"
        label="Current password"
        autoComplete="current-password"
        autoFocus
        value={values.current}
        onChange={set("current")}
        labelAction={
          <Link to="/forgot-password" className="text-xs font-medium text-lavender-300 hover:text-lavender-200">
            Forgot it?
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField id="settings-new-password" label="New password" autoComplete="new-password" value={values.next} onChange={set("next")} />
        <PasswordField id="settings-confirm-password" label="Confirm new password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} />
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : <p className="text-xs text-mist-500">At least 8 characters. You'll be signed out everywhere and asked to sign in again.</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !values.current || !values.next || !values.confirm}>
          {pending ? "Changing…" : "Change password"}
        </Button>
        <Button type="button" tone="ghost" size="sm" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AccountSettings({ profile }: { profile: PlayerProfile }) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const client = useQueryClient();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const sms = useQuery({ queryKey: ["sms-verification-enabled"], queryFn: fetchSmsVerificationEnabled, staleTime: 5 * 60_000, enabled: panel === "phone" });

  const provider = profile.signInProvider || (typeof user?.signInProvider === "string" ? user.signInProvider : "local");
  const local = provider === "local";
  const providerName = providerNames[provider] ?? provider;
  const email = profile.email || user?.email || "";
  const phone = (typeof user?.phoneNumber === "string" ? user.phoneNumber : null) || profile.phoneNumber || null;
  const phoneVerified = Boolean(user?.phoneVerified ?? profile.phoneVerified);
  const phoneLabel = useFormattedPhone(phone);
  // Each open form carries its own Cancel, so the row's button steps aside while it's open.
  const actionFor = (next: Panel, label: string) =>
    panel === next ? undefined : (
      <Button tone="outline" size="sm" onClick={() => setPanel(next)}>
        {label}
      </Button>
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <SettingsCard title="Sign-in" description={local ? "Changing your email or password asks for your current password." : undefined}>
        {!local && (
          <Notice className="mb-5">
            You sign in with {providerName}, so your email and password are managed there.
          </Notice>
        )}
        <SettingsRows>
          <Row label="Email" value={email || "Not set"} badge={<Verified done={Boolean(user?.emailVerified ?? profile.emailVerified)} />} action={local ? actionFor("email", "Change") : undefined}>
            {panel === "email" && <EmailForm onClose={() => setPanel(null)} />}
          </Row>
          {local ? (
            <Row label="Password" value="••••••••••" action={actionFor("password", "Change")}>
              {panel === "password" && <PasswordForm onClose={() => setPanel(null)} />}
            </Row>
          ) : (
            <Row label="Signed in with" value={providerName} />
          )}
        </SettingsRows>
      </SettingsCard>

      <SettingsCard title="Phone" description="Gamerie uses a verified number to confirm it's really you.">
        <Row label="Phone number" value={phoneLabel ?? "Not added"} badge={phone ? <Verified done={phoneVerified} /> : undefined} action={actionFor("phone", phone ? "Change" : "Add")}>
          {panel === "phone" &&
            (sms.data === false ? (
              <div className="grid gap-4">
                <Notice>Phone verification is paused right now. Try again later.</Notice>
                <div>
                  <Button tone="outline" size="sm" onClick={() => setPanel(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="h-36 rounded-2xl" />}>
                <PhoneVerification
                  current={phone}
                  onCancel={() => setPanel(null)}
                  onDone={() => {
                    setPanel(null);
                    void client.invalidateQueries({ queryKey: ["player-profile"] });
                    toast.success("Phone number verified");
                  }}
                />
              </Suspense>
            ))}
        </Row>
      </SettingsCard>

      <SettingsCard title="Session">
        <Row
          label="Sign out"
          value="Sign out of Gamerie on this device."
          action={
            <Button
              tone="outline"
              size="sm"
              icon="signOut"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                await signOut();
                navigate("/login", { replace: true });
              }}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          }
        />
      </SettingsCard>
    </div>
  );
}
