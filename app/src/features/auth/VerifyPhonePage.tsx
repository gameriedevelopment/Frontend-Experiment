import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { PhoneVerification } from "@/features/settings/components/PhoneVerification";
import { fetchSmsVerificationEnabled, signOut } from "./api";
import { useAuthStore } from "./authStore";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";

/** Sign-in sends players here until their phone is verified, when verification is switched on. */
export function VerifyPhonePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) return void navigate("/login", { replace: true });
    if (status !== "active") return void navigate("/verify-email", { replace: true });
    if (user.phoneVerified) return void navigate("/home", { replace: true });
    void fetchSmsVerificationEnabled().then((enabled) => {
      if (!active) return;
      if (!enabled) navigate("/home", { replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate, status, user]);

  const leave = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout stageTitle={["One last", "step."]}>
      {checking ? (
        <Icon name="spinner" className="size-6 animate-spin text-lavender-300" weight="bold" aria-label="Checking your account" />
      ) : (
        <div className="grid gap-8">
          <AuthHeading title="Add your phone" description="Gamerie uses a verified number to confirm it's really you. We'll text you a 6-digit code." />
          <PhoneVerification onDone={() => navigate("/home", { replace: true })} onCancel={() => void leave()} cancelLabel="Use another account" />
        </div>
      )}
    </AuthLayout>
  );
}
