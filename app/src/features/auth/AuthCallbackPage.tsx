import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button, LinkButton } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { fetchUserProfile, storeSessionToken, updateSocialProfile } from "./api";
import { useAuthStore } from "./authStore";
import { AuthHeading, AuthLayout } from "./components/AuthLayout";
import { levels, platformLabels, platforms, titles } from "./profileOptions";

const profileSchema = z.object({
  username: z.string().trim().min(3, "Use at least 3 characters").max(30, "Use no more than 30 characters"),
  gamerTitle: z.enum(titles, { errorMap: () => ({ message: "Choose what describes you" }) }),
  gameLevel: z.enum(levels, { errorMap: () => ({ message: "Choose your level" }) }),
  platforms: z.array(z.enum(platforms)).min(1, "Choose at least one platform"),
});
type ProfileFields = z.infer<typeof profileSchema>;

/** Where Google, Discord and Facebook send players back. First-time accounts finish their profile here. */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useAuthStore((store) => store.setUser);
  const ran = useRef(false);
  const [state, setState] = useState<"working" | "profile" | "failed">("working");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const form = useForm<ProfileFields>({ resolver: zodResolver(profileSchema), defaultValues: { username: "", platforms: [] } });

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get("token");
    const id = params.get("id");
    // The token arrives in the address; take it out before anything else can read or log it.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token || !id) {
      setError("This sign-in link is incomplete. Start again from the sign-in page.");
      return setState("failed");
    }
    (async () => {
      try {
        storeSessionToken(token);
        const profile = await fetchUserProfile(id);
        if (profile.isFirstSocialLogin) {
          setUserId(profile.id);
          form.setValue("username", profile.username ?? "");
          return setState("profile");
        }
        setUser(profile);
        navigate("/home", { replace: true });
      } catch (reason) {
        Cookies.remove("auth_token");
        setError(getApiErrorMessage(reason, "We couldn't finish signing you in. Try again."));
        setState("failed");
      }
    })();
  }, [form, navigate, params, setUser]);

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      await updateSocialProfile(userId, values);
      setUser(await fetchUserProfile(userId));
      navigate("/home", { replace: true });
    } catch (reason) {
      setError(getApiErrorMessage(reason, "We couldn't save your profile. Try again."));
    }
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <AuthLayout stageTitle={state === "profile" ? ["Set up your", "player ID."] : ["Welcome back,", "player."]}>
      {state === "working" ? (
        <div role="status" className="grid gap-6">
          <AuthHeading title="Signing you in" description="Connecting your account securely." />
          <Icon name="spinner" className="size-6 animate-spin text-lavender-300" weight="bold" />
        </div>
      ) : state === "failed" ? (
        <div className="grid gap-6">
          <AuthHeading title="Sign-in not finished" />
          <Notice tone="danger">{error}</Notice>
          <div>
            <LinkButton to="/login" tone="outline" icon="arrowRight">
              Try again
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          <AuthHeading title="Finish your profile" description="A few details so players and teams can find you." />
          <form className="mt-9 grid gap-6" onSubmit={submit} noValidate>
            {error && <Notice tone="danger">{error}</Notice>}
            <TextField id="username" label="Username" autoComplete="username" error={errors.username?.message} {...form.register("username")} />
            <ChoiceGroup legend="What best describes you?" error={errors.gamerTitle?.message}>
              {titles.map((title) => (
                <ChoiceChip key={title} label={title} value={title} {...form.register("gamerTitle")} />
              ))}
            </ChoiceGroup>
            <ChoiceGroup legend="Gaming level" columns={5} error={errors.gameLevel?.message}>
              {levels.map((level) => (
                <ChoiceChip key={level} label={level} value={level} className="[&>span]:px-2 [&>span]:text-[0.8rem]" {...form.register("gameLevel")} />
              ))}
            </ChoiceGroup>
            <ChoiceGroup legend="Platforms" hint="Choose all that apply" columns={5} error={errors.platforms?.message}>
              {platforms.map((platform) => (
                <ChoiceChip key={platform} multiple label={platformLabels[platform]} value={platform} className="[&>span]:px-2 [&>span]:text-[0.8rem]" {...form.register("platforms")} />
              ))}
            </ChoiceGroup>
            <Button type="submit" size="lg" icon={isSubmitting ? undefined : "arrowRight"} orb disabled={isSubmitting} className="w-full justify-between pl-7">
              {isSubmitting ? "Saving" : "Continue to Gamerie"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
